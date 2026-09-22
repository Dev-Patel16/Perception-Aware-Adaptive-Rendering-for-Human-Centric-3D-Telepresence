#!/usr/bin/env python3
"""
Reproduce Benchmarks & Ablation Studies CLI
Perception-Aware Adaptive Rendering for Human-Centric 3D Telepresence

Usage:
    python reproduce_benchmarks.py [--scenes SCENES] [--output-dir DIR]
"""

import os
import sys
import json
import csv
import argparse
import datetime

# Add backend directory to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.scene_manager import SceneManager
from services.resource_allocator import ResourceAllocator
from services.metrics_evaluator import MetricsEvaluator
from database import SessionLocal, init_db
from models import ExperimentRecord

BUDGET_SWEEP = [0.15, 0.30, 0.50, 0.70, 0.85, 1.00]
METHODS = [
    "uniform_baseline",
    "distance_lod",
    "motion_aware",
    "human_centric",
    "proposed_perception_aware"
]


def run_benchmark_reproduction(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    init_db()
    db = SessionLocal()

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    csv_file = os.path.join(output_dir, f"benchmark_results_{timestamp}.csv")
    json_file = os.path.join(output_dir, f"benchmark_results_{timestamp}.json")

    scenes = SceneManager.list_available_scenes()
    all_results = []

    print("================================================================================")
    print("REPRODUCING BENCHMARK RESULTS: PERCEPTION-AWARE ADAPTIVE RENDERING")
    print(f"Timestamp: {timestamp}")
    print(f"Scenes: {[s['id'] for s in scenes]}")
    print(f"Budgets: {[int(b*100) for b in BUDGET_SWEEP]}%")
    print(f"Methods: {METHODS}")
    print("================================================================================\n")

    with open(csv_file, "w", newline="", encoding="utf-8") as f_csv:
        writer = csv.writer(f_csv)
        writer.writerow([
            "SceneID", "Method", "Budget", "ActivePrimitives", "TotalPrimitives",
            "PSNR_Global_dB", "SSIM_Global", "LPIPS_Global", "FPS", "Latency_ms",
            "Human_PSNR_dB", "Background_PSNR_dB", "Face_PSNR_dB"
        ])

        for scene_meta in scenes:
            scene_id = scene_meta["id"]
            print(f"--> Processing Scene: {scene_meta['name']} ({scene_id})...")
            scene_data = SceneManager.get_scene(scene_id)

            for method in METHODS:
                print(f"    Evaluating Strategy: {method.ljust(26)} | Budgets: ", end="", flush=True)
                for budget in BUDGET_SWEEP:
                    # 1. Allocate resources
                    alloc = ResourceAllocator.allocate(
                        scene_data,
                        method=method,
                        rendering_budget=budget,
                        target_fps=60
                    )

                    # 2. Evaluate metrics
                    metrics = MetricsEvaluator.evaluate_quality(scene_data, alloc)

                    face_psnr = metrics["regions"].get("face", {}).get("psnr", metrics["human_aggregate"]["psnr"])

                    record_dict = {
                        "scene_id": scene_id,
                        "method": method,
                        "budget": budget,
                        "active_primitives": alloc["active_primitives"],
                        "total_primitives": alloc["total_primitives"],
                        "psnr": metrics["global"]["psnr"],
                        "ssim": metrics["global"]["ssim"],
                        "lpips": metrics["global"]["lpips"],
                        "fps": alloc["predicted_fps"],
                        "latency_ms": round(alloc["predicted_frame_time_ms"] + 2.0, 2),
                        "human_psnr": metrics["human_aggregate"]["psnr"],
                        "background_psnr": metrics["background_aggregate"]["psnr"],
                        "face_psnr": face_psnr
                    }
                    all_results.append(record_dict)

                    writer.writerow([
                        scene_id,
                        method,
                        budget,
                        alloc["active_primitives"],
                        alloc["total_primitives"],
                        metrics["global"]["psnr"],
                        metrics["global"]["ssim"],
                        metrics["global"]["lpips"],
                        alloc["predicted_fps"],
                        round(alloc["predicted_frame_time_ms"] + 2.0, 2),
                        metrics["human_aggregate"]["psnr"],
                        metrics["background_aggregate"]["psnr"],
                        face_psnr
                    ])
                    print(f"{int(budget*100)}% ", end="", flush=True)
                print("[OK]")

    with open(json_file, "w", encoding="utf-8") as f_json:
        json.dump(all_results, f_json, indent=2)

    db.close()
    print("\n================================================================================")
    print("BENCHMARK REPRODUCTION COMPLETE")
    print(f"Exported CSV: {csv_file}")
    print(f"Exported JSON: {json_file}")
    print("================================================================================")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reproduce Telepresence Benchmarks")
    parser.add_argument("--output-dir", default=os.path.join(PROJECT_ROOT, "experiments"), help="Destination directory for outputs")
    args = parser.parse_args()

    run_benchmark_reproduction(args.output_dir)
