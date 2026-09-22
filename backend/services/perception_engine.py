import numpy as np
from typing import Dict, List, Any
try:
    from services.scene_manager import SEMANTIC_CLASSES
except ImportError:
    from .scene_manager import SEMANTIC_CLASSES


class PerceptionEngine:
    """
    Computes perceptual importance for 3D telepresence scenes based on:
    P_i = (w_s * Semantic_i + w_h * Human_i + w_m * Motion_i + w_v * Saliency_i) / (w_s + w_h + w_m + w_v)
    """

    @classmethod
    def calculate_importance(
        cls,
        scene_data: Dict[str, Any],
        semantic_weight: float = 0.35,
        human_weight: float = 0.35,
        motion_weight: float = 0.15,
        saliency_weight: float = 0.15
    ) -> Dict[str, Any]:
        semantics = np.array(scene_data["semantics"], dtype=np.int32)
        motion_vecs = np.array(scene_data["motion_vectors"], dtype=np.float32)
        saliencies = np.array(scene_data["saliencies"], dtype=np.float32)
        n = len(semantics)

        # 1. Semantic Component (0 to 1)
        sem_importance = np.zeros(n, dtype=np.float32)
        for class_id, class_info in SEMANTIC_CLASSES.items():
            mask = (semantics == class_id)
            sem_importance[mask] = class_info["default_importance"]

        # 2. Human-Centric Component (Binary/Continuous priority for human regions)
        human_indicator = np.zeros(n, dtype=np.float32)
        for class_id, class_info in SEMANTIC_CLASSES.items():
            if class_info["is_human"]:
                mask = (semantics == class_id)
                # Differentiate human regions: eyes/mouth = 1.0, face = 0.95, hands = 0.85, body = 0.65
                human_indicator[mask] = class_info["default_importance"]

        # 3. Motion Component (Normalized velocity magnitude)
        motion_magnitudes = np.linalg.norm(motion_vecs, axis=1)
        max_vel = np.max(motion_magnitudes)
        if max_vel > 1e-6:
            norm_motion = motion_magnitudes / max_vel
        else:
            norm_motion = np.zeros(n, dtype=np.float32)

        # 4. Saliency Component (Spatial frequency / contrast)
        norm_saliency = np.clip(saliencies, 0.0, 1.0)

        # Weight Normalization
        total_w = semantic_weight + human_weight + motion_weight + saliency_weight
        if total_w <= 1e-6:
            w_s, w_h, w_m, w_v = 0.25, 0.25, 0.25, 0.25
        else:
            w_s = semantic_weight / total_w
            w_h = human_weight / total_w
            w_m = motion_weight / total_w
            w_v = saliency_weight / total_w

        # Combined Perceptual Importance
        importance = (
            w_s * sem_importance +
            w_h * human_indicator +
            w_m * norm_motion +
            w_v * norm_saliency
        )
        importance = np.clip(importance, 0.0, 1.0)

        # Regional Aggregation
        region_stats = []
        for class_id, class_info in SEMANTIC_CLASSES.items():
            mask = (semantics == class_id)
            count = int(np.sum(mask))
            if count > 0:
                mean_imp = float(np.mean(importance[mask]))
                min_imp = float(np.min(importance[mask]))
                max_imp = float(np.max(importance[mask]))
                # Priority label
                if mean_imp >= 0.75:
                    priority = "CRITICAL"
                elif mean_imp >= 0.50:
                    priority = "HIGH"
                elif mean_imp >= 0.30:
                    priority = "MEDIUM"
                else:
                    priority = "LOW"
            else:
                mean_imp = 0.0
                min_imp = 0.0
                max_imp = 0.0
                priority = "NONE"

            region_stats.append({
                "class_id": class_id,
                "name": class_info["name"],
                "label": class_info["label"],
                "count": count,
                "percentage": round(count / n * 100, 1),
                "is_human": class_info["is_human"],
                "mean_importance": round(mean_imp, 4),
                "min_importance": round(min_imp, 4),
                "max_importance": round(max_imp, 4),
                "priority": priority
            })

        # Sort region stats by mean_importance descending
        region_stats.sort(key=lambda x: x["mean_importance"], reverse=True)

        return {
            "total_primitives": n,
            "weights": {
                "semantic": w_s,
                "human": w_h,
                "motion": w_m,
                "saliency": w_v
            },
            "importance_map": importance.tolist(),
            "components": {
                "semantic": sem_importance.tolist(),
                "human": human_indicator.tolist(),
                "motion": norm_motion.tolist(),
                "saliency": norm_saliency.tolist()
            },
            "region_statistics": region_stats,
            "global_mean_importance": float(np.mean(importance)),
            "global_std_importance": float(np.std(importance))
        }
