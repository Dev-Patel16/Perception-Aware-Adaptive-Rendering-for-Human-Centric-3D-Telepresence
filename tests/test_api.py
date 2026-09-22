import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_get_scenes():
    res = client.get("/api/scenes")
    assert res.status_code == 200
    scenes = res.json()
    assert len(scenes) >= 3
    assert scenes[0]["id"] == "telepresence_host_01"


def test_analyze_perception():
    res = client.post("/api/perception/analyze", json={
        "scene_id": "telepresence_host_01",
        "semantic_weight": 0.35,
        "human_weight": 0.35,
        "motion_weight": 0.15,
        "saliency_weight": 0.15
    })
    assert res.status_code == 200
    data = res.json()
    assert "importance_map" in data
    assert "region_statistics" in data


def test_render_allocate():
    res = client.post("/api/render/allocate", json={
        "scene_id": "telepresence_host_01",
        "method": "proposed_perception_aware",
        "rendering_budget": 0.50,
        "target_fps": 60,
        "weights": {
            "semantic_weight": 0.35,
            "human_weight": 0.35,
            "motion_weight": 0.15,
            "saliency_weight": 0.15
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["rendering_budget"] == 0.50
    assert data["active_primitives"] > 0


def test_experiments_crud():
    # 1. Run new experiment
    res = client.post("/api/experiments", json={
        "scene_id": "telepresence_host_01",
        "method": "proposed_perception_aware",
        "rendering_budget": 0.60,
        "target_fps": 60,
        "resolution": "1920x1080",
        "weights": {
            "semantic_weight": 0.4,
            "human_weight": 0.4,
            "motion_weight": 0.1,
            "saliency_weight": 0.1
        }
    })
    assert res.status_code == 200
    exp = res.json()
    exp_id = exp["experiment_id"]
    assert exp["psnr"] > 0
    assert exp["status"] == "completed"

    # 2. Get experiment
    res_get = client.get(f"/api/experiments/{exp_id}")
    assert res_get.status_code == 200
    assert res_get.json()["experiment_id"] == exp_id

    # 3. Export CSV
    res_csv = client.get(f"/api/export/{exp_id}/csv")
    assert res_csv.status_code == 200
    assert "Experiment ID" in res_csv.text

    # 4. Export Report
    res_rep = client.get(f"/api/export/{exp_id}/report")
    assert res_rep.status_code == 200
    assert "Telepresence Research Experiment Report" in res_rep.text


def test_benchmark_endpoint():
    res = client.get("/api/benchmark?scene_id=telepresence_host_01")
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert "uniform_baseline" in data["results"]
    assert "proposed_perception_aware" in data["results"]


def test_ablation_endpoint():
    res = client.get("/api/ablation?scene_id=telepresence_host_01&budget=0.5")
    assert res.status_code == 200
    data = res.json()
    assert len(data["ablation_results"]) == 7
    # Verify codes A through G
    codes = [r["config_code"] for r in data["ablation_results"]]
    assert codes == ["A", "B", "C", "D", "E", "F", "G"]
