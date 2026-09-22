from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
try:
    from services.scene_manager import SceneManager
    from services.perception_engine import PerceptionEngine
except ImportError:
    from ..services.scene_manager import SceneManager
    from ..services.perception_engine import PerceptionEngine

router = APIRouter(prefix="/api/perception", tags=["perception"])


class PerceptionAnalysisRequest(BaseModel):
    scene_id: str
    semantic_weight: float = Field(0.35, ge=0.0, le=1.0)
    human_weight: float = Field(0.35, ge=0.0, le=1.0)
    motion_weight: float = Field(0.15, ge=0.0, le=1.0)
    saliency_weight: float = Field(0.15, ge=0.0, le=1.0)


@router.post("/analyze")
def analyze_scene_perception(req: PerceptionAnalysisRequest):
    """
    Computes per-primitive importance and region breakdowns according to:
    P_i = (w_s * Semantic_i + w_h * Human_i + w_m * Motion_i + w_v * Saliency_i) / sum(w)
    """
    scene_data = SceneManager.get_scene(req.scene_id)
    if not scene_data:
        raise HTTPException(status_code=404, detail=f"Scene '{req.scene_id}' not found")

    result = PerceptionEngine.calculate_importance(
        scene_data,
        semantic_weight=req.semantic_weight,
        human_weight=req.human_weight,
        motion_weight=req.motion_weight,
        saliency_weight=req.saliency_weight
    )
    return result
