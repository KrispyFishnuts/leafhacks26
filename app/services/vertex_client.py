import os
import vertexai
from vertexai.generative_models import GenerativeModel

_model = None


def get_model() -> GenerativeModel:
    """
    Lazily initializes Vertex AI and returns a shared GenerativeModel
    instance. Auth is handled entirely via Application Default
    Credentials (ADC) - no API keys needed locally or on Cloud Run.
    """
    global _model
    if _model is None:
        project_id = os.environ["GOOGLE_CLOUD_PROJECT"]
        location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        vertexai.init(project=project_id, location=location)
        _model = GenerativeModel("gemini-2.5-flash")
    return _model