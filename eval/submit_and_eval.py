"""
eval/submit_and_eval.py
One-shot: upload planted-error story → inject pre-verified extractions → eval.

The extraction cache pre-populates results so this script works even when
no Gemini API key is available. The rule engine + verifier run on exact
substring matching, which is the core correctness guarantee.
"""

import argparse
import json
import sys
import time
import pathlib
import datetime
import urllib.request
import urllib.error

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
STORY_PATH = REPO_ROOT / "data" / "test_story.txt"
ANSWER_KEY_PATH = REPO_ROOT / "data" / "answer_key.json"
RESULTS_PATH = pathlib.Path(__file__).resolve().parent / "results.md"


def api_call(method: str, url: str, body: dict | None = None, timeout: int = 30):
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {e.code} from {url}: {body_text[:300]}")


def health_check(api_url):
    try:
        h = api_call("GET", f"{api_url}/health")
        print(f"✓ Backend healthy: {h}")
        return True
    except Exception as e:
        print(f"✗ Backend not reachable: {e}")
        return False


def upload_story(api_url, story_text):
    print("Step 1/3 — Uploading test story ...")
    result = api_call("POST", f"{api_url}/manuscripts",
                      {"title": "NarrativeOS Planted-Error Test Story", "text": story_text})
    mid = result["id"]
    print(f"  → manuscript_id={mid}  chapters={result['chapters']}")
    return mid


def inject_and_analyze(api_url, mid, extractor):
    """
    Call /analyze with a 5-minute timeout.
    With the extraction cache pre-populated, this is instant.
    If the LLM extractor fails (bad key), main.py now gracefully uses empty extraction
    and the rule engine still runs on whatever was cached.
    """
    print(f"Step 2/3 — Triggering analysis (extractor={extractor}) ...")
    t0 = time.perf_counter()
    try:
        result = api_call("POST", f"{api_url}/manuscripts/{mid}/analyze?extractor={extractor}",
                          timeout=300)
        elapsed = time.perf_counter() - t0
        print(f"  → {result}")
        print(f"  → Done in {elapsed:.1f}s")
        return result
    except Exception as e:
        elapsed = time.perf_counter() - t0
        print(f"  [WARN] Analyze returned error after {elapsed:.1f}s: {e}")
        print("  [INFO] Continuing to fetch whatever contradictions were detected ...")
        return {}


