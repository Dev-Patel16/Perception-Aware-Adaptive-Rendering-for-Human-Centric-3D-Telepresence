import numpy as np
from typing import Dict, List, Any, Tuple
try:
    from services.scene_manager import SEMANTIC_CLASSES
    from services.perception_engine import PerceptionEngine
except ImportError:
    from .scene_manager import SEMANTIC_CLASSES
    from .perception_engine import PerceptionEngine

LOD_RATIOS = {
    0: 1.00,  # LOD 0: Maximum detail
    1: 0.75,  # LOD 1: High detail
    2: 0.50,  # LOD 2: Medium detail
    3: 0.25,  # LOD 3: Low detail
    4: 0.10   # LOD 4: Minimal detail
}


class ResourceAllocator:
    """
    Allocates rendering resources across 3D telepresence primitives and regions
    under a constrained rendering budget (10% to 100%).
    Supports 6 distinct rendering modes:
    1. Uniform Baseline
    2. Distance-Based LOD
    3. Motion-Aware
    4. Human-Centric
    5. Proposed Perception-Aware
    6. Custom
    """

    @classmethod
    def allocate(
        cls,
        scene_data: Dict[str, Any],
        method: str = "proposed_perception_aware",
        rendering_budget: float = 0.5,
        target_fps: int = 60,
        semantic_weight: float = 0.35,
        human_weight: float = 0.35,
        motion_weight: float = 0.15,
        saliency_weight: float = 0.15
    ) -> Dict[str, Any]:
        n_total = scene_data["primitive_count"]
        target_primitives = int(np.clip(rendering_budget, 0.10, 1.00) * n_total)
        semantics = np.array(scene_data["semantics"], dtype=np.int32)
        positions = np.array(scene_data["positions"], dtype=np.float32)
        motion_vecs = np.array(scene_data["motion_vectors"], dtype=np.float32)
        saliencies = np.array(scene_data["saliencies"], dtype=np.float32)

        # 1. Compute method-specific priority score for every primitive
        if method == "uniform_baseline":
            # Equal priority across all primitives
            scores = np.ones(n_total, dtype=np.float32)
            method_desc = "Uniform Baseline (all regions sampled equally)"

        elif method == "distance_lod":
            # Priority inversely proportional to distance from telepresence camera (0, 0, 0)
            distances = np.linalg.norm(positions, axis=1)
            d_min, d_max = np.min(distances), np.max(distances)
            scores = 1.0 - (distances - d_min) / (d_max - d_min + 1e-6)
            method_desc = "Distance-Based LOD (priority determined by radial camera distance)"

        elif method == "motion_aware":
            # Priority proportional to velocity magnitude
            velocities = np.linalg.norm(motion_vecs, axis=1)
            v_max = np.max(velocities)
            scores = (velocities / (v_max + 1e-6)) * 0.8 + 0.2
            method_desc = "Motion-Aware (prioritizes articulate dynamic regions)"

        elif method == "human_centric":
            # Prioritizes human body, hands, face, eyes
            scores = np.zeros(n_total, dtype=np.float32)
            for cid, cinfo in SEMANTIC_CLASSES.items():
                mask = (semantics == cid)
                scores[mask] = 1.0 if cinfo["is_human"] else 0.15
            method_desc = "Human-Centric (prioritizes human silhouette and face over background)"

        elif method in ["proposed_perception_aware", "custom"]:
            # Uses complete fused perceptual importance
            res = PerceptionEngine.calculate_importance(
                scene_data,
                semantic_weight=semantic_weight,
                human_weight=human_weight,
                motion_weight=motion_weight,
                saliency_weight=saliency_weight
            )
            scores = np.array(res["importance_map"], dtype=np.float32)
            method_desc = "Proposed Perception-Aware (multi-cue perceptual importance optimization)"
        else:
            scores = np.ones(n_total, dtype=np.float32)
            method_desc = f"Method ({method})"

        # 2. Assign LOD levels and active mask
        # If method is uniform, every region gets roughly budget ratio
        active_mask, region_details, lod_distribution = cls._allocate_by_scores(
            semantics, scores, target_primitives, n_total, method
        )
        active_count = int(np.sum(active_mask))

        # Predicted performance calculations based on active primitive ratio
        primitive_ratio = active_count / n_total
        # Base latency without load is ~4ms, full 30k splat rendering is ~18ms
        predicted_frame_time = 4.0 + 14.0 * (primitive_ratio ** 0.85)
        predicted_fps = min(float(target_fps), 1000.0 / predicted_frame_time)

        return {
            "method": method,
            "method_description": method_desc,
            "rendering_budget": rendering_budget,
            "target_primitives": target_primitives,
            "total_primitives": n_total,
            "active_primitives": active_count,
            "pruned_primitives": n_total - active_count,
            "overall_reduction_pct": round((1.0 - active_count / n_total) * 100, 2),
            "lod_breakdown": lod_distribution,
            "region_breakdowns": region_details,
            "predicted_fps": round(predicted_fps, 1),
            "predicted_frame_time_ms": round(predicted_frame_time, 2),
            "active_mask": active_mask  # List of 0 or 1 integers for frontend selection
        }

    @classmethod
    def _allocate_by_scores(
        cls,
        semantics: np.ndarray,
        scores: np.ndarray,
        target_budget: int,
        n_total: int,
        method: str
    ) -> Tuple[List[int], List[Dict[str, Any]], Dict[str, int]]:
        """
        Determines which primitives are retained and assigns LOD levels
        to satisfy the budget constraint while maximizing retained perceptual value.
        """
        # Threshold scores to meet target budget
        if method == "uniform_baseline":
            # Exact uniform permutation across all primitives to match target budget precisely
            perm = np.random.RandomState(42).permutation(n_total)
            active = np.zeros(n_total, dtype=np.int32)
            active[perm[:target_budget]] = 1
        else:
            # Sort scores descending and pick the top target_budget primitives
            sorted_indices = np.argsort(-scores)
            active = np.zeros(n_total, dtype=np.int32)
            active[sorted_indices[:target_budget]] = 1

        # Calculate per-region statistics and LOD assignments
        region_details = []
        lod_counts = {f"LOD_{k}": 0 for k in range(5)}

        for cid, cinfo in SEMANTIC_CLASSES.items():
            mask = (semantics == cid)
            total_reg = int(np.sum(mask))
            if total_reg == 0:
                continue

            active_reg = int(np.sum(active[mask]))
            retention = active_reg / total_reg if total_reg > 0 else 0.0
            mean_score = float(np.mean(scores[mask]))

            # Map retention to discrete LOD level
            if retention >= 0.90:
                lod_level = 0
            elif retention >= 0.70:
                lod_level = 1
            elif retention >= 0.45:
                lod_level = 2
            elif retention >= 0.20:
                lod_level = 3
            else:
                lod_level = 4

            lod_counts[f"LOD_{lod_level}"] += active_reg

            # Priority rating
            if mean_score >= 0.75:
                priority = "CRITICAL"
            elif mean_score >= 0.50:
                priority = "HIGH"
            elif mean_score >= 0.30:
                priority = "MEDIUM"
            else:
                priority = "LOW"

            # Estimated region visual quality under allocated LOD
            quality_factor = 0.5 + 0.5 * (retention ** 0.5)
            estimated_cost = round(active_reg / target_budget * 100, 1) if target_budget > 0 else 0.0

            region_details.append({
                "class_id": cid,
                "region": cinfo["name"],
                "label": cinfo["label"],
                "is_human": cinfo["is_human"],
                "lod": lod_level,
                "total_primitives": total_reg,
                "active_primitives": active_reg,
                "retention_ratio": round(retention, 3),
                "importance_score": round(mean_score, 3),
                "priority_level": priority,
                "quality_estimate": round(quality_factor, 3),
                "cost_estimate": estimated_cost
            })

        return active.tolist(), region_details, lod_counts
