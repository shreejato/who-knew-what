import re
import uuid
from typing import List
from app.models import Event
from app.rules.base import CandidateContradiction

DAY_PATTERN = re.compile(r"\bday\s+(\d+)\b", re.IGNORECASE)


def check_timeline(events: List[Event]) -> List[CandidateContradiction]:
    """Flag chronological anomalies, e.g. explicitly numbered days progressing backwards across chapters."""
    candidates: List[CandidateContradiction] = []

    day_events: List[tuple[int, int, Event]] = []  # (chapter, day_num, event)
    for ev in events:
        if ev.time_marker:
            m = DAY_PATTERN.search(ev.time_marker)
            if m:
                day_num = int(m.group(1))
                day_events.append((ev.chapter, day_num, ev))

    for i in range(len(day_events)):
        ch1, d1, ev1 = day_events[i]
        for j in range(i + 1, len(day_events)):
            ch2, d2, ev2 = day_events[j]
            # Later chapter has earlier chronological day marker
            if ch2 > ch1 and d2 < d1:
                candidates.append(
                    CandidateContradiction(
                        id=f"tl_{uuid.uuid4().hex[:6]}",
                        type="timeline",
                        severity="medium",
                        explanation=f"Chronological regression: Chapter {ch1} is set on Day {d1}, but later Chapter {ch2} occurs on Day {d2}.",
                        chapter_a=ch1,
                        quote_a=ev1.quote,
                        chapter_b=ch2,
                        quote_b=ev2.quote,
                        suggested_fix=f"Clarify whether Chapter {ch2} is a flashback or align the day numbers.",
                    )
                )

    return candidates
