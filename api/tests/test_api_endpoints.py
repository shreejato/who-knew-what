import sys
import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.main import app, storage
from app.models import ChapterExtraction, Character, Fact, KnowledgeEvent, Reference, Event, Contradiction, EvidenceItem

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_create_and_query_manuscript():
    story_text = """Chapter 1. The Secret.
Mara arrived at the manor. Hale was sitting by the fire.
Chapter 2. The Discovery.
Inspector Rao examined the lock. He found traces of silver powder.
"""
    res = client.post("/manuscripts", json={"title": "The Manor Mystery", "text": story_text})
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["chapters"] == 2
    mid = data["id"]

    # Status check
    status_res = client.get(f"/manuscripts/{mid}/status")
    assert status_res.status_code == 200
    assert status_res.json()["analyzed"] is False

    # Before analysis, graph returns empty or schema-compatible structure
    graph_res = client.get(f"/manuscripts/{mid}/graph?chapter=1")
    assert graph_res.status_code == 200
    assert "nodes" in graph_res.json()

    # Contradictions before analysis
    contra_res = client.get(f"/manuscripts/{mid}/contradictions")
    assert contra_res.status_code == 200
    assert isinstance(contra_res.json(), list)


def test_upload_txt_file():
    txt_content = b"Chapter 1. Arrival\nMara arrived by night.\nChapter 2. The Manor\nThe door was locked."
    files = {"file": ("mystery.txt", txt_content, "text/plain")}
    data = {"title": "Uploaded Mystery"}
    res = client.post("/manuscripts/upload", files=files, data=data)
    assert res.status_code == 200
    payload = res.json()
    assert "id" in payload
    assert payload["title"] == "Uploaded Mystery"
    assert payload["chapters"] == 2


def test_upload_docx_file():
    import docx
    doc = docx.Document()
    doc.add_paragraph("Chapter 1. The Cold Night")
    doc.add_paragraph("Mara walked into the parlour.")
    doc.add_paragraph("Chapter 2. Dawn")
    doc.add_paragraph("The bell tolled six times.")
    
    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    
    files = {"file": ("story.docx", stream.read(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = client.post("/manuscripts/upload", files=files)
    assert res.status_code == 200
    payload = res.json()
    assert payload["title"] == "story"
    assert payload["chapters"] == 2


def test_graph_chapter_filtering():
    """Verify that /graph?chapter=N properly filters facts, nodes, and edges up to chapter N."""
    mid = "test_graph_mid"
    storage.save_manuscript(mid, "Test Story", "Ch1...\nCh2...", [
        {"n": 1, "text": "Mara learned the secret."},
        {"n": 2, "text": "Hale told Rao everything."}
    ])

    ext1 = ChapterExtraction(
        characters=[Character(id="c1", name="Mara"), Character(id="c2", name="Hale")],
        facts=[Fact(id="f1", claim="The cipher is hidden", chapter=1, quote="Mara learned the secret.")],
        knowledge_events=[KnowledgeEvent(character_id="c1", fact_id="f1", chapter=1, mode="witnessed", quote="Mara learned the secret.")],
    )
    ext2 = ChapterExtraction(
        characters=[Character(id="c3", name="Rao")],
        facts=[Fact(id="f2", claim="The ledger is gone", chapter=2, quote="Hale told Rao everything.")],
        knowledge_events=[
            KnowledgeEvent(character_id="c3", fact_id="f2", chapter=2, mode="told", source_character_id="c2", quote="Hale told Rao everything.")
        ],
    )
    storage.save_chapter_extraction(mid, 1, ext1)
    storage.save_chapter_extraction(mid, 2, ext2)
    storage.set_analyzed(mid, [])

    # Query chapter 1: should ONLY see fact f1, no edge to Rao, and Rao knows 0 facts
    g1 = client.get(f"/manuscripts/{mid}/graph?chapter=1").json()
    assert g1["chapter"] == 1
    assert len(g1["facts"]) == 1
    assert g1["facts"][0]["id"] == "f1"
    assert len(g1["edges"]) == 0

    # Query chapter 2: should see both facts and the edge c2 -> c3
    g2 = client.get(f"/manuscripts/{mid}/graph?chapter=2").json()
    assert g2["chapter"] == 2
    assert len(g2["facts"]) == 2
    assert len(g2["edges"]) == 1
    assert g2["edges"][0]["source"] == "c2"
    assert g2["edges"][0]["target"] == "c3"


def test_contradictions_endpoint_matches_contract():
    mid = "test_contra_mid"
    storage.save_manuscript(mid, "Test Story", "text", [{"n": 1, "text": "text"}])
    storage.set_analyzed(mid, [
        Contradiction(
            id="x1",
            type="premature_knowledge",
            severity="high",
            explanation="Rao mentions the will before learning it.",
            evidence=[EvidenceItem(chapter=1, quote="Rao mentioned the will", start=0, end=22)],
            suggested_fix="Move discovery earlier",
        )
    ])

    res = client.get(f"/manuscripts/{mid}/contradictions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == "x1"
    assert data[0]["type"] == "premature_knowledge"
    assert data[0]["severity"] == "high"
    assert "evidence" in data[0]
    assert data[0]["evidence"][0]["chapter"] == 1


def test_extractor_metrics_endpoint():
    res = client.get("/extractor/metrics")
    assert res.status_code == 200
    payload = res.json()
    assert "gemini" in payload
    assert "adapted" in payload
    assert "calls" in payload["gemini"]
    assert "logs" in payload["gemini"]