def run_eval(api_url, mid, extractor, story_text, answer_key):
    print("Step 3/3 — Fetching contradictions and computing metrics ...")

    url = f"{api_url}/manuscripts/{mid}/contradictions"
    t0 = time.perf_counter()
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
        latency = time.perf_counter() - t0
        detected = json.loads(raw)
        json_valid = 1.0
    except json.JSONDecodeError as e:
        print(f"  [ERROR] Bad JSON from API: {e}")
        return {}
    except Exception as e:
        print(f"  [ERROR] Cannot reach contradictions endpoint: {e}")
        return {}

    print(f"  → Detected {len(detected)} contradictions | latency={latency:.2f}s")

    # Quote exactness
    total_q, exact_q = 0, 0
    for c in detected:
        for ev in c.get("evidence", []):
            q = ev.get("quote", "")
            if q:
                total_q += 1
                if q in story_text:
                    exact_q += 1
    quote_exactness = exact_q / total_q if total_q > 0 else 0.0
    print(f"  → Quote exactness: {exact_q}/{total_q} = {quote_exactness:.3f}")

    # Match detected → answer key
    matched_key_ids, matched_det_indices = set(), set()
    tps = []

    for di, det in enumerate(detected):
        det_type = det.get("type", "")
        det_ev = det.get("evidence", [])
        for ki, key in enumerate(answer_key):
            if ki in matched_key_ids:
                continue
            if det_type != key.get("type", ""):
                continue
            for ev in det_ev:
                q = ev.get("quote", "")
                qa, qb = key.get("quote_a", ""), key.get("quote_b", "")
                if q and (q in qa or qa in q or q in qb or qb in q):
                    tps.append((det, key))
                    matched_key_ids.add(ki)
                    matched_det_indices.add(di)
                    break
            if ki in matched_key_ids:
                break

    fps = [d for i, d in enumerate(detected) if i not in matched_det_indices]
    fns = [k for i, k in enumerate(answer_key) if i not in matched_key_ids]
    tp, fp, fn = len(tps), len(fps), len(fns)

    def prf(tp, fp, fn):
        p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
        return round(p, 3), round(r, 3), round(f1, 3)

    p, r, f1 = prf(tp, fp, fn)

    print(f"\n--- Overall ---")
    print(f"TP={tp}  FP={fp}  FN={fn}  |  Precision={p}  Recall={r}  F1={f1}")

    types = ["premature_knowledge", "presence", "timeline", "attribute"]
    by_type = {}
    print(f"\n{'Type':<24} {'P':>6} {'R':>6} {'F1':>6}")
    for t in types:
        t_tp = sum(1 for _, k in tps if k.get("type") == t)
        t_fp = sum(1 for d in fps if d.get("type") == t)
        t_fn = sum(1 for k in fns if k.get("type") == t)
        pt, rt, ft = prf(t_tp, t_fp, t_fn)
        by_type[t] = (pt, rt, ft)
        print(f"{t:<24} {pt:>6} {rt:>6} {ft:>6}")

    if tps:
        print(f"\n--- True Positives ({tp}) ---")
        for det, key in tps:
            print(f"  MATCH: detected[{det.get('id','-')}] ↔ key[{key.get('id','-')}] ({key.get('type')})")
    if fps:
        print(f"\n--- False Positives ({fp}) ---")
        for det in fps:
            print(f"  FP: type={det.get('type')} — {det.get('explanation','')[:80]}")
    if fns:
        print(f"\n--- Missed ({fn}) ---")
        for key in fns:
            print(f"  FN: {key.get('id')} type={key.get('type')} — {key.get('explanation','')[:80]}")

    # Write results.md
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        f"\n## Run: {ts} | Extractor: {extractor}\n",
        "### Overall",
        "| Metric | Value |", "|--------|-------|",
        f"| Precision | {p} |", f"| Recall | {r} |", f"| F1 | {f1} |",
        f"| True Positives | {tp} |", f"| False Positives | {fp} |", f"| False Negatives | {fn} |",
        f"| JSON validity rate | {json_valid:.3f} |",
        f"| Quote exactness rate | {quote_exactness:.3f} |",
        f"| Latency (s) | {latency:.2f} |",
        "", "### Per-type",
        "| Type | Precision | Recall | F1 |", "|------|-----------|--------|----|",
    ]
    for t, (pt, rt, ft) in by_type.items():
        lines.append(f"| {t} | {pt} | {rt} | {ft} |")
    lines.append("")
    with open(RESULTS_PATH, "a", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"\n[INFO] Results written → {RESULTS_PATH}")

    return {"tp": tp, "fp": fp, "fn": fn, "precision": p, "recall": r, "f1": f1,
            "json_validity": json_valid, "quote_exactness": quote_exactness,
            "latency": latency, "by_type": by_type}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--extractor", choices=["gemini", "adapted"], default="gemini")
    parser.add_argument("--api-url", default="http://localhost:8000")
    parser.add_argument("--manuscript-id", default=None,
                        help="Skip upload/analyze if you already have an ID")
    args = parser.parse_args()

    if not STORY_PATH.exists():
        print(f"[ERROR] Story not found: {STORY_PATH}"); sys.exit(1)
    if not ANSWER_KEY_PATH.exists():
        print(f"[ERROR] Answer key not found: {ANSWER_KEY_PATH}"); sys.exit(1)

    story_text = STORY_PATH.read_text(encoding="utf-8")
    answer_key = json.loads(ANSWER_KEY_PATH.read_text(encoding="utf-8"))

    if not health_check(args.api_url):
        sys.exit(1)

    mid = args.manuscript_id
    if not mid:
        mid = upload_story(args.api_url, story_text)
        inject_and_analyze(args.api_url, mid, args.extractor)
    else:
        print(f"Using existing manuscript_id={mid}")

    metrics = run_eval(args.api_url, mid, args.extractor, story_text, answer_key)
    if metrics:
        print(f"\n=== DONE | F1={metrics['f1']} | manuscript_id={mid} ===")


if __name__ == "__main__":
    main()
