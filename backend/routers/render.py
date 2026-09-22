from fastapi import APIRouter, HTTPException
from typing import Dict, Any
try:
    from services.scene_manager import SceneManager
    from services.resource_allocator import ResourceAllocator
    from services.metrics_evaluator import MetricsEvaluator
    from schemas import RenderAllocationRequest, RenderAllocationResponse
except ImportError:
    from ..services.scene_manager import SceneManager
    from ..services.resource_allocator import ResourceAllocator
    from ..services.metrics_evaluator import MetricsEvaluator
    from ..schemas import RenderAllocationRequest, RenderAllocationResponse

router = APIRouter(prefix="/api/render", tags=["render"])


@router.post("/allocate")
def allocate_resources(req: RenderAllocationRequest):
    """
    Computes primitive allocations, dynamic LOD levels, and predicted performance
    under a constrained rendering budget (10% - 100%) for the chosen rendering method.
    """
    scene_data = SceneManager.get_scene(req.scene_id)
    if not scene_data:
        raise HTTPException(status_code=404, detail=f"Scene '{req.scene_id}' not found")

    alloc_result = ResourceAllocator.allocate(
        scene_data,
        method=req.method,
        rendering_budget=req.rendering_budget,
        target_fps=req.target_fps,
        semantic_weight=req.weights.semantic_weight,
        human_weight=req.weights.human_weight,
        motion_weight=req.weights.motion_weight,
        saliency_weight=req.weights.saliency_weight
    )
    return alloc_result


@router.post("/simulate")
def simulate_rendering(req: RenderAllocationRequest):
    """
    Runs full comparative rendering simulation, calculating PSNR, SSIM, LPIPS,
    and regional quality breakdowns between baseline and proposed allocations.
    """
    scene_data = SceneManager.get_scene(req.scene_id)
    if not scene_data:
        raise HTTPException(status_code=404, detail=f"Scene '{req.scene_id}' not found")

    # Allocate according to requested method
    alloc_result = ResourceAllocator.allocate(
        scene_data,
        method=req.method,
        rendering_budget=req.rendering_budget,
        target_fps=req.target_fps,
        semantic_weight=req.weights.semantic_weight,
        human_weight=req.weights.human_weight,
        motion_weight=req.weights.motion_weight,
        saliency_weight=req.weights.saliency_weight
    )

    # Compute genuine quality metrics
    metrics = MetricsEvaluator.evaluate_quality(scene_data, alloc_result)

    # Also compute baseline comparison if method is proposed
    baseline_metrics = None
    if req.method != "uniform_baseline":
        baseline_alloc = ResourceAllocator.allocate(
            scene_data,
            method="uniform_baseline",
            rendering_budget=req.rendering_budget,
            target_fps=req.target_fps
        )
        baseline_metrics = MetricsEvaluator.evaluate_quality(scene_data, baseline_alloc)

    return {
        "allocation": alloc_result,
        "metrics": metrics,
        "baseline_comparison": baseline_metrics
    }
