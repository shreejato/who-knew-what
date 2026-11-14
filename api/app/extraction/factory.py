import os
from typing import Optional
from app.extraction.base import BaseExtractor
from app.extraction.gemini import GeminiExtractor
from app.extraction.adapted import AdaptedExtractor


def get_extractor(name: Optional[str] = None) -> BaseExtractor:
    """Factory to retrieve extractor based on EXTRACTOR environment variable or parameter."""
    choice = (name or os.getenv("EXTRACTOR", "gemini")).strip().lower()
    if choice == "adapted":
        return AdaptedExtractor()
    return GeminiExtractor()
