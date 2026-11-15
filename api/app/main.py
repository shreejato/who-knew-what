import os
import io
import json
import re
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import docx

from app.models import ChapterExtraction, Contradiction
from app.extraction.factory import get_extractor
from app.rules.engine import RuleEngine
from app.verifier.verifier import ContradictionVerifier
from app.storage import storage

load_dotenv()
ROOT = Path(__file__).resolve().parents[2]
MOCK = ROOT / "contracts" / "mock"

app = FastAPI(title="NarrativeOS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADING = re.compile(r"(?im)^\s*chapter\s+[\w-]+.*$")


def split_chapters(text: str) -> List[dict]:
    marks = [m.start() for m in HEADING.finditer(text)]
    if not marks:
        return [
            {"n": i + 1, "start": s, "text": text[s : s + 4000]}
            for i, s in enumerate(range(0, len(text), 4000))
        ]
    marks.append(len(text))
    return [
        {"n": i + 1, "start": marks[i], "text": text[marks[i] : marks[i + 1]]}
        for i in range(len(marks) - 1)
    ]


class ManuscriptIn(BaseModel):
    title: str = "Untitled"
    text: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "extractor": os.getenv("EXTRACTOR", "gemini"),
    }


@app.post("/manuscripts")
def create_manuscript(body: ManuscriptIn):
    mid = uuid.uuid4().hex[:8]
    chapters = split_chapters(body.text)
    storage.save_manuscript(mid=mid, title=body.title, text=body.text, chapters=chapters)
    return {"id": mid, "title": body.title, "chapters": len(chapters)}


@app.post("/manuscripts/upload")
async def upload_manuscript(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None)
):
    contents = await file.read()
    filename = file.filename or "uploaded_manuscript.txt"
    doc_title = title or Path(filename).stem

    if filename.lower().endswith(".docx"):
        doc = docx.Document(io.BytesIO(contents))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n\n".join(paragraphs)
    else:
        try:
            full_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            full_text = contents.decode("latin-1", errors="replace")

    if not full_text.strip():
        raise HTTPException(400, "Uploaded file appears to be empty.")

    mid = uuid.uuid4().hex[:8]
    chapters = split_chapters(full_text)
    storage.save_manuscript(mid=mid, title=doc_title, text=full_text, chapters=chapters)
    return {"id": mid, "title": doc_title, "chapters": len(chapters)}


@app.post("/manuscripts/{mid}/analyze")
def analyze(mid: str, extractor_name: Optional[str] = Query(None, alias="extractor")):
    m = storage.get_manuscript(mid)
    if not m:
        if mid == "mock" or mid.startswith("mock_"):
            return {"status": "done", "chapters_analyzed": 1, "contradictions_found": 1}
        raise HTTPException(404, "manuscript not found")

    chapters = m.get("chapters", [])
    if not chapters:
        raise HTTPException(400, "manuscript has no chapters")

    extractor = get_extractor(extractor_name)
    running_characters: List[str] = []
    chapter_texts: dict[int, str] = {}

    # 1. Extraction phase per chapter
    for ch in chapters:
        ch_num = ch["n"]
        ch_text = ch["text"]
        chapter_texts[ch_num] = ch_text

        try:
            ext = extractor.extract_chapter(
                chapter_text=ch_text,
                chapter_num=ch_num,
                known_characters=running_characters,
                use_cache=True,
            )
        except Exception as e:
            # If the LLM extractor fails (bad key, quota), log and use empty extraction
            # so the pipeline continues and rule engine still runs on whatever was cached
            import logging
            logging.getLogger(__name__).warning(
                f"Extractor failed for chapter {ch_num}: {e}. Using empty extraction."
            )
            from app.models import ChapterExtraction
            ext = ChapterExtraction(
                characters=[], facts=[], knowledge_events=[], references=[], events=[]
            )

        storage.save_chapter_extraction(mid, ch_num, ext)

        for c in ext.characters:
            if c.name not in running_characters:
                running_characters.append(c.name)

    # 2. Reasoning phase (Rule Engine)
    all_entities = storage.get_all_entities(mid)
    engine = RuleEngine()
    candidates = engine.run(
        characters=all_entities["characters"],
        facts=all_entities["facts"],
        knowledge_events=all_entities["knowledge_events"],
        references=all_entities["references"],
        events=all_entities["events"],
    )

    # 3. Verification phase (Exact-quote validation + LLM Verifier)
    # use_llm=True when GEMINI_API_KEY is configured; falls back to substring rule automatically
    use_llm_verifier = bool(os.getenv("GEMINI_API_KEY", "").strip())
    verifier = ContradictionVerifier()
    verified_contradictions = verifier.verify_candidates(
        candidates=candidates,
        chapter_texts=chapter_texts,
        use_llm=use_llm_verifier,
    )

    # 4. Store verified results with metadata
    storage.set_analyzed(mid, verified_contradictions, extractor_used=extractor.name)

    return {
        "status": "done",
        "extractor": extractor.name,
        "chapters_analyzed": len(chapters),
        "candidates_flagged": len(candidates),
        "contradictions_found": len(verified_contradictions),
    }


@app.get("/manuscripts/{mid}/status")
def manuscript_status(mid: str):
    m = storage.get_manuscript(mid)
    if not m:
        raise HTTPException(404, "manuscript not found")
    return {
        "id": mid,
        "title": m.get("title", ""),
        "analyzed": m.get("analyzed", False),
        "extractor_used": m.get("extractor_used", os.getenv("EXTRACTOR", "gemini")),
        "chapters": len(m.get("chapters", [])),
        "contradictions_count": len(m.get("contradictions", [])),
    }


@app.get("/manuscripts/{mid}/graph")
def graph(mid: str, chapter: int = 1):
    m = storage.get_manuscript(mid)
    if not m:
        if (MOCK / "graph.json").exists():
            data = json.loads((MOCK / "graph.json").read_text(encoding="utf-8"))
            data["chapter"] = chapter
            return data
        raise HTTPException(404, "manuscript not found")

    if not m.get("analyzed", False):
        return {"chapter": chapter, "nodes": [], "edges": [], "facts": []}

    return storage.build_graph(mid, max_chapter=chapter)


@app.get("/manuscripts/{mid}/contradictions")
def contradictions(mid: str):
    m = storage.get_manuscript(mid)
    if not m:
        if (MOCK / "contradictions.json").exists():
            return json.loads((MOCK / "contradictions.json").read_text(encoding="utf-8"))
        raise HTTPException(404, "manuscript not found")

    if not m.get("analyzed", False):
        return []

    return storage.get_contradictions(mid)


@app.get("/extractor/metrics")
def extractor_metrics():
    """Return logged extraction metrics for model comparison panel."""
    gemini_ext = get_extractor("gemini")
    adapted_ext = get_extractor("adapted")
    return {
        "gemini": {
            "name": "gemini",
            "calls": len(gemini_ext.call_logs),
            "logs": [m.model_dump() for m in gemini_ext.call_logs],
        },
        "adapted": {
            "name": "adapted",
            "calls": len(adapted_ext.call_logs),
            "logs": [m.model_dump() for m in adapted_ext.call_logs],
        },
    }
