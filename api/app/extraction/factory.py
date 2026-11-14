import os
from typing import Optional, Dict
from app.extraction.base import BaseExtractor
from app.extraction.gemini import GeminiExtractor
from app.extraction.adapted import AdaptedExtractor

_INSTANCES: Dict[str, BaseExtractor] = {}


def get_extractor(name: Optional[str] = None) -> BaseExtractor:
    """Retrieve shared extractor instance based on parameter or EXTRACTOR env var."""
    choice = (name or os.getenv("EXTRACTOR", "gemini")).strip().lower()
    if choice not in _INSTANCES:
        if choice == "adapted":
            _INSTANCES[choice] = AdaptedExtractor()
        else:
            _INSTANCES[choice] = GeminiExtractor()
    return _INSTANCES[choice]
