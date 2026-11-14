import os
import json
import logging
from typing import List, Dict, Optional
from dotenv import load_dotenv

from app.models import Contradiction, EvidenceItem
from app.rules.base import CandidateContradiction
from app.extraction.utils import clean_json_response, verify_and_align_quote

load_dotenv()
logger = logging.getLogger(__name__)

VERIFIER_PROMPT = """A rule engine flagged a possible story contradiction.

Claim: {type} - {explanation}
Passage 1 (chapter {ch_a}): {text_a}
Passage 2 (chapter {ch_b}): {text_b}

Decide if these passages truly conflict. Return JSON:
{{
  "is_contradiction": true,
  "quote_1": "exact substring of Passage 1",
  "quote_2": "exact substring of Passage 2",
  "explanation": "<=2 sentences",
  "suggested_fix": "a specific edit the author could consider, without rewriting their prose"
}}
Be conservative: if a reasonable reading avoids the conflict, answer false.
"""


class ContradictionVerifier:
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize genai client for verifier: {e}")

    def verify_candidates(
        self,
        candidates: List[CandidateContradiction],
        chapter_texts: Dict[int, str],
        use_llm: bool = True,
    ) -> List[Contradiction]:
        verified: List[Contradiction] = []

        for cand in candidates:
            text_a = chapter_texts.get(cand.chapter_a, "")
            text_b = chapter_texts.get(cand.chapter_b, "") if cand.chapter_b else text_a

            if use_llm and self.client and text_a:
                res = self._verify_with_llm(cand, text_a, text_b)
                if res is not None:
                    verified.append(res)
            else:
                # Verifier fallback using candidate's quotes directly
                res = self._verify_exact_substrings(cand, text_a, text_b)
                if res is not None:
                    verified.append(res)

        return verified

    def _verify_exact_substrings(
        self,
        cand: CandidateContradiction,
        text_a: str,
        text_b: str,
    ) -> Optional[Contradiction]:
        """Strict invariant check: drop warning if either quote is not an exact substring."""
        exact_a, start_a, end_a = verify_and_align_quote(cand.quote_a, text_a)
        if not exact_a:
            logger.info(f"Dropped warning {cand.id}: quote_a is not a verbatim substring of chapter {cand.chapter_a}")
            return None

        evidence = [EvidenceItem(chapter=cand.chapter_a, quote=cand.quote_a, start=start_a, end=end_a)]

        if cand.quote_b and cand.chapter_b:
            exact_b, start_b, end_b = verify_and_align_quote(cand.quote_b, text_b)
            if not exact_b:
                logger.info(f"Dropped warning {cand.id}: quote_b is not a verbatim substring of chapter {cand.chapter_b}")
                return None
            evidence.append(EvidenceItem(chapter=cand.chapter_b, quote=cand.quote_b, start=start_b, end=end_b))

        return Contradiction(
            id=cand.id,
            type=cand.type,
            severity=cand.severity,
            explanation=cand.explanation,
            evidence=evidence,
            suggested_fix=cand.suggested_fix,
        )

    def _verify_with_llm(
        self,
        cand: CandidateContradiction,
        text_a: str,
        text_b: str,
    ) -> Optional[Contradiction]:
        prompt = VERIFIER_PROMPT.format(
            type=cand.type,
            explanation=cand.explanation,
            ch_a=cand.chapter_a,
            text_a=cand.quote_a,
            ch_b=cand.chapter_b or cand.chapter_a,
            text_b=cand.quote_b or cand.quote_a,
        )
        try:
            from google.genai import types
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0,
                ),
            )
            raw = clean_json_response(response.text)
            parsed = json.loads(raw)

            if not parsed.get("is_contradiction", False):
                logger.info(f"LLM verifier dismissed candidate {cand.id} as non-contradiction.")
                return None

            q1 = parsed.get("quote_1", cand.quote_a)
            q2 = parsed.get("quote_2", cand.quote_b or "")

            # Strict verification rule: quotes must be exact substrings of respective chapters
            exact_1, s1, e1 = verify_and_align_quote(q1, text_a)
            if not exact_1:
                # Try fallback to cand.quote_a
                exact_1, s1, e1 = verify_and_align_quote(cand.quote_a, text_a)
                if not exact_1:
                    logger.warning(f"Dropping warning: quote 1 '{q1}' not in chapter {cand.chapter_a}")
                    return None
                q1 = cand.quote_a

            evidence = [EvidenceItem(chapter=cand.chapter_a, quote=q1, start=s1, end=e1)]

            if cand.chapter_b and q2:
                exact_2, s2, e2 = verify_and_align_quote(q2, text_b)
                if not exact_2:
                    if cand.quote_b:
                        exact_2, s2, e2 = verify_and_align_quote(cand.quote_b, text_b)
                        if not exact_2:
                            logger.warning(f"Dropping warning: quote 2 '{q2}' not in chapter {cand.chapter_b}")
                            return None
                        q2 = cand.quote_b
                    else:
                        return None
                evidence.append(EvidenceItem(chapter=cand.chapter_b, quote=q2, start=s2, end=e2))

            return Contradiction(
                id=cand.id,
                type=cand.type,
                severity=cand.severity,
                explanation=parsed.get("explanation", cand.explanation),
                evidence=evidence,
                suggested_fix=parsed.get("suggested_fix", cand.suggested_fix),
            )
        except Exception as e:
            logger.warning(f"LLM verifier failed for {cand.id}, falling back to substring rule: {e}")
            return self._verify_exact_substrings(cand, text_a, text_b)
