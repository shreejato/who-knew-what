# Adaption Labs Pipeline Execution & Go/No-Go Decision

**Owner:** Member 3 (Data, Adaption, Integration, Docs)  
**Track:** Storytelling & Co-Writers  
**Gate Status:** Baseline Gemini Eval Complete ✅ | Adaption Fine-Tune In Progress 🔄

---

## 1. Baseline Gemini Benchmark (Recorded in `eval/results.md`)

Evaluation completed on the 6-chapter held-out test story (`data/test_story.txt`):

| Metric | Score | Note |
|---|---|---|
| **Precision** | **0.800** | 4 TP, 1 FP |
| **Recall** | **0.500** | 4 TP, 4 FN |
| **F1 Score** | **0.615** | Strong baseline |
| **Quote Exactness** | **100.0%** | Zero hallucinated quotes |
| **JSON Validity** | **100.0%** | Conforms to `contracts/schema.json` |
| **Premature Knowledge F1** | **1.000** | Caught both epistemic leaks |

---

## 2. Cost Estimate & Budget Guardrails (CHECK BEFORE RUNNING)

### Pooled Credits Balance
* **Total Pooled Balance:** $3 \times 1,250 = \mathbf{3,750\text{ credits}}$ in Member 3 account.
* **Credit Safeguard Rule:** Always verify the estimated credit cost displayed on the Adaption interface before clicking start.

### Budget Breakdown
1. **Invent a Dataset:**
   - Input specification: `data/adaption/invent_prompt.txt`
   - Target size: 50–150 synthetic samples across genres (mystery, fantasy, historical fiction).
   - Expected cost: ~150–300 credits.
2. **AutoScientist / Together AI Fine-Tuning:**
   - Target Model: Llama-3-8B-Instruct or Mistral-7B (LoRA adapter).
   - Epochs: 2–3 epochs on ~100 curated examples.
   - Expected cost: ~1,200–1,800 credits.
   - **Cost Check Constraint:** If the estimated cost exceeds **2,200 credits**, reduce the training set size or epoch count to stay comfortably within the free credit pool.
3. **Reserve Buffer:**
   - Keep at least **1,000 credits** untouched for the offline finale live build on Nov 21.

### Critical Integrity Invariant
⚠️ **NEVER train on `data/test_story.txt` or `data/answer_key.json`.**  
The 6-chapter mystery is strictly our held-out test set. Only public-domain text (`data/gutenberg/`) and synthetic data from `invent_prompt.txt` may be used for training.

---

## 3. Step-by-Step Adaption Fine-Tune Execution

### Step A: Generate Synthetic Continuity Data (Invent a Dataset)
1. Log in to [adaptionlabs.ai](https://adaptionlabs.ai) using your registered account.
2. Select **Adaptive Data** $\rightarrow$ **Invent a Dataset**.
3. Copy the behavior prompt from `data/adaption/invent_prompt.txt` and paste it into the description field.
4. Set sample target to **50–100 samples**.
5. Note the estimated credit cost before generating. Click **Generate**.
6. Export the generated dataset as JSONL.

### Step B: Merge with Public-Domain Labeled Examples
1. Use our seed examples in `data/adaption/seed_dataset.jsonl` (Sherlock Holmes + Poe locked-room mysteries).
2. Run `data/adaption/build_training.py` to filter out any example that does not have 100% exact substring quotes.

### Step C: Launch Fine-Tuning Run
1. In the Adaption dashboard, go to **AutoScientist** / **Fine-Tune**.
2. Upload the combined JSONL dataset.
3. Select base model: **Llama-3-8B-Instruct** (or **Mistral-7B**).
4. Review the **Cost Estimate** and **ETA**:
   - Confirm cost $< 2,200$ credits.
5. Click **Start Fine-Tuning**.

---

## 4. Go / No-Go Decision Framework (Scheduled for ~4:00 PM)

At 4:00 PM, once training finishes (or if the job is still queued), apply this transparent decision tree:

```text
                     [Fine-Tuning Finished?]
                            │
               ┌────────────┴────────────┐
              YES                        NO / Timeout
               │                         │
      [Run Adapted Eval]       [NO-GO on Live Swapping]
               │                         │
      [Does Adapted win?]        Keep Gemini Baseline as default
        F1 >= 0.615?             Show pipeline + dataset in code
       Quote exact >= 95%?       Show honest comparison in README
               │                         │
       ┌───────┴───────┐                 ▼
      YES              NO       [Reserve Adapter for Finale]
       │               │
  [GO: Switch ON] [NO-GO: Keep Gemini]
  Set EXTRACTOR=  Report honest
  adapted in env  numbers in table
```

### Criteria for GO:
* Adapted model produces valid JSON $\ge 98\%$.
* Quote exactness $\ge 95\%$.
* Overall F1 on held-out test story $\ge 0.615$ (beats or matches Gemini baseline).
* Latency $\le 2.5\text{s}$.

### If NO-GO:
* Keep `EXTRACTOR=gemini` as the default in production.
* Display the honest comparison table in the README and UI comparison panel.
* Show the complete Adaption pipeline (`invent_prompt.txt`, `build_training.py`, `seed_dataset.jsonl`, and `AdaptedExtractor` switch) as technical depth to earn the hackathon's $25\%$ AI Integration & Adaption bonus.
