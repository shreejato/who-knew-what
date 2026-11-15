# NarrativeOS — Eval Results

Accuracy of the contradiction detector on the planted-error test story.  
**8 known errors:** 2 premature_knowledge · 2 presence · 2 timeline · 2 attribute  
Run with: `python eval/run_eval.py --manuscript-id <mid> --extractor gemini|adapted`

---

<!-- Results are appended automatically by run_eval.py -->

## Run: 2026-11-15 11:18 | Extractor: gemini

### Overall
| Metric | Value |
|--------|-------|
| Precision | 0.8 |
| Recall | 0.5 |
| F1 | 0.615 |
| True Positives | 4 |
| False Positives | 1 |
| False Negatives | 4 |
| JSON validity rate | 1.000 |
| Quote exactness rate | 1.000 |
| Latency (s) | 2.07 |

### Per-type
| Type | Precision | Recall | F1 |
|------|-----------|--------|----|
| premature_knowledge | 1.0 | 1.0 | 1.0 |
| presence | 0.5 | 0.5 | 0.5 |
| timeline | 0.0 | 0.0 | 0.0 |
| attribute | 1.0 | 0.5 | 0.667 |

## Run: 2026-11-15 13:15 | Extractor: adapted

### Overall
| Metric | Value |
|--------|-------|
| Precision | 0.8 |
| Recall | 0.5 |
| F1 | 0.615 |
| True Positives | 4 |
| False Positives | 1 |
| False Negatives | 4 |
| JSON validity rate | 1.000 |
| Quote exactness rate | 1.000 |
| Latency (s) | 2.05 |

### Per-type
| Type | Precision | Recall | F1 |
|------|-----------|--------|----|
| premature_knowledge | 1.0 | 1.0 | 1.0 |
| presence | 0.5 | 0.5 | 0.5 |
| timeline | 0.0 | 0.0 | 0.0 |
| attribute | 1.0 | 0.5 | 0.667 |

## Run: 2026-11-15 13:16 | Extractor: adapted

### Overall
| Metric | Value |
|--------|-------|
| Precision | 0.8 |
| Recall | 0.5 |
| F1 | 0.615 |
| TP | 4 | FP | 1 | FN | 4 |
| JSON validity rate | 1.000 |
| Quote exactness rate | 1.000 |
| Latency (s) | 2.06 |

### Per-type F1
| Type | Precision | Recall | F1 |
|------|-----------|--------|----|
| attribute | 1.0 | 0.5 | 0.667 |
| premature_knowledge | 1.0 | 1.0 | 1.0 |
| timeline | 0.0 | 0.0 | 0.0 |
| presence | 0.5 | 0.5 | 0.5 |
