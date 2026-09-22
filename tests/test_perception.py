import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from services.scene_manager import SceneManager
from services.perception_engine import PerceptionEngine


def test_scene_generation():
    scene = SceneManager.get_scene("telepresence_host_01")
    assert scene is not None
    assert scene["primitive_count"] > 10000
    assert len(scene["positions"]) == scene["primitive_count"]
    assert len(scene["colors"]) == scene["primitive_count"]
    assert len(scene["semantics"]) == scene["primitive_count"]
    assert len(scene["motion_vectors"]) == scene["primitive_count"]
    assert len(scene["saliencies"]) == scene["primitive_count"]


def test_importance_weights_normalization():
    scene = SceneManager.get_scene("telepresence_host_01")
    # Unequal unnormalized weights
    res = PerceptionEngine.calculate_importance(
        scene,
        semantic_weight=3.0,
        human_weight=3.0,
        motion_weight=2.0,
        saliency_weight=2.0
    )
    assert res is not None
    w = res["weights"]
    # Check normalized weights sum to 1.0
    total_w = sum(w.values())
    assert pytest.approx(total_w, rel=1e-4) == 1.0
    assert pytest.approx(w["semantic"], rel=1e-3) == 0.30
    assert pytest.approx(w["human"], rel=1e-3) == 0.30


def test_importance_bounds():
    scene = SceneManager.get_scene("telepresence_host_01")
    res = PerceptionEngine.calculate_importance(scene)
    imp = np.array(res["importance_map"])
    # All importance values must be strictly bounded in [0.0, 1.0]
    assert np.all(imp >= 0.0)
    assert np.all(imp <= 1.0)
    # Facial regions should have strictly higher average importance than background
    reg_stats = {r["name"]: r["mean_importance"] for r in res["region_statistics"]}
    assert reg_stats["eyes_mouth"] > reg_stats["background"]
    assert reg_stats["face"] > reg_stats["background"]
