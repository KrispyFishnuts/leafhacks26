import json

from fastapi import FastAPI, UploadFile, File, Form
from vertexai.generative_models import Part, GenerationConfig

from app.prompts import MARKING_PROMPT_TEMPLATE
from app.services.vertex_client import get_model

app = FastAPI(title="LeafHacks26 - AI Exam Marker")

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
    and returns a score + per-criterion feedback using Gemini.
    """
    image_bytes = await image.read()

    prompt = MARKING_PROMPT_TEMPLATE.format(
        question=question,
        mark_scheme=mark_scheme,
        total_marks=total_marks,
    )

    image_part = Part.from_data(data=image_bytes, mime_type=image.content_type)

    response = model.generate_content(
        [image_part, prompt],
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    result = json.loads(response.text)
    return result