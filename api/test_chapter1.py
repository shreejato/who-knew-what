"""Test Gemini chapter extraction end-to-end on a realistic sample chapter."""
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Ensure api directory is on sys.path
API_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(API_DIR))
ROOT_DIR = API_DIR.parent

# Load .env from root and api
load_dotenv(ROOT_DIR / ".env")
load_dotenv(API_DIR / ".env")


from app.extractor import GeminiExtractor
from app.cache import get_chapter_hash, CACHE_DIR

SAMPLE_CHAPTER = """Chapter 1. The Broken Seal.

Mara arrived at the manor just after dusk, shaking the cold rain from her coat.
Hale met her in the candlelit foyer with a hurried whisper. "Inspector Rao has already searched the study," Hale warned her, his hands trembling. "He knows the ledger was stolen, but he doesn't know about the cipher."
Mara nodded quietly. She had hidden the cipher behind the library portrait that very morning.
Outside, the church bells struck eight, and a lone carriage rattled down the cobblestone drive.
"""

def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY is not set in .env! Please paste your key in .env.")
        return

    print("--> Initializing Gemini Extractor...")
    extractor = GeminiExtractor()

    print("--> Extracting Chapter 1...")
    result = extractor.extract_chapter(
        chapter_text=SAMPLE_CHAPTER,
        chapter_num=1,
        known_characters=["Mara", "Hale"],
        use_cache=True,
    )

    print("\n[SUCCESS] Extraction completed matching contracts/schema.json!")
    print(f"Characters extracted : {len(result.characters)}")
    for c in result.characters:
        print(f"  - {c.name} (id: {c.id}, aliases: {c.aliases})")

    print(f"\nFacts extracted      : {len(result.facts)}")
    for f in result.facts:
        print(f"  - [{f.id}] \"{f.claim}\" (quote: \"{f.quote}\", start: {f.start}, end: {f.end})")

    print(f"\nKnowledge Events     : {len(result.knowledge_events)}")
    for ke in result.knowledge_events:
        print(f"  - {ke.character_id} learned {ke.fact_id} via {ke.mode} (from {ke.source_character_id})")

    print(f"\nReferences           : {len(result.references)}")
    for r in result.references:
        print(f"  - {r.character_id} referenced {r.fact_id} (quote: \"{r.quote}\")")

    ch_hash = get_chapter_hash(SAMPLE_CHAPTER)
    cache_file = CACHE_DIR / f"{ch_hash}.json"
    print(f"\n[CACHE] Cached at: {cache_file} (exists: {cache_file.exists()})")


if __name__ == "__main__":
    main()
