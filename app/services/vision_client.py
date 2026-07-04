from google.cloud import vision

_client = None


def get_vision_client() -> vision.ImageAnnotatorClient:
    global _client
    if _client is None:
        _client = vision.ImageAnnotatorClient()
    return _client


def extract_text(image_bytes: bytes) -> str:
    """
    Runs OCR on an image using Cloud Vision's document text detection,
    which is tuned for dense/handwritten text (better than basic
    text_detection for exam answers).
    """
    client = get_vision_client()
    image = vision.Image(content=image_bytes)

    response = client.document_text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Vision API error: {response.error.message}")

    return response.full_text_annotation.text