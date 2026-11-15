# Adaption Adaptive Data: Real Run Results & Evidence

This document records the official run results and audit evidence from executing the Adaption Adaptive Data pipeline on our extraction training corpus.

---

## 1. Pipeline Execution Metadata

| Parameter | Value |
|---|---|
| **Platform** | Adaption Adaptive Data (`https://api.prod.adaptionlabs.ai`) |
| **Dataset ID** | `2fb3dd5b-5bc8-41d0-8f77-c5f3f472058d` |
| **Run ID** | `dataset-2fb3dd5b-5bc8-41d0-8f77-c5f3f472058d-1794767134294` |
| **Status** | `succeeded` (100% progress, 3 of 3 rows) |
| **Execution Time** | ~159 seconds (~2.6 minutes) |
| **Credits Charged** | **1.0 credit** ($1.00 USD) |
| **Input Dataset** | [`data/adaption/seed_dataset.jsonl`](../data/adaption/seed_dataset.jsonl) (3 rows, 6,872 bytes) |
| **Output Dataset** | [`data/adaption/adapted_dataset.jsonl`](../data/adaption/adapted_dataset.jsonl) (3 rows, 10,756 bytes) |
| **Output Columns** | `prompt`, `completion`, `enhanced_prompt`, `enhanced_completion` |

---

## 2. Evaluation & Quality Metrics (Before vs After)

Adaption's automated evaluation benchmark scored the quality of the dataset before and after adaptation:

| Metric | Before Adaptation | After Adaptation | Delta / Improvement |
|---|---|---|---|
| **Quality Grade** | **A** | **A** | Maintained top tier |
| **Quality Score (0–10)** | **9.0** | **9.5** | **+0.5 points** |
| **Percentile Rank** | — | **57.7%** | — |
| **Relative Improvement** | — | — | **+5.6%** |

---

## 3. Held-Out Evaluation Leakage Audit

Per competition and scientific guidelines, the held-out evaluation story (`data/test_story.txt`) and answer key (`data/answer_key.json`) were strictly isolated from the training data.

- **Audit script:** `data/adaption/check_leakage.py`
- **Protected entities:** 11 specific character and place names (Clara Voss, Edmund Ashford, Petra Ashford, Roland Fenn, Mira Colston, Delia Morrow, Constable Briggs, Ashford Manor, Drenwick, Millhaven, Ashford Fenn Capital).
- **Protected quotes:** 16 exact quotes from the planted-error answer key.
- **Audit outcome:** `0 leaks detected` across all input and output datasets.

```text
======================================================================
   NARRATIVEOS: HELD-OUT DATASET LEAKAGE AUDIT
======================================================================
Loaded held-out evaluation suite:
  • Test story:       test_story.txt (1,773 words)
  • Answer key:       answer_key.json (16 reference quotes)
  • Protected terms:  11 specific character/place entities

  ✅ PASSED: training_data.jsonl              (clean, 19,421 bytes, 0 leaks)
  ✅ PASSED: seed_dataset.jsonl               (clean, 6,872 bytes, 0 leaks)
  ✅ PASSED: adapted_dataset.jsonl            (clean, 10,756 bytes, 0 leaks)
----------------------------------------------------------------------
RESULT: ZERO DATA LEAKAGE DETECTED.
The training corpus is 100% disjoint from the held-out evaluation benchmark.
======================================================================
```

---

## 4. Dataset Inspection & Artifacts

- **Input Seed Dataset:** [`data/adaption/seed_dataset.jsonl`](../data/adaption/seed_dataset.jsonl)
- **Adapted Dataset:** [`data/adaption/adapted_dataset.jsonl`](../data/adaption/adapted_dataset.jsonl)
- **Workflow Automation:** [`data/adaption/adaption_workflow.py`](../data/adaption/adaption_workflow.py)
- **Run State Metadata:** [`data/adaption/adaption_state.json`](../data/adaption/adaption_state.json)
