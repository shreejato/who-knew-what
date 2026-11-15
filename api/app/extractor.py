"""Backwards-compatible extraction module facade."""
from app.extraction.base import BaseExtractor, ExtractionMetrics
from app.extraction.gemini import GeminiExtractor
from app.extraction.adapted import AdaptedExtractor
from app.extraction.factory import get_extractor
from app.extraction.utils import (
    verify_and_align_quote,
    clean_json_response,
    sanitize_and_filter_extraction,
    EXTRACTION_PROMPT_TEMPLATE,
)

__all__ = [
    "BaseExtractor",
    "ExtractionMetrics",
    "GeminiExtractor",
    "AdaptedExtractor",
    "get_extractor",
    "verify_and_align_quote",
    "clean_json_response",
    "sanitize_and_filter_extraction",
    "EXTRACTION_PROMPT_TEMPLATE",
]
