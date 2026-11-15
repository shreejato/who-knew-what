import hashlib
import json
from pathlib import Path
from typing import Optional, Dict, Any

CACHE_DIR = Path(__file__).resolve().parents[2] / ".cache" / "extraction"


def get_chapter_hash(chapter_text: str) -> str:
    """Return SHA-256 hash of chapter text."""
    return hashlib.sha256(chapter_text.strip().encode("utf-8")).hexdigest()


def get_cached_extraction(chapter_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve cached extraction JSON if available."""
    cache_file = CACHE_DIR / f"{chapter_hash}.json"
    if cache_file.exists():
        try:
            return json.loads(cache_file.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def set_cached_extraction(chapter_hash: str, data: Dict[str, Any]) -> None:
    """Store extraction JSON in cache."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{chapter_hash}.json"
    cache_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
