import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from services.scene_manager import SceneManager
from services.resource_allocator import ResourceAllocator
from services.metrics_evaluator import MetricsEvaluator


def test_metrics_evaluator_ranges():
    scene = SceneManager.get_scene("telepresence_host_01")
    alloc = ResourceAllocator.allocate(scene, method="proposed_perception_aware", rendering_budget=0.5)
    metrics = MetricsEvaluator.evaluate_quality(scene, alloc)
    
    # PSNR must be positive and in realistic dB range (15 to 50 dB)
    assert 15.0 <= metrics["global"]["psnr"] <= 50.0
    # SSIM must be in [0, 1]
    assert 0.0 <= metrics["global"]["ssim"] <= 1.0
    # LPIPS must be positive
    assert 0.0 <= metrics["global"]["lpips"] <= 1.0
    
    # Region metrics exist
    assert "face" in metrics["regions"]
    assert "background" in metrics["regions"]
    assert metrics["regions"]["face"]["psnr"] > 0


def test_hypothesis_face_quality_gain():
    """
    Hypothesis test: At 35% budget, proposed method preserves higher face PSNR than uniform.
    """
    scene = SceneManager.get_scene("telepresence_host_01")
    budget = 0.35
    
    u_alloc = ResourceAllocator.allocate(scene, method="uniform_baseline", rendering_budget=budget)
    p_alloc = ResourceAllocator.allocate(scene, method="proposed_perception_aware", rendering_budget=budget)
    
    u_metrics = MetricsEvaluator.evaluate_quality(scene, u_alloc)
    p_metrics = MetricsEvaluator.evaluate_quality(scene, p_alloc)
    
    # Proposed face PSNR should be distinctly higher than uniform face PSNR
    assert p_metrics["regions"]["face"]["psnr"] > u_metrics["regions"]["face"]["psnr"]
