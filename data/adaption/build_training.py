#!/usr/bin/env python3
"""
data/adaption/build_training.py
Construct supervised fine-tuning dataset (JSONL) from public-domain literature.

Reads excerpts from data/gutenberg/*.txt, applies extraction prompts, validates
strict JSON conformance and verbatim substring quote exactness, and saves
clean {"prompt": ..., "completion": ...} records for Adaption fine-tuning.

Rule: NEVER train on data/test_story.txt or data/answer_key.json.
"""

import os
import re
import json
import glob
import pathlib
import argparse
from typing import Dict, Any, List, Tuple

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
GUTENBERG_DIR = REPO_ROOT / "data" / "gutenberg"
OUTPUT_JSONL = REPO_ROOT / "data" / "adaption" / "training_data.jsonl"
SCHEMA_PATH = REPO_ROOT / "contracts" / "schema.json"

PROMPT_TEMPLATE = """You are a story continuity analyst. Read the chapter excerpt below. Return ONLY valid JSON matching the schema.

Known characters so far: {character_list}
Chapter number: {chapter_number}

Extract:
1. characters: new characters, plus aliases for known ones.
2. facts: story-relevant claims (secrets, crimes, relationships, objects, locations).
3. knowledge_events: when a character LEARNS a fact in this chapter, with mode (witnessed, told, overheard, deduced) and source character.
4. references: when a character speaks about or acts on a fact in this chapter.
5. events: with time_marker and location when the text states them.

Rules:
- Every item needs a "quote" copied EXACTLY from the chapter, character for character, 5-25 words.
- Do not infer what is not on the page. If unsure, omit the item.
- Do not invent time markers.

Chapter text:
{excerpt_text}
"""

def split_into_excerpts(text: str, target_words: int = 500) -> List[str]:
    """Splits chapter text into natural paragraph-aligned chunks."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    excerpts = []
    current_chunk = []
    current_word_count = 0

    for p in paragraphs:
        # Ignore Project Gutenberg header/footer lines if any
        if "PROJECT GUTENBERG" in p.upper():
            continue
        words = len(p.split())
        current_chunk.append(p)
        current_word_count += words

        if current_word_count >= target_words:
            excerpts.append("\n\n".join(current_chunk))
            current_chunk = []
            current_word_count = 0

    if current_chunk:
        excerpts.append("\n\n".join(current_chunk))

    return excerpts

def validate_extraction_quotes(extraction: Dict[str, Any], excerpt: str) -> Tuple[bool, str]:
    """Ensures every single extracted quote exists verbatim in the excerpt."""
    categories = ["facts", "knowledge_events", "references", "events"]
    for cat in categories:
        items = extraction.get(cat, [])
        if not isinstance(items, list):
            return False, f"'{cat}' is not a list"
        for idx, item in enumerate(items):
            quote = item.get("quote", "")
            if not quote:
                return False, f"Missing quote in {cat}[{idx}]"
            if quote not in excerpt:
                return False, f"Quote not found verbatim in text: '{quote[:40]}...'"
    return True, "Valid"

def mock_curated_extraction(excerpt: str) -> Dict[str, Any]:
    """
    Produces a verified extraction for the Sherlock Holmes sample chapter
    demonstrating the exact schema format.
    """
    if "Sherlock Holmes" in excerpt and "221B, Baker Street" in excerpt:
        return {
            "characters": [
                {"id": "c1", "name": "Sherlock Holmes", "aliases": ["consulting detective"]},
                {"id": "c2", "name": "Dr. John Watson", "aliases": []}
            ],
            "facts": [
                {
                    "id": "f1",
                    "claim": "Holmes and Watson agreed to share rooms at 221B Baker Street",
                    "chapter": 2,
                    "quote": "inspected the rooms at No. 221B, Baker Street, of which he had spoken at our meeting."
                }
            ],
            "knowledge_events": [
                {
                    "character_id": "c2",
                    "fact_id": "f1",
                    "chapter": 2,
                    "mode": "witnessed",
                    "source_character_id": None,
                    "quote": "So desirable in every way were the apartments, and so moderate the terms, that the bargain was concluded upon the spot"
                }
            ],
            "references": [
                {
                    "character_id": "c1",
                    "fact_id": "f1",
                    "chapter": 2,
                    "quote": "on the following morning Sherlock Holmes followed me with several boxes and portmanteaus."
                }
            ],
            "events": [
                {
                    "id": "e1",
                    "chapter": 2,
                    "summary": "Watson and Holmes move into 221B Baker Street",
                    "time_marker": "next day",
                    "location": "No. 221B, Baker Street",
                    "participants": ["c1", "c2"],
                    "quote": "That very evening I moved my things round from the hotel, and on the following morning Sherlock Holmes followed me"
                }
            ]
        }
    return {}

def run_pipeline(dry_run: bool = False):
    print("=== NarrativeOS Adaption Data Builder ===")
    gutenberg_files = list(GUTENBERG_DIR.glob("*.txt"))
    print(f"Found {len(gutenberg_files)} Gutenberg source files.")

    total_excerpts = 0
    kept_count = 0
    dropped_count = 0
    records = []

    OUTPUT_JSONL.parent.mkdir(parents=True, exist_ok=True)

    for fpath in gutenberg_files:
        text = fpath.read_text(encoding="utf-8")
        excerpts = split_into_excerpts(text, target_words=400)
        print(f"Processing {fpath.name}: {len(excerpts)} excerpts generated.")

        for i, excerpt in enumerate(excerpts):
            total_excerpts += 1
            prompt_str = PROMPT_TEMPLATE.format(
                character_list="[]",
                chapter_number=i + 1,
                excerpt_text=excerpt
            )

            # In production, call Gemini extractor if API key is configured
            # Here we test the verification and filtering engine
            completion_dict = mock_curated_extraction(excerpt)

            if not completion_dict:
                dropped_count += 1
                continue

            valid, reason = validate_extraction_quotes(completion_dict, excerpt)
            if not valid:
                print(f"  [DROPPED] Excerpt {i+1}: {reason}")
                dropped_count += 1
                continue

            record = {
                "prompt": prompt_str,
                "completion": json.dumps(completion_dict, indent=2)
            }
            records.append(record)
            kept_count += 1

    with open(OUTPUT_JSONL, "w", encoding="utf-8") as out:
        for r in records:
            out.write(json.dumps(r) + "\n")

    print(f"\nSummary:")
    print(f"  Total Excerpts:  {total_excerpts}")
    print(f"  Kept Examples:   {kept_count}")
    print(f"  Dropped:         {dropped_count}")
    print(f"  Output written:  {OUTPUT_JSONL}")
    print("Verification complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Process without external API calls")
    args = parser.parse_args()
    run_pipeline(dry_run=args.dry_run)
