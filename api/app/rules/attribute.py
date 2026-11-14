import re
import uuid
from typing import List, Dict
from app.models import Character, Fact
from app.rules.base import CandidateContradiction

EYE_COLORS = ["blue", "brown", "green", "hazel", "grey", "gray", "black", "amber"]
AGE_PATTERN = re.compile(r"\b(\d{1,2})\s*(?:years\s*old|year-old|-year-old)\b", re.IGNORECASE)


def check_attributes(characters: List[Character], facts: List[Fact]) -> List[CandidateContradiction]:
    """Check for contradictory physical attributes across chapters (e.g. eye color, age)."""
    char_map: Dict[str, Character] = {c.id: c for c in characters}
    candidates: List[CandidateContradiction] = []

    # Check eye colors per character
    for c_id, char in char_map.items():
        char_names = [char.name.lower()] + [a.lower() for a in char.aliases]
        color_mentions: List[tuple[str, Fact]] = []  # (color, fact)

        for fact in facts:
            claim_lower = fact.claim.lower()
            quote_lower = fact.quote.lower()
            text = f"{claim_lower} {quote_lower}"

            if any(name in text for name in char_names):
                for color in EYE_COLORS:
                    if f"{color} eye" in text or f"eyes were {color}" in text or f"eyes are {color}" in text:
                        color_mentions.append((color, fact))

        for i in range(len(color_mentions)):
            color1, f1 = color_mentions[i]
            for j in range(i + 1, len(color_mentions)):
                color2, f2 = color_mentions[j]
                if color1 != color2 and f1.chapter != f2.chapter:
                    candidates.append(
                        CandidateContradiction(
                            id=f"at_{uuid.uuid4().hex[:6]}",
                            type="attribute",
                            severity="medium",
                            explanation=f"{char.name}'s eye color changes from {color1} in Chapter {f1.chapter} to {color2} in Chapter {f2.chapter}.",
                            chapter_a=f1.chapter,
                            quote_a=f1.quote,
                            start_a=f1.start or 0,
                            end_a=f1.end or 0,
                            chapter_b=f2.chapter,
                            quote_b=f2.quote,
                            start_b=f2.start or 0,
                            end_b=f2.end or 0,
                            suggested_fix=f"Standardize {char.name}'s eye color across chapters.",
                        )
                    )

    # Check age discrepancies
    for c_id, char in char_map.items():
        char_names = [char.name.lower()] + [a.lower() for a in char.aliases]
        age_mentions: List[tuple[int, Fact]] = []

        for fact in facts:
            text = f"{fact.claim} {fact.quote}"
            if any(name in text.lower() for name in char_names):
                m = AGE_PATTERN.search(text)
                if m:
                    age = int(m.group(1))
                    age_mentions.append((age, fact))

        for i in range(len(age_mentions)):
            age1, f1 = age_mentions[i]
            for j in range(i + 1, len(age_mentions)):
                age2, f2 = age_mentions[j]
                # If chapters are close but stated age shifts significantly without narrative time lapse
                if age1 != age2 and abs(f1.chapter - f2.chapter) <= 3:
                    candidates.append(
                        CandidateContradiction(
                            id=f"at_{uuid.uuid4().hex[:6]}",
                            type="attribute",
                            severity="medium",
                            explanation=f"{char.name}'s age is given as {age1} in Chapter {f1.chapter}, but stated as {age2} in Chapter {f2.chapter}.",
                            chapter_a=f1.chapter,
                            quote_a=f1.quote,
                            chapter_b=f2.chapter,
                            quote_b=f2.quote,
                            suggested_fix=f"Keep {char.name}'s age consistent unless a multi-year time jump occurred.",
                        )
                    )

    return candidates
