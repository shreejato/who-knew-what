import logging
from typing import Tuple, Dict, Any, List
from app.models import ChapterExtraction, Character, Fact, KnowledgeEvent, Reference, Event

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT_TEMPLATE = """You are a story continuity analyst. Read the chapter below. Return ONLY a valid JSON object matching the requested schema.

Known characters so far: {character_list}
Chapter number: {chapter_num}

Extract:
1. characters: new characters (id like 'c1', 'c2', name, aliases list), plus aliases for known ones.
2. facts: story-relevant claims (secrets, crimes, relationships, objects, locations) with id like 'f1', 'f2', claim, chapter, quote.
3. knowledge_events: when a character LEARNS a fact in this chapter, with character_id, fact_id, chapter, mode ('witnessed', 'told', 'overheard', 'deduced'), source_character_id (or null), quote.
4. references: when a character speaks about or acts on a fact in this chapter, with character_id, fact_id, chapter, quote.
5. events: with id like 'e1', chapter, summary, time_marker (or null), location (or null), participants (list of character IDs), quote.

Rules:
- Every item needs a "quote" copied EXACTLY from the chapter, character for character, 5-25 words.
- Do not infer what is not on the page. If unsure, omit the item.
- Do not invent time markers.
- Return ONLY JSON in the format:
{{
  "characters": [{{"id": "c1", "name": "Mara", "aliases": ["Ms. Voss"]}}],
  "facts": [{{"id": "f1", "claim": "Hale was poisoned", "chapter": {chapter_num}, "quote": "exact quote from text"}}],
  "knowledge_events": [{{"character_id": "c1", "fact_id": "f1", "chapter": {chapter_num}, "mode": "told", "source_character_id": "c2", "quote": "exact quote from text"}}],
  "references": [{{"character_id": "c1", "fact_id": "f1", "chapter": {chapter_num}, "quote": "exact quote from text"}}],
  "events": [{{"id": "e1", "chapter": {chapter_num}, "summary": "brief summary", "time_marker": null, "location": null, "participants": ["c1"], "quote": "exact quote from text"}}]
}}

Chapter text:
{chapter_text}
"""


def verify_and_align_quote(quote: str, chapter_text: str) -> Tuple[bool, int, int]:
    """Check if quote is an exact verbatim substring in chapter_text.
    Returns (is_exact, start_offset, end_offset)."""
    if not quote:
        return False, 0, 0
    start = chapter_text.find(quote)
    if start != -1:
        return True, start, start + len(quote)
    stripped = quote.strip()
    start = chapter_text.find(stripped)
    if start != -1:
        return True, start, start + len(stripped)
    return False, 0, 0


def clean_json_response(raw_text: str) -> str:
    """Strip markdown code fences if present."""
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def sanitize_and_filter_extraction(raw_data: Dict[str, Any], chapter_text: str, chapter_num: int) -> Tuple[ChapterExtraction, int, int]:
    """Filter out any items whose quotes are not exact verbatim substrings of the chapter text.
    Also compute exact start/end offsets.
    Returns (ChapterExtraction, total_items_checked, valid_verbatim_items)."""
    total_items = 0
    valid_items = 0

    valid_characters: List[Character] = []
    for c in raw_data.get("characters", []):
        try:
            valid_characters.append(Character(**c))
        except Exception as e:
            logger.warning(f"Skipping invalid character {c}: {e}")

    valid_facts: List[Fact] = []
    for f in raw_data.get("facts", []):
        total_items += 1
        quote = f.get("quote", "")
        exact, start, end = verify_and_align_quote(quote, chapter_text)
        if exact:
            valid_items += 1
            f["chapter"] = chapter_num
            f["start"] = start
            f["end"] = end
            try:
                valid_facts.append(Fact(**f))
            except Exception as e:
                logger.warning(f"Skipping invalid fact {f}: {e}")
        else:
            logger.info(f"Dropped fact with non-verbatim quote: '{quote[:30]}...'")

    valid_ke: List[KnowledgeEvent] = []
    for ke in raw_data.get("knowledge_events", []):
        total_items += 1
        quote = ke.get("quote", "")
        exact, _, _ = verify_and_align_quote(quote, chapter_text)
        if exact:
            valid_items += 1
            ke["chapter"] = chapter_num
            try:
                valid_ke.append(KnowledgeEvent(**ke))
            except Exception as e:
                logger.warning(f"Skipping invalid knowledge event {ke}: {e}")
        else:
            logger.info(f"Dropped knowledge_event with non-verbatim quote: '{quote[:30]}...'")

    valid_refs: List[Reference] = []
    for r in raw_data.get("references", []):
        total_items += 1
        quote = r.get("quote", "")
        exact, start, end = verify_and_align_quote(quote, chapter_text)
        if exact:
            valid_items += 1
            r["chapter"] = chapter_num
            r["start"] = start
            r["end"] = end
            try:
                valid_refs.append(Reference(**r))
            except Exception as e:
                logger.warning(f"Skipping invalid reference {r}: {e}")
        else:
            logger.info(f"Dropped reference with non-verbatim quote: '{quote[:30]}...'")

    valid_events: List[Event] = []
    for ev in raw_data.get("events", []):
        total_items += 1
        quote = ev.get("quote", "")
        exact, _, _ = verify_and_align_quote(quote, chapter_text)
        if exact:
            valid_items += 1
            ev["chapter"] = chapter_num
            try:
                valid_events.append(Event(**ev))
            except Exception as e:
                logger.warning(f"Skipping invalid event {ev}: {e}")
        else:
            logger.info(f"Dropped event with non-verbatim quote: '{quote[:30]}...'")

    extraction = ChapterExtraction(
        characters=valid_characters,
        facts=valid_facts,
        knowledge_events=valid_ke,
        references=valid_refs,
        events=valid_events,
    )
    return extraction, total_items, valid_items
