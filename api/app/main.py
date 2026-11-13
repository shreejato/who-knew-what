import json, re, uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
ROOT = Path(__file__).resolve().parents[2]
MOCK = ROOT / "contracts" / "mock"

app = FastAPI(title="NarrativeOS API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MANUSCRIPTS: dict[str, dict] = {}
HEADING = re.compile(r"(?im)^\s*chapter\s+[\w-]+.*$")


def split_chapters(text: str):
    marks = [m.start() for m in HEADING.finditer(text)]
    if not marks:
        return [{"n": i + 1, "start": s, "text": text[s:s + 4000]}
                for i, s in enumerate(range(0, len(text), 4000))]
    marks.append(len(text))
    return [{"n": i + 1, "start": marks[i], "text": text[marks[i]:marks[i + 1]]}
            for i in range(len(marks) - 1)]


class ManuscriptIn(BaseModel):
    title: str = "Untitled"
    text: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/manuscripts")
def create_manuscript(body: ManuscriptIn):
    mid = uuid.uuid4().hex[:8]
    chapters = split_chapters(body.text)
    MANUSCRIPTS[mid] = {"title": body.title, "chapters": chapters, "analyzed": False}
    return {"id": mid, "chapters": len(chapters)}


@app.post("/manuscripts/{mid}/analyze")
def analyze(mid: str):
    if mid not in MANUSCRIPTS:
        raise HTTPException(404, "manuscript not found")
    MANUSCRIPTS[mid]["analyzed"] = True  # TODO Member 1: real extraction
    return {"status": "done"}


@app.get("/manuscripts/{mid}/graph")
def graph(mid: str, chapter: int = 1):
    if mid not in MANUSCRIPTS:
        raise HTTPException(404, "manuscript not found")
    data = json.loads((MOCK / "graph.json").read_text(encoding="utf-8"))
    data["chapter"] = chapter  # TODO Member 1: filter by chapter
    return data


@app.get("/manuscripts/{mid}/contradictions")
def contradictions(mid: str):
    if mid not in MANUSCRIPTS:
        raise HTTPException(404, "manuscript not found")
    return json.loads((MOCK / "contradictions.json").read_text(encoding="utf-8"))