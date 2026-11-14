from typing import List
from app.models import Character, Fact, KnowledgeEvent, Reference, Event
from app.rules.base import CandidateContradiction
from app.rules.premature_knowledge import check_premature_knowledge
from app.rules.presence import check_presence
from app.rules.timeline import check_timeline
from app.rules.attribute import check_attributes


class RuleEngine:
    """Executes rule-based contradiction detection across extracted story entities."""

    def run(
        self,
        characters: List[Character],
        facts: List[Fact],
        knowledge_events: List[KnowledgeEvent],
        references: List[Reference],
        events: List[Event],
    ) -> List[CandidateContradiction]:
        candidates: List[CandidateContradiction] = []

        # 1. Premature knowledge (highest priority)
        candidates.extend(check_premature_knowledge(characters, facts, knowledge_events, references))

        # 2. Presence
        candidates.extend(check_presence(characters, facts, events))

        # 3. Timeline
        candidates.extend(check_timeline(events))

        # 4. Attribute
        candidates.extend(check_attributes(characters, facts))

        return candidates
