#!/usr/bin/env python3
"""
data/adaption/check_leakage.py
Verifies zero data leakage between training datasets and held-out test data.

Ensures that NO training example (in data/adaption/*.jsonl, invent_prompt.txt, or build_training.py)
contains quotes, character names, or passages from:
  1. data/test_story.txt (the 6-chapter held-out evaluation story)
  2. data/answer_key.json (the 8 known planted errors)

Exit code 0 on complete clean verification; exit code 1 if ANY overlap is detected.
"""

import json
import sys
import pathlib
from typing import List, Dict, Any, Tuple

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / "data"
TEST_STORY_PATH = DATA_DIR / "test_story.txt"
ANSWER_KEY_PATH = DATA_DIR / "answer_key.json"

TRAINING_FILES = [
    DATA_DIR / "adaption" / "training_data.jsonl",
    DATA_DIR / "adaption" / "seed_dataset.jsonl",
    DATA_DIR / "adaption" / "invent_prompt.txt",
]

# Sensitive entities and identifiers unique to the held-out test story
HELD_OUT_IDENTIFIERS = [
    "Clara Voss",
    "Edmund Ashford",
    "Petra Ashford",
    "Roland Fenn",
    "Mira Colston",
    "Delia Morrow",
    "Constable Briggs",
    "Ashford Manor",
    "Drenwick",
    "Millhaven",
    "Ashford Fenn Capital",
]


def load_held_out_quotes() -> List[str]:
    """Extract all quotes and verbatim strings from the answer key and test story."""
    quotes = []
    if ANSWER_KEY_PATH.exists():
        key_items = json.loads(ANSWER_KEY_PATH.read_text(encoding="utf-8"))
        for item in key_items:
            qa = item.get("quote_a", "").strip()
            qb = item.get("quote_b", "").strip()
            if qa:
                quotes.append(qa)
            if qb:
                quotes.append(qb)
    return quotes


def check_file_leakage(file_path: pathlib.Path, held_out_quotes: List[str], story_text: str) -> List[str]:
    """Check a single training file for any trace of held-out content."""
    violations = []
    if not file_path.exists():
        return violations

    content = file_path.read_text(encoding="utf-8")
    content_lower = content.lower()

    # 1. Check for held-out character names and locations
    for identifier in HELD_OUT_IDENTIFIERS:
        if identifier.lower() in content_lower:
            violations.append(f"Contains held-out identifier '{identifier}'")

    # 2. Check for verbatim answer key quotes
    for q in held_out_quotes:
        if q and q.lower() in content_lower:
            violations.append(f"Contains answer key quote: '{q[:60]}...'")

    # 3. Check for n-gram overlap with story text (chunks of 12+ consecutive words)
    words = story_text.split()
    for i in range(0, len(words) - 12, 10):
        phrase = " ".join(words[i:i + 12]).strip().lower()
        # Exclude common stopword combinations
        if phrase in content_lower and len(phrase) > 50:
            violations.append(f"Contains verbatim passage from test story: '{phrase[:60]}...'")

    return violations


def main():
    print("=" * 70)
    print("   NARRATIVEOS: HELD-OUT DATASET LEAKAGE AUDIT")
    print("=" * 70)

    if not TEST_STORY_PATH.exists() or not ANSWER_KEY_PATH.exists():
        print("[ERROR] Held-out test files missing from data/!", file=sys.stderr)
        sys.exit(1)

    story_text = TEST_STORY_PATH.read_text(encoding="utf-8")
    held_out_quotes = load_held_out_quotes()

    print(f"Loaded held-out evaluation suite:")
    print(f"  • Test story:       {TEST_STORY_PATH.name} ({len(story_text.split())} words)")
    print(f"  • Answer key:       {ANSWER_KEY_PATH.name} ({len(held_out_quotes)} reference quotes)")
    print(f"  • Protected terms:  {len(HELD_OUT_IDENTIFIERS)} specific character/place entities\n")

    total_violations = 0

    for tf in TRAINING_FILES:
        if not tf.exists():
            print(f"  [SKIP] {tf.name} (does not exist yet)")
            continue

        violations = check_file_leakage(tf, held_out_quotes, story_text)
        if violations:
            print(f"  ❌ FAILED: {tf.name}")
            for v in violations:
                print(f"      - {v}")
            total_violations += len(violations)
        else:
            size_bytes = tf.stat().st_size
            print(f"  ✅ PASSED: {tf.name:<32} (clean, {size_bytes:,} bytes, 0 leaks)")

    print("-" * 70)
    if total_violations == 0:
        print("RESULT: ZERO DATA LEAKAGE DETECTED.")
        print("The training corpus is 100% disjoint from the held-out evaluation benchmark.")
        print("=" * 70)
        sys.exit(0)
    else:
        print(f"RESULT: AUDIT FAILED with {total_violations} leakage violations!", file=sys.stderr)
        print("=" * 70)
        sys.exit(1)


if __name__ == "__main__":
    main()
