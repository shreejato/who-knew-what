import uuid
from typing import List, Dict
from app.models import Character, Fact, Event
from app.rules.base import CandidateContradiction

DEATH_KEYWORDS = ["dead", "killed", "died", "murdered", "slain", "passed away", "corpse", "deceased"]


def check_presence(
    characters: List[Character],
    facts: List[Fact],
    events: List[Event],
) -> List[CandidateContradiction]:
    """Check for impossible presence:
    1. Dead characters participating in later events.
    2. Same character in two different locations with identical time markers."""
    char_map: Dict[str, Character] = {c.id: c for c in characters}
    candidates: List[CandidateContradiction] = []

    # 1. Death followed by later event participation
    death_facts: Dict[str, Fact] = {}
    for fact in facts:
        claim_lower = fact.claim.lower()
        if any(kw in claim_lower for kw in DEATH_KEYWORDS):
            for c_id, char in char_map.items():
                if char.name.lower() in claim_lower or any(alias.lower() in claim_lower for alias in char.aliases):
                    if c_id not in death_facts or fact.chapter < death_facts[c_id].chapter:
                        death_facts[c_id] = fact

    for event in events:
        for c_id, death_fact in death_facts.items():
            if c_id in event.participants and event.chapter > death_fact.chapter:
                char_name = char_map[c_id].name if c_id in char_map else c_id
                candidates.append(
                    CandidateContradiction(
                        id=f"pr_{uuid.uuid4().hex[:6]}",
                        type="presence",
                        severity="high",
                        explanation=f"{char_name} died in Chapter {death_fact.chapter}, but appears as a participant in Chapter {event.chapter}.",
                        chapter_a=death_fact.chapter,
                        quote_a=death_fact.quote,
                        start_a=death_fact.start or 0,
                        end_a=death_fact.end or 0,
                        chapter_b=event.chapter,
                        quote_b=event.quote,
                        suggested_fix=f"Remove {char_name} from the scene in Chapter {event.chapter} or clarify their appearance as a flashback.",
                    )
                )

    # 2. Same character in two places at the same time
    for i in range(len(events)):
        ev1 = events[i]
        if not ev1.time_marker or not ev1.location:
            continue
        for j in range(i + 1, len(events)):
            ev2 = events[j]
            if not ev2.time_marker or not ev2.location:
                continue
            if ev1.time_marker.strip().lower() == ev2.time_marker.strip().lower():
                if ev1.location.strip().lower() != ev2.location.strip().lower():
                    common = set(ev1.participants).intersection(set(ev2.participants))
                    for c_id in common:
                        char_name = char_map[c_id].name if c_id in char_map else c_id
                        candidates.append(
                            CandidateContradiction(
                                id=f"pr_{uuid.uuid4().hex[:6]}",
                                type="presence",
                                severity="high",
                                explanation=f"{char_name} is simultaneously at {ev1.location} and {ev2.location} at '{ev1.time_marker}'.",
                                chapter_a=ev1.chapter,
                                quote_a=ev1.quote,
                                chapter_b=ev2.chapter,
                                quote_b=ev2.quote,
                                suggested_fix=f"Adjust the timeline marker or location for one of the scenes.",
                            )
                        )

    return candidates
