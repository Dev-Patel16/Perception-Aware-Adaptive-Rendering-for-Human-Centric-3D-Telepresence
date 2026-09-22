from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class PerceptionWeights(BaseModel):
    semantic_weight: float = Field(0.35, ge=0.0, le=1.0)
    human_weight: float = Field(0.35, ge=0.0, le=1.0)
    motion_weight: float = Field(0.15, ge=0.0, le=1.0)
    saliency_weight: float = Field(0.15, ge=0.0, le=1.0)


class RegionMetricDetail(BaseModel):
    region_name: str
    importance: float
    priority: str
    lod_level: int
    active_primitives: int
    total_primitives: int
    retention_ratio: float
    psnr: float
    ssim: float
    estimated_cost: float


class RenderAllocationRequest(BaseModel):
    scene_id: str
    method: str = "proposed_perception_aware"
    rendering_budget: float = Field(0.5, ge=0.1, le=1.0)
    target_fps: int = Field(60, ge=15, le=120)
    weights: PerceptionWeights = Field(default_factory=PerceptionWeights)


class RegionAllocationDetail(BaseModel):
    region: str
    lod: int
    total_primitives: int
    active_primitives: int
    importance_score: float
    priority_level: str
    quality_estimate: float
    cost_estimate: float


class RenderAllocationResponse(BaseModel):
    scene_id: str
    method: str
    rendering_budget: float
    total_primitives: int
    active_primitives: int
    pruned_primitives: int
    overall_reduction_pct: float
    lod_breakdown: Dict[str, int]
    region_breakdowns: List[RegionAllocationDetail]
    predicted_fps: float
    predicted_frame_time_ms: float


class ExperimentCreate(BaseModel):
    scene_id: str
    method: str = "proposed_perception_aware"
    rendering_budget: float = Field(0.5, ge=0.1, le=1.0)
    target_fps: int = Field(60, ge=24, le=60)
    resolution: str = "1920x1080"
    weights: PerceptionWeights = Field(default_factory=PerceptionWeights)


class ExperimentOut(BaseModel):
    experiment_id: str
    scene_id: str
    method: str
    semantic_weight: float
    human_weight: float
    motion_weight: float
    saliency_weight: float
    rendering_budget: float
    target_fps: int
    resolution: str
    lod_configuration: Optional[Dict[str, Any]] = None
    timestamp: str
    hardware_information: Optional[Dict[str, Any]] = None
    software_information: Optional[Dict[str, Any]] = None
    status: str
    psnr: Optional[float] = None
    ssim: Optional[float] = None
    lpips: Optional[float] = None
    fps: Optional[float] = None
    frame_time_ms: Optional[float] = None
    latency_ms: Optional[float] = None
    primitive_count: Optional[int] = None
    region_metrics: Optional[Dict[str, Any]] = None
    output_path: Optional[str] = None

    class Config:
        from_attributes = True


class SceneOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    primitive_count: int
    source_type: str
    bounding_box: Optional[Dict[str, Any]] = None
    semantic_classes: Optional[List[str]] = None
    created_at: Optional[str] = "2026-09-22T00:00:00"

    class Config:
        from_attributes = True


class AblationConfigResult(BaseModel):
    config_code: str
    name: str
    weights: Dict[str, float]
    rendering_budget: float
    psnr: float
    ssim: float
    lpips: float
    fps: float
    face_psnr: float
    background_psnr: float
    active_primitives: int


class BenchmarkPoint(BaseModel):
    budget: float
    active_primitives: int
    psnr: float
    ssim: float
    lpips: float
    fps: float
    frame_time_ms: float
    face_psnr: float
    background_psnr: float
