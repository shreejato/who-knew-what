import json
import sys
from pathlib import Path
import pytest

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.models import Character, Fact, KnowledgeEvent, Reference, Event, Contradiction, ChapterExtraction
from app.cache import get_chapter_hash, get_cached_extraction, set_cached_extraction
from app.extractor import verify_and_align_quote, sanitize_and_filter_extraction

ROOT = Path(__file__).resolve().parents[2]


def test_schema_json_compatibility():
    """Verify our Pydantic models match the structure in contracts/schema.json."""
    schema_path = ROOT / "contracts" / "schema.json"
    assert schema_path.exists(), "schema.json must exist"
    data = json.loads(schema_path.read_text(encoding="utf-8"))

    # Test Character
    c = Character(**data["character"])
    assert c.id == "c1"
    assert c.name == "Mara"

    # Test Fact
    f = Fact(**data["fact"])
    assert f.id == "f1"
    assert f.claim == "Hale was poisoned"

    # Test KnowledgeEvent (schema.json uses exemplar string 'witnessed|told|overheard|deduced')
    ke_data = dict(data["knowledge_event"])
    if "|" in ke_data.get("mode", ""):
        ke_data["mode"] = "told"
    if "or null" in str(ke_data.get("source_character_id", "")):
        ke_data["source_character_id"] = "c2"
    ke = KnowledgeEvent(**ke_data)
    assert ke.character_id == "c1"
    assert ke.mode in ["witnessed", "told", "overheard", "deduced"]

    # Test Reference
    r = Reference(**data["reference"])
    assert r.character_id == "c1"

    # Test Event
    ev = Event(**data["event"])
    assert ev.id == "e1"

    # Test Contradiction (schema.json uses exemplar string 'premature_knowledge|presence|...')
    ct_data = dict(data["contradiction"])
    if "|" in ct_data.get("type", ""):
        ct_data["type"] = "premature_knowledge"
    if "|" in ct_data.get("severity", ""):
        ct_data["severity"] = "high"
    ct = Contradiction(**ct_data)
    assert ct.id == "x1"
    assert ct.type == "premature_knowledge"


def test_quote_verification():
    """Quotes must be exact substrings; otherwise verify_and_align_quote fails."""
    sample_text = "Mara whispered to Hale that the secret door was behind the library bookshelf."

    # Exact substring
    exact_quote = "the secret door was behind"
    is_exact, start, end = verify_and_align_quote(exact_quote, sample_text)
    assert is_exact is True
    assert sample_text[start:end] == exact_quote

    # Fabricated / hallucinated quote
    hallucinated = "the hidden door was behind"
    is_exact, _, _ = verify_and_align_quote(hallucinated, sample_text)
    assert is_exact is False


def test_sanitization_drops_invalid_quotes():
    """Extractor must drop any fact or reference whose quote is not an exact substring."""
    chapter_text = "Inspector Rao inspected the study. Hale owed more than he could repay."
    raw_data = {
        "characters": [{"id": "c1", "name": "Inspector Rao", "aliases": []}],
        "facts": [
            # Valid verbatim quote
            {"id": "f1", "claim": "Hale owes money", "chapter": 1, "quote": "Hale owed more than he could repay."},
            # Hallucinated quote -> must be dropped
            {"id": "f2", "claim": "Hale was killed with poison", "chapter": 1, "quote": "Hale was murdered with arsenic."}
        ],
        "knowledge_events": [],
        "references": [],
        "events": []
    }

    result, total_checked, valid_verbatim = sanitize_and_filter_extraction(raw_data, chapter_text, chapter_num=1)
    assert len(result.characters) == 1
    assert len(result.facts) == 1
    assert result.facts[0].id == "f1"
    assert result.facts[0].quote == "Hale owed more than he could repay."
    assert result.facts[0].start is not None


def test_caching_roundtrip(tmp_path, monkeypatch):
    """Ensure chapter hashing and cache read/write work properly."""
    monkeypatch.setattr("app.cache.CACHE_DIR", tmp_path)
    text = "Chapter 1. It was a dark and stormy night."
    ch_hash = get_chapter_hash(text)

    # Initially empty
    assert get_cached_extraction(ch_hash) is None

    # Write to cache
    payload = {"characters": [{"id": "c1", "name": "Elena", "aliases": []}]}
    set_cached_extraction(ch_hash, payload)

    # Read back
    cached = get_cached_extraction(ch_hash)
    assert cached is not None
    assert cached["characters"][0]["name"] == "Elena"
