from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
try:
    from services.scene_manager import SceneManager
    from schemas import SceneOut
except ImportError:
    from ..services.scene_manager import SceneManager
    from ..schemas import SceneOut

router = APIRouter(prefix="/api/scenes", tags=["scenes"])


@router.get("", response_model=List[SceneOut])
def get_scenes():
    """Retrieve all available 3D telepresence scenes."""
    return SceneManager.list_available_scenes()


@router.get("/{scene_id}", response_model=SceneOut)
def get_scene_details(scene_id: str):
    """Retrieve metadata for a specific telepresence scene."""
    scenes = SceneManager.list_available_scenes()
    scene = next((s for s in scenes if s["id"] == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Scene '{scene_id}' not found")
    return scene


@router.get("/{scene_id}/primitives")
def get_scene_primitives(
    scene_id: str,
    max_count: Optional[int] = Query(None, description="Max primitives to return for lightweight preview")
):
    """
    Retrieve authentic 3D telepresence primitives (positions, colors, semantic labels,
    motion vectors, visual saliencies, covariance radii) for WebGL rendering.
    """
    scene_data = SceneManager.get_scene(scene_id)
    if not scene_data:
        raise HTTPException(status_code=404, detail=f"Scene '{scene_id}' not found")

    total = scene_data["primitive_count"]
    if max_count and max_count < total:
        step = max(1, total // max_count)
        return {
            "scene_id": scene_data["scene_id"],
            "primitive_count": len(scene_data["positions"][::step]),
            "positions": scene_data["positions"][::step],
            "colors": scene_data["colors"][::step],
            "semantics": scene_data["semantics"][::step],
            "motion_vectors": scene_data["motion_vectors"][::step],
            "saliencies": scene_data["saliencies"][::step],
            "radii": scene_data["radii"][::step],
            "semantic_meta": scene_data["semantic_meta"]
        }

    return scene_data
