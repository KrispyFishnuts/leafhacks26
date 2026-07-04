import json

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from vertexai.generative_models import Part, GenerationConfig

from app.prompts import MARKING_PROMPT_TEMPLATE
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/mark")
async def mark_answer(
    question: str = Form(...),
    mark_scheme: str = Form(...),
    total_marks: int = Form(...),
    image: UploadFile = File(...),
):
    """
    Accepts a photo of a handwritten exam answer plus a mark scheme,
    runs OCR via Cloud Vision, then sends both the OCR transcription
    and the original image to Gemini for marking.
    """
    image_bytes = await image.read()
    extracted_text = extract_text(image_bytes)

    prompt = MARKING_PROMPT_TEMPLATE.format(
        question=question,
        mark_scheme=mark_scheme,
        total_marks=total_marks,
    ) + f"\n\nOCR transcription (may contain errors, cross-reference with the image):\n{extracted_text}"

    image_part = Part.from_data(data=image_bytes, mime_type=image.content_type)

    response = model.generate_content(
        [image_part, prompt],
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    result = json.loads(response.text)
    result["ocr_text"] = extracted_text
    return result