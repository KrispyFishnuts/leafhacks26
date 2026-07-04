from google.cloud import texttospeech

_client = None


def get_tts_client() -> texttospeech.TextToSpeechClient:
    global _client
    if _client is None:
        _client = texttospeech.TextToSpeechClient()
    return _client


def synthesize_speech(text: str, voice_name: str, language_code: str) -> bytes:
    client = get_tts_client()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(language_code=language_code, name=voice_name)
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
    return response.audio_content


def split_text(text: str, max_chars: int = 4000) -> list[str]:
    """
    Cloud TTS has a hard limit on input length per request. This splits
    long exam text into chunks at sentence boundaries where possible,
    so narration doesn't cut off mid-sentence between audio clips.
    """
    text = text.strip()
    if len(text) <= max_chars:
        return [text] if text else []

    chunks = []
    remaining = text
    while len(remaining) > max_chars:
        window = remaining[:max_chars]
        split_at = max(window.rfind(". "), window.rfind("\n"))
        if split_at < max_chars * 0.5:
            split_at = max_chars  # no good sentence break - hard cut
        chunks.append(remaining[:split_at + 1].strip())
        remaining = remaining[split_at + 1:].strip()
    if remaining:
        chunks.append(remaining)
    return chunks