import sys
from pathlib import Path
import pytest

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.rules.base import CandidateContradiction
from app.verifier.verifier import ContradictionVerifier


def test_verifier_drops_warning_if_quote_not_in_text():
    """CRITICAL INVARIANT: Drop warning if quotes are not exact substrings of the chapter text."""
    verifier = ContradictionVerifier()

    ch1_text = "Mara walked quietly through the library. The rain tapped against the glass."
    ch2_text = "Inspector Rao searched the study but found nothing."

    # Candidate with a quote that is NOT in ch1_text (hallucination)
    fake_candidate = CandidateContradiction(
        id="cand_1",
        type="premature_knowledge",
        severity="high",
        explanation="Mara speaks about the poison",
        chapter_a=1,
        quote_a="Mara shouted about the deadly poison",  # Not in ch1_text!
        chapter_b=2,
        quote_b="Inspector Rao searched the study",
        suggested_fix="Fix reference",
    )

    chapter_texts = {1: ch1_text, 2: ch2_text}
    results = verifier.verify_candidates([fake_candidate], chapter_texts, use_llm=False)

    # Must be dropped!
    assert len(results) == 0


def test_verifier_accepts_verbatim_warning():
    """Candidate with exact verbatim quotes is accepted and start/end offsets are populated."""
    verifier = ContradictionVerifier()

    ch1_text = "Mara walked quietly through the library. She knew the secret cipher was hidden."
    ch2_text = "Inspector Rao searched the study. Rao discovered the secret cipher at last."

    valid_candidate = CandidateContradiction(
        id="cand_2",
        type="premature_knowledge",
        severity="high",
        explanation="Mara knows about cipher before Rao found it",
        chapter_a=1,
        quote_a="She knew the secret cipher was hidden.",
        chapter_b=2,
        quote_b="Rao discovered the secret cipher at last.",
        suggested_fix="Move discovery earlier",
    )

    chapter_texts = {1: ch1_text, 2: ch2_text}
    results = verifier.verify_candidates([valid_candidate], chapter_texts, use_llm=False)

    assert len(results) == 1
    verified = results[0]
    assert verified.id == "cand_2"
    assert len(verified.evidence) == 2
    assert verified.evidence[0].start == ch1_text.find("She knew the secret cipher was hidden.")
    assert verified.evidence[1].start == ch2_text.find("Rao discovered the secret cipher at last.")
