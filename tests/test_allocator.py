import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from services.scene_manager import SceneManager
from services.resource_allocator import ResourceAllocator


@pytest.mark.parametrize("method", [
    "uniform_baseline",
    "distance_lod",
    "motion_aware",
    "human_centric",
    "proposed_perception_aware"
])
def test_resource_budget_conservation(method):
    scene = SceneManager.get_scene("telepresence_host_01")
    budget = 0.50  # 50% budget
    alloc = ResourceAllocator.allocate(scene, method=method, rendering_budget=budget)
    
    # Active primitives should strictly respect target budget with tiny rounding tolerance
    target = int(budget * scene["primitive_count"])
    assert abs(alloc["active_primitives"] - target) <= 5
    assert alloc["pruned_primitives"] == scene["primitive_count"] - alloc["active_primitives"]
    assert alloc["overall_reduction_pct"] > 45.0


def test_human_centric_retention_superiority():
    """
    Test core hypothesis: under constrained budget, proposed perception-aware method
    retains a significantly higher fraction of face/eyes primitives than uniform baseline.
    """
    scene = SceneManager.get_scene("telepresence_host_01")
    budget = 0.35  # 35% constrained budget
    
    uniform_alloc = ResourceAllocator.allocate(scene, method="uniform_baseline", rendering_budget=budget)
    proposed_alloc = ResourceAllocator.allocate(scene, method="proposed_perception_aware", rendering_budget=budget)
    
    # Extract retention ratios for face and eyes
    u_face = next(r for r in uniform_alloc["region_breakdowns"] if r["region"] == "face")
    p_face = next(r for r in proposed_alloc["region_breakdowns"] if r["region"] == "face")
    
    # Perception-aware must allocate higher retention to face than uniform
    assert p_face["retention_ratio"] > u_face["retention_ratio"]
    assert p_face["retention_ratio"] >= 0.85  # Preserved at high LOD
