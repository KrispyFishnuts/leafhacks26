import json
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from vertexai.generative_models import Part, GenerationConfig

from app.prompts import MARKING_INSTRUCTIONS
from app.services.vertex_client import get_model
from app.services.vision_client import extract_text
from app.services.db import SessionLocal, MarkResult
from app.services.auth import create_user, authenticate_user, create_token, verify_token

app = FastAPI(title="Paramark")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon-only setting — restrict this before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

model = get_model()

ALLOWED_TYPES = {"application/pdf"}  # plus anything starting with "image/"


class AuthRequest(BaseModel):
    email: str
    password: str


def _validate_file(upload: UploadFile, field_name: str) -> None:
    content_type = upload.content_type or ""
    if not (content_type.startswith("image/") or content_type in ALLOWED_TYPES):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be an image or a PDF, got '{content_type}'.",
        )


async def _files_to_parts(files: Optional[List[UploadFile]], field_name: str) -> List[Part]:
    parts = []
    for upload in files or []:
        _validate_file(upload, field_name)
        data = await upload.read()
        parts.append(Part.from_data(data=data, mime_type=upload.content_type))
    return parts


async def _answer_files_to_parts_and_ocr(files: Optional[List[UploadFile]]):
    """
    Converts each answer file to a Gemini Part, and additionally runs
    Vision OCR on any image files as a backstop (skipped for PDFs,
    since Gemini reads those natively). Returns (parts, combined_ocr_text).
    """
    parts = []
    ocr_sections = []
    for i, upload in enumerate(files or [], start=1):
        _validate_file(upload, "Answer file")
        data = await upload.read()
        parts.append(Part.from_data(data=data, mime_type=upload.content_type))
        if upload.content_type and upload.content_type.startswith("image/"):
            page_text = extract_text(data)
            ocr_sections.append(f"--- Page {i} OCR ---\n{page_text}")
    combined_ocr = "\n\n".join(ocr_sections) if ocr_sections else None
    return parts, combined_ocr


async def get_current_user_id(authorization: str = Header(...)) -> int:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid session. Please sign in.")
    token = authorization.removeprefix("Bearer ")
    try:
        return verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/signup")
def signup(body: AuthRequest):
    try:
        user = create_user(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_token(user.id)
    return {"token": token, "email": user.email}


@app.post("/login")
def login(body: AuthRequest):
    try:
        user = authenticate_user(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = create_token(user.id)
    return {"token": token, "email": user.email}


@app.post("/mark")
async def mark_answer(
    question_text: Optional[str] = Form(None),
    mark_scheme_text: Optional[str] = Form(None),
    answer_text: Optional[str] = Form(None),
    question_files: Optional[List[UploadFile]] = File(None),
    mark_scheme_files: Optional[List[UploadFile]] = File(None),
    answer_files: Optional[List[UploadFile]] = File(None),
    user_id: int = Depends(get_current_user_id),
):
    """
    Marks a student's answer(s) against a question paper and mark
    scheme. Each of question, mark scheme, and answer can be supplied
    as plain text and/or one or more files (image or PDF) - covering
    either a single question or a full multi-question paper spread
    across several pages or photos. Marks per question are read
    directly from the mark scheme, no total is needed up front.
    """
    if not question_text and not question_files:
        raise HTTPException(status_code=400, detail="Provide the question(s) as text or file(s).")
    if not mark_scheme_text and not mark_scheme_files:
        raise HTTPException(status_code=400, detail="Provide the mark scheme as text or file(s).")
    if not answer_text and not answer_files:
        raise HTTPException(status_code=400, detail="Provide the student's answer(s) as text or file(s).")

    content = [MARKING_INSTRUCTIONS]

    content.append("Question paper:")
    if question_text:
        content.append(question_text)
    content.extend(await _files_to_parts(question_files, "Question file"))

    content.append("Mark scheme:")
    if mark_scheme_text:
        content.append(mark_scheme_text)
    content.extend(await _files_to_parts(mark_scheme_files, "Mark scheme file"))

    content.append("Student's answer(s):")
    if answer_text:
        content.append(answer_text)
    answer_parts, answer_ocr_text = await _answer_files_to_parts_and_ocr(answer_files)
    content.extend(answer_parts)
    if answer_ocr_text:
        content.append(
            f"OCR transcription of the answer pages (may contain errors, cross-reference with the images):\n{answer_ocr_text}"
        )

    response = model.generate_content(
        content,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    result = json.loads(response.text)
    result["ocr_text"] = answer_ocr_text

    db = SessionLocal()
    try:
        record = MarkResult(
            user_id=user_id,
            total_score=result["total_score"],
            max_score=result["max_score"],
            breakdown=result.get("questions", []),
            overall_feedback=result.get("overall_feedback", ""),
            ocr_text=answer_ocr_text,
        )
        db.add(record)
        db.commit()
    finally:
        db.close()

    return result


@app.get("/history")
def history(user_id: int = Depends(get_current_user_id)):
    db = SessionLocal()
    try:
        records = (
            db.query(MarkResult)
            .filter_by(user_id=user_id)
            .order_by(MarkResult.created_at.desc())
            .limit(20)
            .all()
        )
        return {
            "results": [
                {
                    "total_score": r.total_score,
                    "max_score": r.max_score,
                    "breakdown": r.breakdown,
                    "overall_feedback": r.overall_feedback,
                    "ocr_text": r.ocr_text,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in records
            ]
        }
    finally:
        db.close()


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")