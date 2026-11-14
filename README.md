# NarrativeOS (who-knew-what)

> **"Your story can become more complicated without becoming inconsistent."**  
> An AI reasoning & verification engine that tracks character epistemic state, catches plot holes with verbatim evidence, and never rewrites your prose.

---

## Problem
Fiction writers writing multi-POV, intricate plots (murder mysteries, fantasy epics, thrillers) struggle with continuity: *Did Mara already know Hale was poisoned when she accused him in Chapter 3? Was Roland in London or Drenwick on Tuesday night?* Existing tools (Sudowrite, Novelcrafter) focus on generating prose, but lack causal and epistemic reasoning to catch subtle continuity bugs.

## Solution
NarrativeOS combines:
1. **Character Knowledge Graphs:** Track who knows what, when they learned it, and from whom.
2. **Epistemic & Causal Rule Engine:** Flags premature knowledge, presence violations, timeline paradoxes, and attribute drift.
3. **Verbatim Evidence Verification:** Every detected issue references exact, character-for-character substrings from your manuscript. Humans stay in control.

---

## How It Works

```text
[Manuscript (.txt/.docx)]
        │
        ▼ (Regex / Chunking)
[Chapter Splitter] ──► [LLM Extractor (Gemini / Adaption fine-tuned)]
                                │
                                ▼ Structured JSON (facts, events, knowledge)
                        [Facts & Knowledge Store]
                                │
                                ▼
                        [Rule Engine (Python/networkx)]
                         - premature_knowledge
                         - presence / colocation
                         - timeline & travel
                         - character attributes
                                │
                                ▼ Candidate Warnings
                        [Quote-Exact Verifier] ──► Drops ungrounded hallucinations
                                │
                                ▼ Clean API Output
[Next.js + React Flow Knowledge Graph] ◄──► [Side-by-Side Evidence Panel]
```

---

## Adaption Labs Integration

We fine-tune a specialized **Story Continuity Extractor** using Adaption's Adaptive Data platform to solve the #1 failure mode of generalist LLMs: quote hallucinations and missing epistemic links.

* **Invent a Dataset:** Synthetic continuity examples generated from behavioral prompt specifications (`data/adaption/invent_prompt.txt`).
* **Gutenberg Public-Domain Dataset:** Labeled training examples from classic literature (`data/gutenberg/`) passed through strict quote-exactness filtering (`data/adaption/build_training.py`).
* **Model Training:** Automated fine-tuning via Adaption's AutoScientist / Together AI integration.
* **Architecture Switch:** Swappable extractor via `EXTRACTOR=gemini|adapted` adhering strictly to `/contracts/schema.json`.

| Extractor Model | JSON Validity | Quote Exactness | Precision | Recall | F1 Score | Latency (avg) |
|---|---|---|---|---|---|---|
| **Gemini 2.5 Flash (Baseline)** | 98.2% | 91.5% | 0.833 | 0.750 | 0.789 | 2.14s |
| **Adaption Fine-Tuned (Adapted)** | 99.8% | 98.9% | 0.910 | 0.875 | 0.892 | 1.48s |

*(Benchmark run on 6-chapter held-out planted-error test suite; never included in training data).*

---

## Tech Stack
* **Frontend:** Next.js (App Router), Tailwind CSS, React Flow, Lucide Icons
* **Backend:** Python 3.12, FastAPI, SQLModel / SQLite, NetworkX, Pydantic v2
* **AI & Fine-Tuning:** Google Gemini 2.5 Flash, Adaption Labs (Adaptive Data, AutoScientist)
* **Testing & Eval:** Pytest, custom precision/recall/F1 benchmark suite (`eval/run_eval.py`)

---

## Quickstart

### Backend
```bash
cd api
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd web
npm install
npm run dev
# Open http://localhost:3000
```

---

## Project Structure
```text
├── api/          # FastAPI server, extraction pipeline, rule engine, verifier
├── contracts/    # Shared schema.json and mock payloads
├── data/         # Planted-error test story, answer key, gutenberg samples, adaption data
├── docs/         # Architecture diagrams, adaption plan, demo script, team guide
├── eval/         # run_eval.py and benchmark results.md
└── web/          # Next.js interactive creator studio & React Flow graph
```

---

## Roadmap (Live Finale Build — Nov 21)
* **What-If Story Simulator:** Branch the knowledge graph ("What if Roland learned of the will in Chapter 1?") without altering the text.
* **Interactive Timeline View:** Visual travel-time and simultaneous-presence verification.
* **Exportable Continuity Audit:** Downloadable PDF report with highlighted manuscript citations.

---

## Team
* **Member 1 (A):** AI & Backend Lead
* **Member 2 (B):** Frontend Lead
* **Member 3 (C):** Data, Adaption, Integration, Docs & Video Lead
