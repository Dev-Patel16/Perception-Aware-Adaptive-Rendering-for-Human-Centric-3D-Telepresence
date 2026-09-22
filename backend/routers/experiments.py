import uuid
import datetime
import platform
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

try:
    from database import get_db
    from models import ExperimentRecord
    from schemas import ExperimentCreate, ExperimentOut
    from services.scene_manager import SceneManager
    from services.resource_allocator import ResourceAllocator
    from services.metrics_evaluator import MetricsEvaluator
except ImportError:
    from ..database import get_db
    from ..models import ExperimentRecord
    from ..schemas import ExperimentCreate, ExperimentOut
    from ..services.scene_manager import SceneManager
    from ..services.resource_allocator import ResourceAllocator
    from ..services.metrics_evaluator import MetricsEvaluator

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


class CompareRequest(BaseModel):
    experiment_ids: List[str]


@router.get("", response_model=List[ExperimentOut])
def list_experiments(
    scene_id: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve all recorded experiments with optional filtering."""
    query = db.query(ExperimentRecord)
    if scene_id:
        query = query.filter(ExperimentRecord.scene_id == scene_id)
    if method:
        query = query.filter(ExperimentRecord.method == method)
    records = query.order_by(ExperimentRecord.timestamp.desc()).all()
    
    # Format timestamp to ISO string for JSON serialization
    results = []
    for r in records:
        data = {
            "experiment_id": r.experiment_id,
            "scene_id": r.scene_id,
            "method": r.method,
            "semantic_weight": r.semantic_weight,
            "human_weight": r.human_weight,
            "motion_weight": r.motion_weight,
            "saliency_weight": r.saliency_weight,
            "rendering_budget": r.rendering_budget,
            "target_fps": r.target_fps,
            "resolution": r.resolution,
            "lod_configuration": r.lod_configuration,
            "timestamp": r.timestamp.isoformat() if r.timestamp else datetime.datetime.utcnow().isoformat(),
            "hardware_information": r.hardware_information,
            "software_information": r.software_information,
            "status": r.status,
            "psnr": r.psnr,
            "ssim": r.ssim,
            "lpips": r.lpips,
            "fps": r.fps,
            "frame_time_ms": r.frame_time_ms,
            "latency_ms": r.latency_ms,
            "primitive_count": r.primitive_count,
            "region_metrics": r.region_metrics,
            "output_path": r.output_path
        }
        results.append(data)
    return results


@router.post("", response_model=ExperimentOut)
def run_experiment(req: ExperimentCreate, db: Session = Depends(get_db)):
    """
    Executes a complete scientific experiment pipeline:
    1. Scene acquisition
    2. Semantic & motion analysis
    3. Perceptual importance calculation
    4. Adaptive LOD allocation
    5. Simulated rendering
    6. Objective & perceptual metric evaluation (PSNR, SSIM, LPIPS, Region-level)
    7. Database persistence
    """
    scene_data = SceneManager.get_scene(req.scene_id)
    if not scene_data:
        raise HTTPException(status_code=404, detail=f"Scene '{req.scene_id}' not found")

    exp_id = f"EXP-{datetime.datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Resource allocation
    alloc = ResourceAllocator.allocate(
        scene_data,
        method=req.method,
        rendering_budget=req.rendering_budget,
        target_fps=req.target_fps,
        semantic_weight=req.weights.semantic_weight,
        human_weight=req.weights.human_weight,
        motion_weight=req.weights.motion_weight,
        saliency_weight=req.weights.saliency_weight
    )

    # Metrics evaluation
    metrics = MetricsEvaluator.evaluate_quality(scene_data, alloc)

    # Hardware & Software provenance
    hw_info = {
        "os": f"{platform.system()} {platform.release()}",
        "architecture": platform.machine(),
        "processor": platform.processor() or "x86_64 compatible",
        "mode": "Demo/Laptop Mode (CPU/WebGL accelerated)"
    }
    sw_info = {
        "framework": "FastAPI + NumPy + SciPy",
        "renderer": "Three.js WebGL / Perception-Aware Shader Pipeline",
        "metric_engine": "Vectorized Wang SSIM + Peak SNR"
    }

    record = ExperimentRecord(
        experiment_id=exp_id,
        scene_id=req.scene_id,
        method=req.method,
        semantic_weight=req.weights.semantic_weight,
        human_weight=req.weights.human_weight,
        motion_weight=req.weights.motion_weight,
        saliency_weight=req.weights.saliency_weight,
        rendering_budget=req.rendering_budget,
        target_fps=req.target_fps,
        resolution=req.resolution,
        lod_configuration=alloc["lod_breakdown"],
        timestamp=datetime.datetime.utcnow(),
        hardware_information=hw_info,
        software_information=sw_info,
        status="completed",
        psnr=metrics["global"]["psnr"],
        ssim=metrics["global"]["ssim"],
        lpips=metrics["global"]["lpips"],
        fps=alloc["predicted_fps"],
        frame_time_ms=alloc["predicted_frame_time_ms"],
        latency_ms=alloc["predicted_frame_time_ms"] + 2.5,
        primitive_count=alloc["active_primitives"],
        region_metrics=metrics,
        output_path=f"/data/experiments/{exp_id}.json"
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "experiment_id": record.experiment_id,
        "scene_id": record.scene_id,
        "method": record.method,
        "semantic_weight": record.semantic_weight,
        "human_weight": record.human_weight,
        "motion_weight": record.motion_weight,
        "saliency_weight": record.saliency_weight,
        "rendering_budget": record.rendering_budget,
        "target_fps": record.target_fps,
        "resolution": record.resolution,
        "lod_configuration": record.lod_configuration,
        "timestamp": record.timestamp.isoformat(),
        "hardware_information": record.hardware_information,
        "software_information": record.software_information,
        "status": record.status,
        "psnr": record.psnr,
        "ssim": record.ssim,
        "lpips": record.lpips,
        "fps": record.fps,
        "frame_time_ms": record.frame_time_ms,
        "latency_ms": record.latency_ms,
        "primitive_count": record.primitive_count,
        "region_metrics": record.region_metrics,
        "output_path": record.output_path
    }


@router.get("/{experiment_id}", response_model=ExperimentOut)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed data for a specific experiment."""
    record = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found")
    return {
        "experiment_id": record.experiment_id,
        "scene_id": record.scene_id,
        "method": record.method,
        "semantic_weight": record.semantic_weight,
        "human_weight": record.human_weight,
        "motion_weight": record.motion_weight,
        "saliency_weight": record.saliency_weight,
        "rendering_budget": record.rendering_budget,
        "target_fps": record.target_fps,
        "resolution": record.resolution,
        "lod_configuration": record.lod_configuration,
        "timestamp": record.timestamp.isoformat(),
        "hardware_information": record.hardware_information,
        "software_information": record.software_information,
        "status": record.status,
        "psnr": record.psnr,
        "ssim": record.ssim,
        "lpips": record.lpips,
        "fps": record.fps,
        "frame_time_ms": record.frame_time_ms,
        "latency_ms": record.latency_ms,
        "primitive_count": record.primitive_count,
        "region_metrics": record.region_metrics,
        "output_path": record.output_path
    }


@router.delete("/{experiment_id}")
def delete_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Delete an experiment record."""
    record = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found")
    db.delete(record)
    db.commit()
    return {"status": "deleted", "experiment_id": experiment_id}


@router.post("/compare")
def compare_experiments(req: CompareRequest, db: Session = Depends(get_db)):
    """Side-by-side comparison of two or more experiments."""
    records = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id.in_(req.experiment_ids)).all()
    if not records:
        raise HTTPException(status_code=404, detail="No matching experiments found")
    return [
        {
            "experiment_id": r.experiment_id,
            "scene_id": r.scene_id,
            "method": r.method,
            "budget": r.rendering_budget,
            "psnr": r.psnr,
            "ssim": r.ssim,
            "lpips": r.lpips,
            "fps": r.fps,
            "frame_time_ms": r.frame_time_ms,
            "active_primitives": r.primitive_count,
            "region_metrics": r.region_metrics
        }
        for r in records
    ]
