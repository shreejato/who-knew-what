import uuid
from typing import List, Dict, Optional
from app.models import Character, Fact, KnowledgeEvent, Reference
from app.rules.base import CandidateContradiction


def check_premature_knowledge(
    characters: List[Character],
    facts: List[Fact],
    knowledge_events: List[KnowledgeEvent],
    references: List[Reference],
) -> List[CandidateContradiction]:
    """Flag when a character references a fact before any knowledge_event establishes they learned it."""
    char_map: Dict[str, Character] = {c.id: c for c in characters}
    fact_map: Dict[str, Fact] = {f.id: f for f in facts}

    candidates: List[CandidateContradiction] = []

    for ref in references:
        c_id = ref.character_id
        f_id = ref.fact_id
        ref_ch = ref.chapter
        fact = fact_map.get(f_id)
        character = char_map.get(c_id)
        char_name = character.name if character else c_id
        fact_claim = fact.claim if fact else f_id

        # Find knowledge events for this character and fact
        char_kes = [
            ke for ke in knowledge_events
            if ke.character_id == c_id and ke.fact_id == f_id
        ]

        # Check if character learned it on or before ref_ch
        learned_prior = [ke for ke in char_kes if ke.chapter <= ref_ch]

        # Check if character is the originator/source of the fact (e.g., culprit who tells others)
        is_originator = any(
            ke.source_character_id == c_id and ke.fact_id == f_id
            for ke in knowledge_events
        )

        if learned_prior or is_originator:
            continue

        # If we reach here, character referenced fact before learning it!
        # Find subsequent knowledge event if one exists later
        subsequent_ke = next((ke for ke in char_kes if ke.chapter > ref_ch), None)

        if subsequent_ke:
            chapter_b = subsequent_ke.chapter
            quote_b = subsequent_ke.quote
            explanation = (
                f"{char_name} references '{fact_claim}' in Chapter {ref_ch}, "
                f"but does not learn it until Chapter {chapter_b}."
            )
            suggested_fix = (
                f"Introduce {char_name}'s discovery scene before Chapter {ref_ch}, "
                f"or omit the reference from Chapter {ref_ch}."
            )
        elif fact:
            chapter_b = fact.chapter
            quote_b = fact.quote
            explanation = (
                f"{char_name} references '{fact_claim}' in Chapter {ref_ch}, "
                f"but has never been shown learning or witnessing this fact."
            )
            suggested_fix = (
                f"Show how {char_name} discovered '{fact_claim}' prior to Chapter {ref_ch}."
            )
        else:
            chapter_b = ref_ch
            quote_b = ref.quote
            explanation = f"{char_name} references an unestablished fact in Chapter {ref_ch}."
            suggested_fix = f"Establish the knowledge event for {char_name} before Chapter {ref_ch}."

        candidates.append(
            CandidateContradiction(
                id=f"pk_{uuid.uuid4().hex[:6]}",
                type="premature_knowledge",
                severity="high",
                explanation=explanation,
                chapter_a=ref_ch,
                quote_a=ref.quote,
                start_a=ref.start or 0,
                end_a=ref.end or 0,
                chapter_b=chapter_b,
                quote_b=quote_b,
                suggested_fix=suggested_fix,
            )
        )

    return candidates
