# Adaption Integration Plan & Strategy Document

**Owner:** Member 3 (Data, Adaption, Integration, Docs)  
**Project:** NarrativeOS (who-knew-what)  
**Hackathon:** GeNarrative Clash 2026 (Storytelling & Co-Writers Track)

---

## 1. Credit Pooling Decision (Confirmed)

### The Decision
**We will pool all three members' Adaption credits into a single account (Member 3's account) before Stage 3 fine-tuning.**

### Allocation & Math
- Member 1 credit allocation: **1,250 credits**
- Member 2 credit allocation: **1,250 credits**
- Member 3 credit allocation: **1,250 credits**
- **Total Combined Pool:** **3,750 credits**

### Justification
1. **Prevents Fragmented Balances:** A high-quality fine-tuning run (e.g. Llama-3-8B or Mistral-7B LoRA adapter through Together AI via Adaption) or multi-step dataset curation via AutoScientist typically requires between 1,500 and 2,500 credits. A single 1,250 balance risks aborting halfway through an epoch due to credit exhaustion.
2. **Centralized Job Ownership:** All jobs, datasets, and inference checkpoints reside under one workspace/API key, eliminating coordination overhead between teammates.
3. **Budget Guardrail:**
   - Pre-check cost estimates inside the Adaption dashboard before triggering any run.
   - Limit experimental generation to 100–300 synthetic samples to conserve tokens.
   - Retain at least 1,000 credits for final evaluation and potential live finale retraining.

---

## 2. Review of Adaption Labs Platform (`docs.adaptionlabs.ai`)

Based on official platform capabilities:
1. **Adaptive Data:**
   - Ingests raw unstructured text and converts it into structured training pairs.
   - Includes data cleansing, deduplication, and quality evaluation tools.
   - Feature: **Invent a Dataset** generates task-specific synthetic data from high-level natural language behavior specifications (using our `data/adaption/invent_prompt.txt`).
2. **AutoScientist:**
   - Automated fine-tuning system that co-optimizes datasets and model hyperparameters (learning rate, LoRA rank, batch size).
   - Generates model checkpoints exportable to Hugging Face or hosted inference.
3. **Together AI Integration:**
   - Executes fine-tuning jobs on open weights (e.g. Llama-3-8B-Instruct, Mistral-7B).
   - Displays estimated cost and ETA in the dashboard prior to submission.
4. **Target Role in NarrativeOS:**
   - Baseline LLMs frequently fail at structured extraction: hallucinating facts, dropping character links, or fabricating non-existent quotes.
   - We fine-tune a specialized **"Story Continuity Extractor"** trained strictly to extract facts and knowledge events with **100% verbatim substring quote fidelity**.

---

## 3. Strict Dataset Rules & Integrity
- **HELD-OUT EVALUATION INTEGRITY:** We will **NEVER** train on `data/test_story.txt` or `data/answer_key.json`. That 6-chapter mystery is strictly our held-out test benchmark. Leaking it into the training dataset invalidates judging.
- **DATA SOURCES:**
  1. Synthetic data generated via Adaption's "Invent a Dataset" (`data/adaption/invent_prompt.txt`).
  2. Public-domain chapters from Project Gutenberg (`data/gutenberg/*.txt`).
- **QUOTE INTEGRITY PASS:** Any example whose extracted quote does not match the source text character-for-character is discarded.

---

## 4. Prepared Questions for the Hackathon AMA

1. **Inference Hosting:** Once fine-tuning completes via AutoScientist / Together AI, does Adaption provide an active hosted inference API endpoint, or should we host the exported Hugging Face LoRA weights on RunPod / Together AI endpoint for the web app?
2. **Credit Consumption Rates:** What is the exact credit burn rate per 100 examples generated via "Invent a Dataset" vs per epoch of LoRA fine-tuning on an 8B model?
3. **Base Model Options:** Which base models are eligible under the free 1,250 hackathon credit tier (e.g., Llama 3 8B, Mistral 7B, Gemma 2 9B)?
4. **Third-Party Account Requirements:** Is a separate Together AI account and billing card required, or are compute credits drawn seamlessly from our Adaption credit pool?

---

## 5. Extractor Switch Architecture (`EXTRACTOR=gemini|adapted`)

In `api/`:
- `EXTRACTOR=gemini` (Default baseline): Uses Google Gemini with structured JSON schema.
- `EXTRACTOR=adapted` (Fine-tuned): Calls our specialized Adaption fine-tuned model.
- Both adhere identically to `contracts/schema.json`.
- The evaluation script `eval/run_eval.py` logs comparative metrics (precision, recall, F1, latency, quote exactness) to `eval/results.md` for transparent display in the UI and README.
