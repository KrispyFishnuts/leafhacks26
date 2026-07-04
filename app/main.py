import json
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from vertexai.generative_models import Part, GenerationConfig

from app.prompts import MARKING_INSTRUCTIONS
from app.services.vertex_client import get_model
from app.services.vision_client import extract_text

app = FastAPI(title="LeafHacks26 - AI Exam Marker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon-only setting — restrict this before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

model = get_model()

ALLOWED_TYPES = {"application/pdf"}  # plus anything starting with "image/"


def _validate_file(upload: UploadFile, field_name: str) -> None:
    content_type = upload.content_type or ""
    if not (content_type.startswith("image/") or content_type in ALLOWED_TYPES):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be an image or a PDF, got '{content_type}'.",
        )


async def _to_part(upload: UploadFile) -> Part:
    data = await upload.read()
    return Part.from_data(data=data, mime_type=upload.content_type)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/mark")
async def mark_answer(
    total_marks: int = Form(...),
    question_text: Optional[str] = Form(None),
    mark_scheme_text: Optional[str] = Form(None),
    answer_text: Optional[str] = Form(None),
    question_file: Optional[UploadFile] = File(None),
    mark_scheme_file: Optional[UploadFile] = File(None),
    answer_file: Optional[UploadFile] = File(None),
):
    """
    Marks a student's answer against a question and mark scheme.
    Each of question, mark scheme, and answer can be supplied as
    plain text OR as an uploaded file (image or PDF) - at least one
    form is required per field.
    """
    if not question_text and not question_file:
        raise HTTPException(status_code=400, detail="Provide the question as text or a file.")
    if not mark_scheme_text and not mark_scheme_file:
        raise HTTPException(status_code=400, detail="Provide the mark scheme as text or a file.")
    if not answer_text and not answer_file:
        raise HTTPException(status_code=400, detail="Provide the student's answer as text or a file.")

    for upload, name in [
        (question_file, "Question file"),
        (mark_scheme_file, "Mark scheme file"),
        (answer_file, "Answer file"),
    ]:
        if upload is not None:
            _validate_file(upload, name)

    content = [MARKING_INSTRUCTIONS.format(total_marks=total_marks)]

    content.append("Question:")
    content.append(await _to_part(question_file) if question_file else question_text)

    content.append("Mark scheme:")
    content.append(await _to_part(mark_scheme_file) if mark_scheme_file else mark_scheme_text)

    content.append("Student's answer:")

    answer_ocr_text = None
    if answer_file is not None:
        answer_bytes = await answer_file.read()
        content.append(Part.from_data(data=answer_bytes, mime_type=answer_file.content_type))

        # OCR only makes sense as a backstop for images - PDFs are read
        # natively by Gemini without needing a separate OCR pass.
        if answer_file.content_type and answer_file.content_type.startswith("image/"):
            answer_ocr_text = extract_text(answer_bytes)
            content.append(
                f"OCR transcription of the answer (may contain errors, cross-reference with the image):\n{answer_ocr_text}"
            )
    else:
        content.append(answer_text)

    response = model.generate_content(
        content,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    result = json.loads(response.text)
    result["ocr_text"] = answer_ocr_text
    return result