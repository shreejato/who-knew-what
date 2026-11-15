import sys
from pathlib import Path
import pytest

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.models import Character, Fact, KnowledgeEvent, Reference, Event
from app.rules.premature_knowledge import check_premature_knowledge
from app.rules.presence import check_presence
from app.rules.timeline import check_timeline
from app.rules.attribute import check_attributes
from app.rules.engine import RuleEngine


def test_premature_knowledge_detected():
    """Character references fact in chapter 2, but only learns it in chapter 4."""
    chars = [
        Character(id="c1", name="Rao", aliases=["Inspector Rao"]),
        Character(id="c2", name="Lawyer", aliases=[]),
    ]
    facts = [
        Fact(id="f1", claim="The will was changed", chapter=1, quote="The will was changed last week.", start=0, end=30)
    ]
    # Rao learns it in chapter 4
    kes = [
        KnowledgeEvent(character_id="c1", fact_id="f1", chapter=4, mode="told", source_character_id="c2", quote="The lawyer told Rao of the will.")
    ]
    # Rao speaks about it in chapter 2!
    refs = [
        Reference(character_id="c1", fact_id="f1", chapter=2, quote="Rao mentioned the altered will to the clerk.", start=0, end=40)
    ]

    candidates = check_premature_knowledge(chars, facts, kes, refs)
    assert len(candidates) == 1
    assert candidates[0].type == "premature_knowledge"
    assert candidates[0].chapter_a == 2
    assert candidates[0].chapter_b == 4


def test_premature_knowledge_not_triggered_when_originator():
    """Character who is the source of the fact referencing it should NOT trigger premature knowledge."""
    chars = [Character(id="c1", name="Mara", aliases=[])]
    facts = [Fact(id="f1", claim="The poison was purchased", chapter=1, quote="Mara bought the poison.", start=0, end=20)]
    kes = [
        KnowledgeEvent(character_id="c2", fact_id="f1", chapter=2, mode="told", source_character_id="c1", quote="Mara confessed to Hale.")
    ]
    refs = [Reference(character_id="c1", fact_id="f1", chapter=1, quote="Mara hid the vial.", start=0, end=15)]

    candidates = check_premature_knowledge(chars, facts, kes, refs)
    assert len(candidates) == 0


def test_presence_dead_character():
    """A character reported dead in chapter 2 appears in chapter 3."""
    chars = [Character(id="c1", name="Lord Hale", aliases=["Hale"])]
    facts = [
        Fact(id="f1", claim="Lord Hale was murdered in the study", chapter=2, quote="Lord Hale lay dead on the rug.", start=0, end=30)
    ]
    events = [
        Event(id="e1", chapter=3, summary="Breakfast in the dining room", participants=["c1"], quote="Lord Hale poured himself tea.")
    ]

    candidates = check_presence(chars, facts, events)
    assert len(candidates) == 1
    assert candidates[0].type == "presence"
    assert candidates[0].chapter_a == 2
    assert candidates[0].chapter_b == 3


def test_timeline_regression():
    """Day 5 appears in chapter 1, but Day 2 appears in chapter 2."""
    events = [
        Event(id="e1", chapter=1, summary="Arrival", time_marker="Day 5 morning", participants=[], quote="On Day 5 morning she arrived."),
        Event(id="e2", chapter=2, summary="Search", time_marker="Day 2 evening", participants=[], quote="By Day 2 evening they began."),
    ]
    candidates = check_timeline(events)
    assert len(candidates) == 1
    assert candidates[0].type == "timeline"


def test_attribute_contradiction():
    """Character has blue eyes in chapter 1, green eyes in chapter 2."""
    chars = [Character(id="c1", name="Mara", aliases=[])]
    facts = [
        Fact(id="f1", claim="Mara has blue eyes", chapter=1, quote="Mara's blue eyes sparkled in the lamplight.", start=0, end=35),
        Fact(id="f2", claim="Mara has green eyes", chapter=2, quote="Mara stared with green eyes unblinking.", start=0, end=35),
    ]
    candidates = check_attributes(chars, facts)
    assert len(candidates) == 1
    assert candidates[0].type == "attribute"
