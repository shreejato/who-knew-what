import sys
from pathlib import Path
import pytest

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.extraction.factory import get_extractor
from app.extraction.gemini import GeminiExtractor
from app.extraction.adapted import AdaptedExtractor
from app.models import ChapterExtraction


def test_extractor_switch(monkeypatch):
    """Test switching between gemini and adapted via EXTRACTOR environment variable."""
    monkeypatch.setenv("EXTRACTOR", "gemini")
    ext_gemini = get_extractor()
    assert isinstance(ext_gemini, GeminiExtractor)

    monkeypatch.setenv("EXTRACTOR", "adapted")
    ext_adapted = get_extractor()
    assert isinstance(ext_adapted, AdaptedExtractor)


def test_adapted_extractor_contract(monkeypatch, tmp_path):
    """AdaptedExtractor returns valid ChapterExtraction conforming to schema.json."""
    monkeypatch.setattr("app.cache.CACHE_DIR", tmp_path)
    extractor = AdaptedExtractor()
    sample_text = "Chapter 1. Elena opened the carved wooden chest."

    result = extractor.extract_chapter(sample_text, chapter_num=1, use_cache=False)
    assert isinstance(result, ChapterExtraction)
    assert len(extractor.call_logs) > 0
    metric = extractor.call_logs[0]
    assert metric.extractor_name == "adapted"
    assert metric.json_valid is True
    assert metric.latency_ms >= 0
    assert 0.0 <= metric.quote_exactness_rate <= 1.0
