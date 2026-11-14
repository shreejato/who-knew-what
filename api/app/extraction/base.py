import abc
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.models import ChapterExtraction


class ExtractionMetrics(BaseModel):
    extractor_name: str
    chapter_num: int
    latency_ms: float
    json_valid: bool
    total_items_extracted: int
    valid_verbatim_items: int
    quote_exactness_rate: float


class BaseExtractor(abc.ABC):
    name: str = "base"

    def __init__(self):
        self.call_logs: List[ExtractionMetrics] = []

    @abc.abstractmethod
    def extract_chapter(
        self,
        chapter_text: str,
        chapter_num: int,
        known_characters: Optional[List[str]] = None,
        use_cache: bool = True,
    ) -> ChapterExtraction:
        """Extract story continuity entities for a single chapter."""
        pass

    def record_metrics(
        self,
        chapter_num: int,
        latency_ms: float,
        json_valid: bool,
        total_items: int,
        valid_items: int,
    ) -> ExtractionMetrics:
        exactness = (valid_items / total_items) if total_items > 0 else 1.0
        metric = ExtractionMetrics(
            extractor_name=self.name,
            chapter_num=chapter_num,
            latency_ms=latency_ms,
            json_valid=json_valid,
            total_items_extracted=total_items,
            valid_verbatim_items=valid_items,
            quote_exactness_rate=round(exactness, 4),
        )
        self.call_logs.append(metric)
        return metric
