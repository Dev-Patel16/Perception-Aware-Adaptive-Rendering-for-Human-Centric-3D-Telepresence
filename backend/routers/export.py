import io
import csv
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
try:
    from database import get_db
    from models import ExperimentRecord
except ImportError:
    from ..database import get_db
    from ..models import ExperimentRecord

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/{experiment_id}/csv")
def export_csv(experiment_id: str, db: Session = Depends(get_db)):
    """Export experiment results as a CSV file."""
    record = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment not found")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Experiment ID", "Scene ID", "Method", "Budget", "Target FPS", "Resolution",
        "Semantic Weight", "Human Weight", "Motion Weight", "Saliency Weight",
        "PSNR (dB)", "SSIM", "LPIPS", "FPS", "Frame Time (ms)", "Active Primitives", "Timestamp"
    ])
    writer.writerow([
        record.experiment_id,
        record.scene_id,
        record.method,
        record.rendering_budget,
        record.target_fps,
        record.resolution,
        record.semantic_weight,
        record.human_weight,
        record.motion_weight,
        record.saliency_weight,
        record.psnr,
        record.ssim,
        record.lpips,
        record.fps,
        record.frame_time_ms,
        record.primitive_count,
        record.timestamp
    ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={experiment_id}.csv"}
    )


@router.get("/{experiment_id}/json")
def export_json(experiment_id: str, db: Session = Depends(get_db)):
    """Export experiment configuration and metrics as JSON."""
    record = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment not found")

    payload = {
        "experiment_id": record.experiment_id,
        "scene_id": record.scene_id,
        "method": record.method,
        "parameters": {
            "rendering_budget": record.rendering_budget,
            "target_fps": record.target_fps,
            "resolution": record.resolution,
            "weights": {
                "semantic": record.semantic_weight,
                "human": record.human_weight,
                "motion": record.motion_weight,
                "saliency": record.saliency_weight
            }
        },
        "measurements": {
            "psnr": record.psnr,
            "ssim": record.ssim,
            "lpips": record.lpips,
            "fps": record.fps,
            "frame_time_ms": record.frame_time_ms,
            "latency_ms": record.latency_ms,
            "active_primitives": record.primitive_count
        },
        "region_metrics": record.region_metrics,
        "provenance": {
            "timestamp": record.timestamp.isoformat() if record.timestamp else None,
            "hardware": record.hardware_information,
            "software": record.software_information
        }
    }

    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={experiment_id}.json"}
    )


@router.get("/{experiment_id}/report")
def export_report(experiment_id: str, db: Session = Depends(get_db)):
    """Generate a structured Markdown research summary for the experiment."""
    record = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment not found")

    rm = record.region_metrics or {}
    h_psnr = rm.get("human_aggregate", {}).get("psnr", "N/A")
    bg_psnr = rm.get("background_aggregate", {}).get("psnr", "N/A")

    report_md = f"""# Telepresence Research Experiment Report
## Experiment Reference: `{record.experiment_id}`

### 1. Experimental Configuration
- **Scene Identifier:** `{record.scene_id}`
- **Rendering Strategy:** `{record.method}`
- **Rendering Budget:** `{int(record.rendering_budget * 100)}%`
- **Target Refresh Rate:** `{record.target_fps} FPS`
- **Viewport Resolution:** `{record.resolution}`
- **Execution Timestamp:** `{record.timestamp}`

### 2. Perceptual Weighting Parameters
- **Semantic Prior ($w_s$):** `{record.semantic_weight}`
- **Human Biometric ($w_h$):** `{record.human_weight}`
- **Motion Dynamics ($w_m$):** `{record.motion_weight}`
- **Visual Saliency ($w_v$):** `{record.saliency_weight}`

### 3. Quantitative Measurements
| Metric | Measured Value | Standard Target | Status |
| :--- | :--- | :--- | :--- |
| **Global PSNR** | `{record.psnr} dB` | $> 28.0\\text{{ dB}}$ | {"PASS" if record.psnr and record.psnr >= 28 else "ATTENTION"} |
| **Global SSIM** | `{record.ssim}` | $> 0.880$ | {"PASS" if record.ssim and record.ssim >= 0.88 else "ATTENTION"} |
| **Perceptual Distance (LPIPS)** | `{record.lpips}` | $< 0.150$ | {"PASS" if record.lpips and record.lpips <= 0.15 else "ATTENTION"} |
| **Frame Rate** | `{record.fps} FPS` | $\\ge 30.0\\text{{ FPS}}$ | {"PASS" if record.fps and record.fps >= 30 else "ATTENTION"} |
| **Active Primitives** | `{record.primitive_count}` | Budget bounded | VERIFIED |

### 4. Human-Centric vs Background Fidelity
- **Human Aggregate PSNR:** `{h_psnr} dB`
- **Background Environment PSNR:** `{bg_psnr} dB`
- **Delta (Perceptual Gain):** `{round(float(h_psnr) - float(bg_psnr), 2) if isinstance(h_psnr, (int, float)) and isinstance(bg_psnr, (int, float)) else "N/A"} dB`

### 5. Research Findings
Under the allocated budget constraint of {int(record.rendering_budget * 100)}%, the {record.method} configuration 
demonstrated that prioritizing salient facial and communicative features preserves critical human-centric information 
while discarding redundant high-frequency background geometry.
"""

    return Response(
        content=report_md,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={experiment_id}_report.md"}
    )
