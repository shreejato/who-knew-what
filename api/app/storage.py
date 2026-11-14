from typing import Dict, Any, List, Optional
from threading import Lock
from app.models import ChapterExtraction, Character, Fact, KnowledgeEvent, Reference, Event, Contradiction


class ManuscriptStorage:
    def __init__(self):
        self._lock = Lock()
        self._manuscripts: Dict[str, Dict[str, Any]] = {}

    def save_manuscript(self, mid: str, title: str, text: str, chapters: List[Dict[str, Any]]) -> None:
        with self._lock:
            self._manuscripts[mid] = {
                "id": mid,
                "title": title,
                "text": text,
                "chapters": chapters,
                "analyzed": False,
                "extractions": {},  # chapter_num -> ChapterExtraction
                "contradictions": [],  # List[Contradiction]
            }

    def get_manuscript(self, mid: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._manuscripts.get(mid)

    def save_chapter_extraction(self, mid: str, chapter_num: int, extraction: ChapterExtraction) -> None:
        with self._lock:
            if mid in self._manuscripts:
                self._manuscripts[mid]["extractions"][chapter_num] = extraction

    def set_analyzed(self, mid: str, contradictions: List[Contradiction]) -> None:
        with self._lock:
            if mid in self._manuscripts:
                self._manuscripts[mid]["analyzed"] = True
                self._manuscripts[mid]["contradictions"] = contradictions

    def get_all_entities(self, mid: str) -> Dict[str, Any]:
        """Aggregate all extracted entities across all chapters for this manuscript."""
        with self._lock:
            m = self._manuscripts.get(mid)
            if not m:
                return {}
            extractions: Dict[int, ChapterExtraction] = m.get("extractions", {})

        characters: List[Character] = []
        facts: List[Fact] = []
        knowledge_events: List[KnowledgeEvent] = []
        references: List[Reference] = []
        events: List[Event] = []

        seen_char_ids = set()
        seen_fact_ids = set()

        # Sort by chapter order
        for ch_num in sorted(extractions.keys()):
            ext = extractions[ch_num]
            for c in ext.characters:
                if c.id not in seen_char_ids:
                    seen_char_ids.add(c.id)
                    characters.append(c)
                else:
                    # Update aliases if any new ones
                    existing = next((x for x in characters if x.id == c.id), None)
                    if existing:
                        for a in c.aliases:
                            if a not in existing.aliases:
                                existing.aliases.append(a)

            for f in ext.facts:
                if f.id not in seen_fact_ids:
                    seen_fact_ids.add(f.id)
                    facts.append(f)

            knowledge_events.extend(ext.knowledge_events)
            references.extend(ext.references)
            events.extend(ext.events)

        return {
            "characters": characters,
            "facts": facts,
            "knowledge_events": knowledge_events,
            "references": references,
            "events": events,
        }

    def build_graph(self, mid: str, max_chapter: int = 1) -> Dict[str, Any]:
        """Build character knowledge graph filtered up to max_chapter."""
        entities = self.get_all_entities(mid)
        if not entities:
            return {"chapter": max_chapter, "nodes": [], "edges": [], "facts": []}

        all_chars: List[Character] = entities["characters"]
        all_facts: List[Fact] = entities["facts"]
        all_kes: List[KnowledgeEvent] = entities["knowledge_events"]

        # Facts introduced up to max_chapter
        facts_up_to_n = [
            {"id": f.id, "claim": f.claim, "chapter": f.chapter, "quote": f.quote}
            for f in all_facts if f.chapter <= max_chapter
        ]

        # Knowledge events up to max_chapter
        kes_up_to_n = [ke for ke in all_kes if ke.chapter <= max_chapter]

        # Edges (who told whom)
        edges = []
        for ke in kes_up_to_n:
            if ke.source_character_id and ke.source_character_id != ke.character_id:
                edges.append({
                    "source": ke.source_character_id,
                    "target": ke.character_id,
                    "fact_id": ke.fact_id,
                    "mode": ke.mode,
                    "chapter": ke.chapter,
                })

        # Nodes (characters with facts they know up to chapter N)
        nodes = []
        for c in all_chars:
            known_fact_ids = set()
            for ke in kes_up_to_n:
                if ke.character_id == c.id:
                    known_fact_ids.add(ke.fact_id)
            nodes.append({
                "id": c.id,
                "name": c.name,
                "knows": sorted(list(known_fact_ids)),
            })

        return {
            "chapter": max_chapter,
            "nodes": nodes,
            "edges": edges,
            "facts": facts_up_to_n,
        }

    def get_contradictions(self, mid: str) -> List[Dict[str, Any]]:
        with self._lock:
            m = self._manuscripts.get(mid)
            if not m:
                return []
            return [c.model_dump() for c in m.get("contradictions", [])]


# Global storage instance
storage = ManuscriptStorage()
