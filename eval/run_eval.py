"""
eval/run_eval.py
NarrativeOS accuracy evaluation script.

Usage:
    python run_eval.py --manuscript-id <mid> [--extractor gemini|adapted] [--api-url http://localhost:8000]

Outputs:
    - Per-contradiction match table to stdout
    - Per-type precision/recall/F1 to stdout
    - JSON-validity rate, quote-exactness rate, latency to stdout
    - Appends a dated results block to eval/results.md
"""

import argparse
import json
import time
import sys
import pathlib
import datetime

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
ANSWER_KEY_PATH = REPO_ROOT / "data" / "answer_key.json"
RESULTS_PATH = pathlib.Path(__file__).resolve().parent / "results.md"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="NarrativeOS eval script")
    p.add_argument("--manuscript-id", required=True, help="Manuscript ID returned by POST /manuscripts")
    p.add_argument("--extractor", choices=["gemini", "adapted"], default="gemini")
    p.add_argument("--api-url", default="http://localhost:8000")
    return p.parse_args()

# ---------------------------------------------------------------------------
# Fetch contradictions from the API
# ---------------------------------------------------------------------------

def fetch_contradictions(api_url: str, manuscript_id: str) -> tuple[list[dict], float, float]:
    """
    Returns (contradictions, latency_seconds, json_validity_rate).
    json_validity_rate = 1.0 if the response parsed cleanly, 0.0 otherwise.
    """
    try:
        import urllib.request
        url = f"{api_url}/manuscripts/{manuscript_id}/contradictions"
        t0 = time.perf_counter()
        with urllib.request.urlopen(url, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
        latency = time.perf_counter() - t0
        data = json.loads(raw)
        if not isinstance(data, list):
            print(f"[WARN] /contradictions returned non-list: {type(data)}", file=sys.stderr)
            return [], latency, 0.0
        return data, latency, 1.0
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON from API: {e}", file=sys.stderr)
        return [], 0.0, 0.0
    except Exception as e:
        print(f"[ERROR] Could not reach API: {e}", file=sys.stderr)
        return [], 0.0, 0.0

# ---------------------------------------------------------------------------
# Quote-exactness check
# ---------------------------------------------------------------------------

def load_story_text() -> str:
    """Load the planted-error test story for quote verification."""
    story_path = REPO_ROOT / "data" / "test_story.txt"
    if not story_path.exists():
        print(f"[WARN] Story file not found at {story_path}", file=sys.stderr)
        return ""
    return story_path.read_text(encoding="utf-8")

def check_quote_exactness(contradictions: list[dict], story_text: str) -> float:
    """
    For each evidence quote in every detected contradiction, check that it is
    a verbatim substring of the story. Returns fraction of quotes that pass.
    """
    if not story_text or not contradictions:
        return 0.0
    total = 0
    exact = 0
    for c in contradictions:
        for ev in c.get("evidence", []):
            q = ev.get("quote", "")
            if q:
                total += 1
                if q in story_text:
                    exact += 1
    return exact / total if total > 0 else 0.0

# ---------------------------------------------------------------------------
# Matching logic
# ---------------------------------------------------------------------------

def quotes_overlap(detected_ev: list[dict], key_quote_a: str, key_quote_b: str) -> bool:
    """
    A detected contradiction matches a key item if at least one of its evidence
    quotes is a substring of either key quote, or vice versa.
    This is intentionally generous: exact substring overlap is sufficient.
    """
    for ev in detected_ev:
        q = ev.get("quote", "")
        if not q:
            continue
        if (q in key_quote_a or key_quote_a in q or
                q in key_quote_b or key_quote_b in q):
            return True
    return False

def match_detected_to_key(detected: list[dict], answer_key: list[dict]) -> tuple[list, list, list]:
    """
    Returns (true_positives, false_positives, false_negatives).
    Each TP is (detected_item, key_item).
    Each FP is a detected item with no key match.
    Each FN is a key item with no detected match.
    """
    matched_key_ids = set()
    matched_det_indices = set()
    tps = []

    for di, det in enumerate(detected):
        det_type = det.get("type", "")
        det_ev = det.get("evidence", [])
        for ki, key in enumerate(answer_key):
            if ki in matched_key_ids:
                continue
            # Type must match
            if det_type != key.get("type", ""):
                continue
            # Evidence quotes must overlap
            if quotes_overlap(det_ev, key.get("quote_a", ""), key.get("quote_b", "")):
                tps.append((det, key))
                matched_key_ids.add(ki)
                matched_det_indices.add(di)
                break  # one-to-one matching

    fps = [det for di, det in enumerate(detected) if di not in matched_det_indices]
    fns = [key for ki, key in enumerate(answer_key) if ki not in matched_key_ids]
    return tps, fps, fns

# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def precision_recall_f1(tp: int, fp: int, fn: int) -> tuple[float, float, float]:
    p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
    return round(p, 3), round(r, 3), round(f1, 3)

def per_type_metrics(tps, fps, fns):
    types = {"premature_knowledge", "presence", "timeline", "attribute"}
    results = {}
    for t in types:
        t_tp = sum(1 for det, key in tps if key.get("type") == t)
        t_fp = sum(1 for det in fps if det.get("type") == t)
        t_fn = sum(1 for key in fns if key.get("type") == t)
        results[t] = precision_recall_f1(t_tp, t_fp, t_fn)
    return results

# ---------------------------------------------------------------------------
# Results markdown writer
# ---------------------------------------------------------------------------

def append_results_md(extractor: str, overall: dict, by_type: dict,
                       json_validity: float, quote_exactness: float, latency: float):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        f"\n## Run: {timestamp} | Extractor: {extractor}\n",
        "### Overall",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Precision | {overall['precision']} |",
        f"| Recall | {overall['recall']} |",
        f"| F1 | {overall['f1']} |",
        f"| TP | {overall['tp']} | FP | {overall['fp']} | FN | {overall['fn']} |",
        f"| JSON validity rate | {json_validity:.3f} |",
        f"| Quote exactness rate | {quote_exactness:.3f} |",
        f"| Latency (s) | {latency:.2f} |",
        "",
        "### Per-type F1",
        "| Type | Precision | Recall | F1 |",
        "|------|-----------|--------|----|",
    ]
    for t, (p, r, f) in by_type.items():
        lines.append(f"| {t} | {p} | {r} | {f} |")
    lines.append("")

    with open(RESULTS_PATH, "a", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"\n[INFO] Results appended to {RESULTS_PATH}")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    print(f"\n=== NarrativeOS Eval | extractor={args.extractor} | manuscript={args.manuscript_id} ===\n")

    # Load answer key
    if not ANSWER_KEY_PATH.exists():
        print(f"[ERROR] Answer key not found at {ANSWER_KEY_PATH}", file=sys.stderr)
        sys.exit(1)
    answer_key = json.loads(ANSWER_KEY_PATH.read_text(encoding="utf-8"))
    print(f"Answer key: {len(answer_key)} items")

    # Fetch detected contradictions
    print(f"Calling GET {args.api_url}/manuscripts/{args.manuscript_id}/contradictions ...")
    detected, latency, json_validity = fetch_contradictions(args.api_url, args.manuscript_id)
    print(f"Detected: {len(detected)} contradictions | latency={latency:.2f}s | json_valid={json_validity:.1f}")

    # Quote exactness
    story_text = load_story_text()
    quote_exactness = check_quote_exactness(detected, story_text)
    print(f"Quote exactness rate: {quote_exactness:.3f}")

    # Match
    tps, fps, fns = match_detected_to_key(detected, answer_key)
    tp, fp, fn = len(tps), len(fps), len(fns)

    # Overall metrics
    p, r, f1 = precision_recall_f1(tp, fp, fn)
    print(f"\n--- Overall ---")
    print(f"TP={tp}  FP={fp}  FN={fn}")
    print(f"Precision={p}  Recall={r}  F1={f1}")

    # Per-type
    by_type = per_type_metrics(tps, fps, fns)
    print(f"\n--- Per-type ---")
    print(f"{'Type':<24} {'P':>6} {'R':>6} {'F1':>6}")
    for t, (pt, rt, ft) in by_type.items():
        print(f"{t:<24} {pt:>6} {rt:>6} {ft:>6}")

    # True positives detail
    if tps:
        print(f"\n--- True Positives ({tp}) ---")
        for det, key in tps:
            print(f"  MATCH: detected[{det.get('id','-')}] ↔ key[{key.get('id','-')}] ({key.get('type')})")

    # False positives
    if fps:
        print(f"\n--- False Positives ({fp}) ---")
        for det in fps:
            print(f"  FP: {det.get('id','-')} type={det.get('type')} — {det.get('explanation','')[:80]}")

    # False negatives
    if fns:
        print(f"\n--- False Negatives / Missed ({fn}) ---")
        for key in fns:
            print(f"  FN: {key.get('id','-')} type={key.get('type')} — {key.get('explanation','')[:80]}")

    # Write results.md
    overall = {"precision": p, "recall": r, "f1": f1, "tp": tp, "fp": fp, "fn": fn}
    append_results_md(args.extractor, overall, by_type, json_validity, quote_exactness, latency)

    print("\nDone.")


if __name__ == "__main__":
    main()
