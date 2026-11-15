#!/usr/bin/env python3
"""
data/adaption/adaption_workflow.py
Manages interaction with the Adaption Adaptive Data platform:
- Upload dataset
- Fetch cost estimate
- Trigger adaptation run
- Monitor status, fetch evaluation, and download results
"""

import os
import sys
import time
import json
import pathlib
from dotenv import load_dotenv
from adaption import Adaption

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
load_dotenv(REPO_ROOT / ".env")

STATE_FILE = REPO_ROOT / "data" / "adaption" / "adaption_state.json"
ADAPTED_DATASET_FILE = REPO_ROOT / "data" / "adaption" / "adapted_dataset.jsonl"


def get_client() -> Adaption:
    api_key = os.getenv("ADAPTION_API_KEY")
    if not api_key:
        print("[ERROR] ADAPTION_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)
    return Adaption(api_key=api_key, base_url="https://api.prod.adaptionlabs.ai")


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def step2_upload(dataset_path: str = "data/adaption/seed_dataset.jsonl", name: str = "narrativeos-extraction-seed"):
    client = get_client()
    full_path = REPO_ROOT / dataset_path
    if not full_path.exists():
        print(f"[ERROR] File {full_path} not found!", file=sys.stderr)
        sys.exit(1)

    print(f"Uploading {full_path.name} to Adaption platform...")
    resp = client.datasets.upload_file(
        str(full_path),
        name=name,
        processing_mode="adapt",
    )

    dataset_id = resp.dataset_id
    status = resp.status
    print("Upload successful!")
    print(f"  • Dataset ID: {dataset_id}")
    print(f"  • Initial Status: {status}")

    state = load_state()
    state["dataset_id"] = dataset_id
    state["dataset_name"] = name
    state["file_path"] = str(dataset_path)
    state["upload_status"] = status
    save_state(state)
    return dataset_id, status


def step3_estimate(dataset_id: str):
    client = get_client()
    print(f"Requesting cost estimate for dataset {dataset_id}...")
    est = client.datasets.adapt(
        dataset_id,
        estimate=True,
        column_mapping={"prompt": "prompt", "completion": "completion"},
    )
    print("Cost estimate response:")
    print(f"  • Estimated credits: {est.estimated_credits_consumed}")
    print(f"  • Estimated minutes: {est.estimated_minutes}")
    print(f"  • Multimodal pricing: {est.multimodal_pricing_applied}")
    state = load_state()
    state["estimate"] = {
        "estimated_credits_consumed": est.estimated_credits_consumed,
        "estimated_minutes": est.estimated_minutes,
        "multimodal_pricing_applied": est.multimodal_pricing_applied,
    }
    save_state(state)
    return est


def step4_run_and_download(dataset_id: str):
    client = get_client()
    state = load_state()

    print(f"\n=======================================================")
    print(f"  LAUNCHING ADAPTATION RUN: Dataset {dataset_id}")
    print(f"=======================================================")

    # 1. Launch real adaptation run
    adapt_resp = client.datasets.adapt(
        dataset_id,
        estimate=False,
        column_mapping={"prompt": "prompt", "completion": "completion"},
    )

    run_id = adapt_resp.run_id
    credits = adapt_resp.estimated_credits_consumed
    print(f"Adaptation job triggered successfully:")
    print(f"  • Run ID:          {run_id}")
    print(f"  • Credits charged: {credits}")
    print(f"  • Est. minutes:    {adapt_resp.estimated_minutes}")

    state["run_id"] = run_id
    state["credits_charged"] = credits
    state["run_start_time"] = time.time()
    save_state(state)

    # 2. Poll dataset status until terminal
    print("\nMonitoring processing status...")
    start_time = time.time()
    poll_count = 0
    final_status = "unknown"

    while True:
        poll_count += 1
        elapsed = int(time.time() - start_time)
        try:
            st = client.datasets.get_status(dataset_id)
            current_status = getattr(st, "status", None) or "unknown"
            progress = getattr(st, "progress", None)
            progress_str = f" ({progress})" if progress else ""
            print(f"  [{elapsed}s elapsed] Status: {current_status}{progress_str}")

            if current_status in ["succeeded", "ready", "complete", "completed"]:
                final_status = current_status
                break
            elif current_status in ["failed", "cancelled", "error"]:
                final_status = current_status
                error_data = getattr(st, "error_data", None)
                print(f"[ERROR] Adaptation run failed: {error_data}", file=sys.stderr)
                break
        except Exception as e:
            print(f"  [Warning during poll #{poll_count}]: {e}")

        time.sleep(15)

    state["final_status"] = final_status
    save_state(state)

    if final_status not in ["succeeded", "ready", "complete", "completed"]:
        print(f"\n[ERROR] Pipeline ended with status '{final_status}'. Aborting fetch.")
        sys.exit(1)

    print("\n✓ Adaptation pipeline completed successfully!")

    # 3. Wait for evaluation results
    print("\nFetching evaluation metrics...")
    eval_data = None
    try:
        eval_resp = client.datasets.wait_for_evaluation(dataset_id, timeout=300.0)
        quality = getattr(eval_resp, "quality", None)
        status_eval = getattr(eval_resp, "status", None)
        print(f"Evaluation status: {status_eval}")
        if quality:
            print("Quality Breakdown:")
            print(f"  • Grade Before:        {getattr(quality, 'grade_before', 'N/A')}")
            print(f"  • Grade After:         {getattr(quality, 'grade_after', 'N/A')}")
            print(f"  • Score Before:        {getattr(quality, 'score_before', 'N/A')}")
            print(f"  • Score After:         {getattr(quality, 'score_after', 'N/A')}")
            print(f"  • Percentile After:    {getattr(quality, 'percentile_after', 'N/A')}")
            print(f"  • Improvement (%):     {getattr(quality, 'improvement_percent', 'N/A')}%")
            eval_data = quality.model_dump() if hasattr(quality, "model_dump") else dict(quality)
        state["evaluation"] = eval_data
        save_state(state)
    except Exception as e:
        print(f"[Notice on evaluation fetch]: {e}")
        try:
            eval_resp = client.datasets.get_evaluation(dataset_id)
            quality = getattr(eval_resp, "quality", None)
            if quality:
                eval_data = quality.model_dump() if hasattr(quality, "model_dump") else dict(quality)
                state["evaluation"] = eval_data
                save_state(state)
        except Exception as e2:
            print(f"[Could not fetch eval]: {e2}")

    # 4. Download adapted dataset
    print(f"\nDownloading adapted dataset to {ADAPTED_DATASET_FILE.name}...")
    try:
        down_resp = client.datasets.download(dataset_id, file_format="jsonl")
        content = down_resp.content
        ADAPTED_DATASET_FILE.write_bytes(content)
        row_count = len([line for line in content.splitlines() if line.strip()])
        print(f"✓ Download complete! Saved {len(content):,} bytes ({row_count} rows) to:")
        print(f"  {ADAPTED_DATASET_FILE}")
        state["downloaded_file"] = str(ADAPTED_DATASET_FILE)
        state["downloaded_rows"] = row_count
        save_state(state)
    except Exception as e:
        print(f"[ERROR downloading dataset]: {e}", file=sys.stderr)

    # 5. Fetch full dataset metadata
    try:
        ds = client.datasets.get(dataset_id)
        state["dataset_details"] = ds.model_dump() if hasattr(ds, "model_dump") else dict(ds)
        save_state(state)
    except Exception as e:
        print(f"[Notice fetching dataset details]: {e}")

    print("\n=======================================================")
    print("  STEP 4 COMPLETE")
    print(f"  • Dataset ID:        {dataset_id}")
    print(f"  • Run ID:            {run_id}")
    print(f"  • Credits Charged:   {credits}")
    print(f"  • Output file:       {ADAPTED_DATASET_FILE}")
    print("=======================================================\n")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        ds_id = sys.argv[2] if len(sys.argv) > 2 else "2fb3dd5b-5bc8-41d0-8f77-c5f3f472058d"
        step4_run_and_download(ds_id)
    elif len(sys.argv) > 1 and sys.argv[1] == "upload":
        step2_upload()
    else:
        print("Usage: python data/adaption/adaption_workflow.py [upload|run] [dataset_id]")
