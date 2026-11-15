# NarrativeOS — The Story Intelligence Engine

> **"Your story can become more complicated without becoming inconsistent."**
>
> An AI reasoning & verification engine that tracks who knows what in your manuscript,
> catches plot holes with verbatim evidence, and **never rewrites your prose**.

---

## The Problem

Fiction writers who craft complex, multi-POV plots lose track of **epistemic state** —
*who learned which secret, when, from whom*. Existing AI tools generate prose;
none reason over character knowledge and causality to catch subtle continuity bugs.

## Our Solution

NarrativeOS is a **reasoning and verification engine**, not a prose generator. It combines:

1. **Character Knowledge Graph** — tracks each character's epistemic state chapter by chapter
2. **Causal Rule Engine** — detects premature knowledge, presence violations, timeline paradoxes, and attribute drift
3. **Verbatim Evidence** — every finding shows exact quotes copied character-for-character from your manuscript; hallucinations are dropped by a quote-exact verifier

---

## Architecture

```
Manuscript (.txt / .docx)
        │
        ▼ Regex splitter
  ┌─────────────┐
  │   Chapters  │  1 … N
  └──────┬──────┘
         │  per-chapter call (cached by content hash)
         ▼
  ┌──────────────────────────────────────┐
  │  Extractor  (EXTRACTOR=gemini|adapted)│
  │  • GeminiExtractor  (baseline)        │
  │  • AdaptedExtractor (Adaption LoRA)   │
  └──────────────────┬───────────────────┘
                     │  Structured JSON (characters, facts,
                     │  knowledge_events, references, events)
                     ▼
            ┌────────────────┐
            │  In-memory DB  │  (ManuscriptStorage)
            └───────┬────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   Rule Engine    │  Pure Python — no LLM
         │  premature_know. │
         │  presence        │
         │  timeline        │
         │  attribute       │
         └────────┬─────────┘
                  │  Candidate warnings
                  ▼
        ┌──────────────────────┐
        │  Quote-Exact Verifier│  LLM (Gemini) + substring check
        │  drops hallucinations│  — if quote ∉ chapter text, dropped
        └──────────┬───────────┘
                   │  Verified contradictions
                   ▼
  ┌──────────────────────────────────────────────┐
  │            REST API  (FastAPI)               │
  │  POST /manuscripts  • POST /…/analyze        │
  │  GET  /…/graph?chapter=N                     │
  │  GET  /…/contradictions                      │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │         Next.js Creator Studio               │
  │  Upload ─► Knowledge Graph (React Flow)      │
  │          ─► Chapter Slider (epistemic replay) │
  │          ─► Contradiction Evidence Panel     │
  │          ─► Model Comparison Badge/Table      │
  └──────────────────────────────────────────────┘
```

---

## Adaption Labs Integration

We fine-tune a specialized **Story Continuity Extractor** to fix the #1 LLM failure:
hallucinated quotes and missing epistemic links.

| Step | Description |
|---|---|
| **Invent a Dataset** | Synthetic extraction examples generated from `data/adaption/invent_prompt.txt` |
| **Gutenberg corpus** | Public-domain chapters labeled via baseline Gemini + quote-filter (`data/adaption/build_training.py`) |
| **Fine-tune** | LoRA adapter on open-weight model via Adaption AutoScientist / Together AI |
| **Switch** | `EXTRACTOR=adapted` swaps in `AdaptedExtractor`; both return identical contract JSON |

### Accuracy — Planted-Error Test Suite (8 known contradictions, never trained on)

| Metric | Gemini Baseline | Adaption Fine-Tuned |
|---|---|---|
| JSON Validity | 100.0% | Pending fine-tune run |
| Quote Exactness | 100.0% | Pending fine-tune run |
| Precision | 0.800 | Pending fine-tune run |
| Recall | 0.500 | Pending fine-tune run |
| **F1** | **0.615** | **Pending fine-tune run** |
| Latency (avg) | 2.07s | Pending fine-tune run |

*Full evaluation logs and per-type breakdown recorded in [`eval/results.md`](eval/results.md)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS, React Flow |
| Backend | Python 3.12, FastAPI, Pydantic v2, NetworkX |
| AI — Baseline | Google Gemini 2.0 Flash (structured JSON output) |
| AI — Fine-Tuned | Adaption Labs (Adaptive Data + AutoScientist) |
| Deployment | Vercel (web) + Render (api) |

---

## Setup

### 1. Clone & configure

```bash
git clone https://github.com/shreejato/who-knew-what.git
cd who-knew-what
cp .env.example .env
# → paste your GEMINI_API_KEY into .env
```

### 2. Backend

```bash
cd api
python -m venv .venv
source .venv/bin/activate        # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Verify → http://localhost:8000/docs
```

### 3. Frontend

```bash
cd web
npm install
npm run dev
# Verify → http://localhost:3000
```

### 4. Run the accuracy benchmark

```bash
# (Backend must be running)
cd eval
python submit_and_eval.py --extractor gemini
# Results written to eval/results.md
```

---

## Project Structure

```
├── api/           FastAPI server (extraction, rules, verifier, routes)
│   └── app/
│       ├── extraction/   GeminiExtractor · AdaptedExtractor · factory
│       ├── rules/        premature_knowledge · presence · timeline · attribute
│       └── verifier/     quote-exact contradiction verifier
├── contracts/     schema.json + mock payloads
├── data/
│   ├── test_story.txt      6-chapter planted-error test story (held-out, never trained on)
│   ├── answer_key.json     8 known errors with verbatim quotes
│   ├── gutenberg/          Public-domain source chapters (Sherlock Holmes)
│   └── adaption/           Invent-a-Dataset prompt + training pipeline
├── docs/          Architecture notes, Adaption plan, demo script
├── eval/
│   ├── submit_and_eval.py  One-shot: upload → analyze → eval → results.md
│   ├── run_eval.py         Standalone eval against existing manuscript id
│   └── results.md          Benchmark output (auto-appended)
└── web/           Next.js studio (upload, knowledge graph, contradiction panel)
```

---

## Roadmap — Finale Build (Nov 21, live at TIU)

- **What-If Story Simulator** — branch alternate knowledge without altering the text
- **Interactive Timeline View** — travel-time and simultaneous-presence visualization
- **Exportable Consistency Report** — downloadable PDF with manuscript citations
- **Adaption Round 2** — retrain on judges' own sample text, live

---

## Team

| Member | Role |
|---|---|
| **Member 1 (A)** | AI & Backend Lead — extraction, rule engine, verifier, API |
| **Member 2 (B)** | Frontend Lead — dark UI, React Flow graph, contradiction panel |
| **Member 3 (C)** | Data, Adaption, Docs, Deploy, Video |
