from typing import Optional, Literal, List
from pydantic import BaseModel


class CandidateContradiction(BaseModel):
    id: str
    type: Literal["premature_knowledge", "presence", "timeline", "attribute"]
    severity: Literal["high", "medium", "low"]
    explanation: str
    chapter_a: int
    quote_a: str
    start_a: Optional[int] = 0
    end_a: Optional[int] = 0
    chapter_b: Optional[int] = None
    quote_b: Optional[str] = None
    start_b: Optional[int] = 0
    end_b: Optional[int] = 0
    suggested_fix: str
