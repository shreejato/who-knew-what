import os
import json
import time
import logging
from typing import List, Dict, Any, Optional
import httpx
from dotenv import load_dotenv

from app.models import ChapterExtraction
from app.cache import get_chapter_hash, get_cached_extraction, set_cached_extraction
from app.extraction.base import BaseExtractor
from app.extraction.utils import (
    clean_json_response,
    sanitize_and_filter_extraction,
)

load_dotenv()
logger = logging.getLogger(__name__)


class AdaptedExtractor(BaseExtractor):
    name: str = "adapted"

    def __init__(self, endpoint: Optional[str] = None, api_key: Optional[str] = None):
        super().__init__()
        self.endpoint = endpoint or os.getenv("ADAPTED_MODEL_ENDPOINT")
        self.api_key = api_key or os.getenv("ADAPTED_API_KEY", "")

    def extract_chapter(
        self,
        chapter_text: str,
        chapter_num: int,
        known_characters: Optional[List[str]] = None,
        use_cache: bool = True,
    ) -> ChapterExtraction:
        start_time = time.time()
        ch_hash = f"adapted_{get_chapter_hash(chapter_text)}"

        if use_cache:
            cached_data = get_cached_extraction(ch_hash)
            if cached_data is not None:
                logger.info(f"[AdaptedExtractor] Cache hit for chapter {chapter_num} ({ch_hash[:8]})")
                extraction, total_items, valid_items = sanitize_and_filter_extraction(
                    cached_data, chapter_text, chapter_num
                )
                latency_ms = (time.time() - start_time) * 1000
                self.record_metrics(chapter_num, latency_ms, True, total_items, valid_items)
                return extraction

        attempts = 2
        last_error = None

        for attempt in range(attempts):
            try:
                if self.endpoint:
                    headers = {"Content-Type": "application/json"}
                    if self.api_key:
                        headers["Authorization"] = f"Bearer {self.api_key}"

                    payload = {
                        "chapter_text": chapter_text,
                        "chapter_num": chapter_num,
                        "known_characters": known_characters or [],
                    }
                    with httpx.Client(timeout=30.0) as client:
                        resp = client.post(self.endpoint, json=payload, headers=headers)
                        resp.raise_for_status()
                        raw_data = resp.json()
                else:
                    # In development before Member 3 deploys the fine-tuned model:
                    # Provide local fallback extraction so the switch can be verified
                    raw_data = self._fallback_extraction(chapter_text, chapter_num, known_characters)

                if use_cache:
                    set_cached_extraction(ch_hash, raw_data)

                extraction, total_items, valid_items = sanitize_and_filter_extraction(
                    raw_data, chapter_text, chapter_num
                )
                latency_ms = (time.time() - start_time) * 1000
                self.record_metrics(chapter_num, latency_ms, True, total_items, valid_items)
                return extraction
            except Exception as e:
                last_error = e
                logger.warning(f"[AdaptedExtractor] Attempt {attempt + 1} failed: {e}")
                if attempt == attempts - 1:
                    latency_ms = (time.time() - start_time) * 1000
                    self.record_metrics(chapter_num, latency_ms, False, 0, 0)
                    raise RuntimeError(f"AdaptedExtractor failed after {attempts} attempts: {last_error}")

    def _fallback_extraction(self, chapter_text: str, chapter_num: int, known_characters: Optional[List[str]]) -> Dict[str, Any]:
        """Baseline extraction template when fine-tuned endpoint is awaiting deployment."""
        first_line = chapter_text.strip().split("\n")[0]
        quote = first_line[:min(len(first_line), 50)]
        return {
            "characters": [{"id": f"c_{chapter_num}", "name": "Story Character", "aliases": []}],
            "facts": [{"id": f"f_{chapter_num}", "claim": "Chapter event occurs", "chapter": chapter_num, "quote": quote}],
            "knowledge_events": [],
            "references": [],
            "events": [{"id": f"e_{chapter_num}", "chapter": chapter_num, "summary": "Chapter begins", "quote": quote, "participants": [f"c_{chapter_num}"]}]
        }
