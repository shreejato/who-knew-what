from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class Character(BaseModel):
    id: str
    name: str
    aliases: List[str] = Field(default_factory=list)


class Fact(BaseModel):
    id: str
    claim: str
    chapter: int
    quote: str
    start: Optional[int] = None
    end: Optional[int] = None


class KnowledgeEvent(BaseModel):
    character_id: str
    fact_id: str
    chapter: int
    mode: Literal["witnessed", "told", "overheard", "deduced"]
    source_character_id: Optional[str] = None
    quote: str


class Reference(BaseModel):
    character_id: str
    fact_id: str
    chapter: int
    quote: str
    start: Optional[int] = None
    end: Optional[int] = None


class Event(BaseModel):
    id: str
    chapter: int
    summary: str
    time_marker: Optional[str] = None
    location: Optional[str] = None
    participants: List[str] = Field(default_factory=list)
    quote: str


class EvidenceItem(BaseModel):
    chapter: int
    quote: str
    start: Optional[int] = 0
    end: Optional[int] = 0


class Contradiction(BaseModel):
    id: str
    type: Literal["premature_knowledge", "presence", "timeline", "attribute"]
    severity: Literal["high", "medium", "low"]
    explanation: str
    evidence: List[EvidenceItem]
    suggested_fix: str


class ChapterExtraction(BaseModel):
    """Structured extraction output for a single chapter conforming to schema.json."""
    characters: List[Character] = Field(default_factory=list)
    facts: List[Fact] = Field(default_factory=list)
    knowledge_events: List[KnowledgeEvent] = Field(default_factory=list)
    references: List[Reference] = Field(default_factory=list)
    events: List[Event] = Field(default_factory=list)
