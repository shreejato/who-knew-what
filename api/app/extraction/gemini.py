import os
import json
import time
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from app.models import ChapterExtraction
from app.cache import get_chapter_hash, get_cached_extraction, set_cached_extraction
from app.extraction.base import BaseExtractor
from app.extraction.utils import (
    EXTRACTION_PROMPT_TEMPLATE,
    clean_json_response,
    sanitize_and_filter_extraction,
)

load_dotenv()
logger = logging.getLogger(__name__)


class GeminiExtractor(BaseExtractor):
    name: str = "gemini"

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize google-genai client: {e}")

    def extract_chapter(
        self,
        chapter_text: str,
        chapter_num: int,
        known_characters: Optional[List[str]] = None,
        use_cache: bool = True,
    ) -> ChapterExtraction:
        start_time = time.time()
        ch_hash = get_chapter_hash(chapter_text)

        # Check cache
        if use_cache:
            cached_data = get_cached_extraction(ch_hash)
            if cached_data is not None:
                logger.info(f"[GeminiExtractor] Cache hit for chapter {chapter_num} ({ch_hash[:8]})")
                extraction, total_items, valid_items = sanitize_and_filter_extraction(
                    cached_data, chapter_text, chapter_num
                )
                latency_ms = (time.time() - start_time) * 1000
                self.record_metrics(chapter_num, latency_ms, True, total_items, valid_items)
                return extraction

        if not self.client:
            raise RuntimeError("GEMINI_API_KEY not configured or google-genai client failed to initialize.")

        prompt = EXTRACTION_PROMPT_TEMPLATE.format(
            character_list=", ".join(known_characters) if known_characters else "None yet",
            chapter_num=chapter_num,
            chapter_text=chapter_text,
        )

        attempts = 2
        last_error = None

        for attempt in range(attempts):
            try:
                from google.genai import types
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )
                raw_json = clean_json_response(response.text)
                parsed = json.loads(raw_json)

                # Store in cache
                if use_cache:
                    set_cached_extraction(ch_hash, parsed)

                extraction, total_items, valid_items = sanitize_and_filter_extraction(
                    parsed, chapter_text, chapter_num
                )
                latency_ms = (time.time() - start_time) * 1000
                self.record_metrics(chapter_num, latency_ms, True, total_items, valid_items)
                return extraction
            except Exception as e:
                last_error = e
                logger.warning(f"Extraction attempt {attempt + 1} failed: {e}")
                if attempt == attempts - 1:
                    latency_ms = (time.time() - start_time) * 1000
                    self.record_metrics(chapter_num, latency_ms, False, 0, 0)
                    raise RuntimeError(f"Gemini extraction failed after {attempts} attempts: {last_error}")
