import os
import json
import numpy as np
from typing import Dict, List, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Semantic class definitions
SEMANTIC_CLASSES = {
    0: {"name": "background", "label": "Background Environment", "default_importance": 0.10, "is_human": False},
    1: {"name": "furniture", "label": "Foreground Furniture", "default_importance": 0.25, "is_human": False},
    2: {"name": "body", "label": "Human Torso & Clothing", "default_importance": 0.65, "is_human": True},
    3: {"name": "hands", "label": "Human Hands & Gestures", "default_importance": 0.85, "is_human": True},
    4: {"name": "face", "label": "Human Head & Facial Features", "default_importance": 0.95, "is_human": True},
    5: {"name": "eyes_mouth", "label": "Eyes & Mouth Region", "default_importance": 1.00, "is_human": True},
}


class SceneManager:
    """
    Manages 3D telepresence scenes containing 3D coordinates, colors,
    covariances/radii, semantic region tags, motion velocity fields, and visual saliency.
    """
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def list_available_scenes(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": "telepresence_host_01",
                "name": "Host Telepresence Studio (Single Speaker)",
                "description": "Seated telepresence participant with active facial articulation, speaking motion, and hand gestures in a structured studio setting.",
                "primitive_count": 24500,
                "source_type": "gaussian_splat",
                "semantic_classes": [v["name"] for v in SEMANTIC_CLASSES.values()],
                "bounding_box": {"min": [-1.8, -1.2, -1.0], "max": [1.8, 1.6, 2.5]}
            },
            {
                "id": "teleconference_speaker_02",
                "name": "Dynamic Teleconference Presenter",
                "description": "Standing remote presenter demonstrating rapid communicative gestures, head turn dynamics, and interactive telepresence projection.",
                "primitive_count": 28200,
                "source_type": "point_cloud",
                "semantic_classes": [v["name"] for v in SEMANTIC_CLASSES.values()],
                "bounding_box": {"min": [-2.0, -1.4, -1.2], "max": [2.0, 1.8, 2.8]}
            },
            {
                "id": "dual_telepresence_03",
                "name": "Dual Collaborative Telepresence",
                "description": "Two remote collaborative participants with shared desk workspace, conversational turn-taking, and peripheral telepresence environment.",
                "primitive_count": 32000,
                "source_type": "gaussian_splat",
                "semantic_classes": [v["name"] for v in SEMANTIC_CLASSES.values()],
                "bounding_box": {"min": [-2.5, -1.2, -1.2], "max": [2.5, 1.7, 3.0]}
            }
        ]

    @classmethod
    def get_scene(cls, scene_id: str) -> Dict[str, Any]:
        if scene_id in cls._cache:
            return cls._cache[scene_id]

        meta = next((s for s in cls.list_available_scenes() if s["id"] == scene_id), None)
        if not meta:
            meta = cls.list_available_scenes()[0]
            scene_id = meta["id"]

        scene_data = cls._generate_telepresence_scene(scene_id, meta["primitive_count"])
        cls._cache[scene_id] = scene_data
        return scene_data

    @classmethod
    def _generate_telepresence_scene(cls, scene_id: str, count: int) -> Dict[str, Any]:
        """
        Synthesizes a realistic, high-fidelity 3D human telepresence scene
        structured with head, face, eyes, torso, gesturing hands, desk, and room background.
        """
        np.random.seed(42 if scene_id == "telepresence_host_01" else (43 if scene_id == "teleconference_speaker_02" else 44))
        
        positions = []
        colors = []
        semantics = []
        motion_vectors = []
        saliencies = []
        radii = []

        # Allocation per region:
        # 0: background (35%), 1: furniture (15%), 2: body (25%), 3: hands (10%), 4: face (10%), 5: eyes/mouth (5%)
        n_bg = int(count * 0.35)
        n_furn = int(count * 0.15)
        n_body = int(count * 0.25)
        n_hands = int(count * 0.10)
        n_face = int(count * 0.10)
        n_eyes = count - (n_bg + n_furn + n_body + n_hands + n_face)

        # 1. Background (Walls, acoustic panels, ambient room, floor)
        # Spatial extent: x in [-2.0, 2.0], y in [-1.0, 1.5], z in [1.5, 2.5]
        bg_x = np.random.uniform(-2.0, 2.0, n_bg)
        bg_y = np.random.uniform(-0.8, 1.6, n_bg)
        bg_z = np.random.uniform(1.4, 2.5, n_bg)
        for i in range(n_bg):
            positions.append([float(bg_x[i]), float(bg_y[i]), float(bg_z[i])])
            # Cool dark studio room tones: slate blue, dark gray
            r = np.clip(0.15 + np.random.normal(0, 0.03), 0.1, 0.25)
            g = np.clip(0.18 + np.random.normal(0, 0.03), 0.12, 0.28)
            b = np.clip(0.24 + np.random.normal(0, 0.03), 0.18, 0.35)
            colors.append([float(r), float(g), float(b)])
            semantics.append(0)
            motion_vectors.append([0.0, 0.0, 0.0])
            saliencies.append(float(np.clip(np.random.normal(0.12, 0.04), 0.02, 0.25)))
            radii.append(float(np.random.uniform(0.04, 0.08)))

        # 2. Foreground Furniture (Telepresence desk, microphone, laptop boundary)
        furn_x = np.random.uniform(-1.0, 1.0, n_furn)
        furn_y = np.random.uniform(-0.6, -0.4, n_furn)
        furn_z = np.random.uniform(0.2, 0.8, n_furn)
        for i in range(n_furn):
            positions.append([float(furn_x[i]), float(furn_y[i]), float(furn_z[i])])
            # Desk surface: dark walnut wood/matte black
            r = np.clip(0.20 + np.random.normal(0, 0.02), 0.12, 0.3)
            g = np.clip(0.19 + np.random.normal(0, 0.02), 0.12, 0.28)
            b = np.clip(0.22 + np.random.normal(0, 0.02), 0.14, 0.32)
            colors.append([float(r), float(g), float(b)])
            semantics.append(1)
            motion_vectors.append([0.0, 0.0, 0.0])
            saliencies.append(float(np.clip(np.random.normal(0.28, 0.05), 0.15, 0.45)))
            radii.append(float(np.random.uniform(0.03, 0.06)))

        # 3. Human Torso & Clothing (Body)
        # Centered around (0, -0.1, 0.8), shoulder width ~0.7, height ~0.6
        phi = np.random.uniform(0, 2 * np.pi, n_body)
        h_body = np.random.uniform(-0.45, 0.2, n_body)
        w_body = 0.32 * (1.0 - 0.3 * (h_body + 0.45))
        body_x = w_body * np.cos(phi) * 1.1 + np.random.normal(0, 0.02, n_body)
        body_y = h_body
        body_z = 0.85 + 0.18 * np.sin(phi) + np.random.normal(0, 0.02, n_body)
        for i in range(n_body):
            positions.append([float(body_x[i]), float(body_y[i]), float(body_z[i])])
            # Professional navy/charcoal attire
            r = np.clip(0.18 + np.random.normal(0, 0.03), 0.10, 0.35)
            g = np.clip(0.24 + np.random.normal(0, 0.03), 0.15, 0.42)
            b = np.clip(0.42 + np.random.normal(0, 0.04), 0.25, 0.60)
            colors.append([float(r), float(g), float(b)])
            semantics.append(2)
            # Subtle respiration motion
            mv_y = float(np.sin(h_body[i] * 3.0) * 0.008)
            motion_vectors.append([0.0, mv_y, 0.002])
            saliencies.append(float(np.clip(np.random.normal(0.60, 0.08), 0.4, 0.78)))
            radii.append(float(np.random.uniform(0.025, 0.045)))

        # 4. Human Hands & Gestures
        # Two clusters for left hand (-0.35, -0.25, 0.55) and right hand (0.35, -0.22, 0.52)
        half_hands = n_hands // 2
        for h_idx in range(n_hands):
            is_right = (h_idx >= half_hands)
            center = [0.36, -0.22, 0.54] if is_right else [-0.34, -0.26, 0.58]
            hx = center[0] + np.random.normal(0, 0.065)
            hy = center[1] + np.random.normal(0, 0.055)
            hz = center[2] + np.random.normal(0, 0.065)
            positions.append([float(hx), float(hy), float(hz)])
            # Natural skin tones
            r = np.clip(0.86 + np.random.normal(0, 0.04), 0.70, 0.95)
            g = np.clip(0.68 + np.random.normal(0, 0.04), 0.55, 0.82)
            b = np.clip(0.58 + np.random.normal(0, 0.04), 0.45, 0.72)
            colors.append([float(r), float(g), float(b)])
            semantics.append(3)
            # Active gesture velocity
            vx = float(0.045 if is_right else -0.038) + float(np.random.normal(0, 0.01))
            vy = float(0.030) + float(np.random.normal(0, 0.01))
            vz = float(0.015) + float(np.random.normal(0, 0.005))
            motion_vectors.append([vx, vy, vz])
            saliencies.append(float(np.clip(np.random.normal(0.82, 0.06), 0.65, 0.95)))
            radii.append(float(np.random.uniform(0.018, 0.032)))

        # 5. Human Head & Facial Features
        # Ellipsoid centered at (0, 0.42, 0.82), radius ~0.12, 0.16, 0.14
        u = np.random.uniform(0, 2 * np.pi, n_face)
        v = np.random.uniform(0, np.pi, n_face)
        fx = 0.11 * np.sin(v) * np.cos(u) + np.random.normal(0, 0.008, n_face)
        fy = 0.44 + 0.15 * np.cos(v) + np.random.normal(0, 0.008, n_face)
        fz = 0.82 + 0.12 * np.sin(v) * np.sin(u) + np.random.normal(0, 0.008, n_face)
        for i in range(n_face):
            positions.append([float(fx[i]), float(fy[i]), float(fz[i])])
            is_hair = (fy[i] > 0.48 and fz[i] > 0.80) or fy[i] > 0.54
            if is_hair:
                colors.append([0.18, 0.14, 0.12])
            else:
                colors.append([0.88, 0.70, 0.60])
            semantics.append(4)
            # Conversational head tilt/nodding
            motion_vectors.append([float(np.sin(fy[i] * 5.0) * 0.015), float(np.cos(fx[i] * 5.0) * 0.012), 0.005])
            saliencies.append(float(np.clip(np.random.normal(0.92, 0.04), 0.80, 0.99)))
            radii.append(float(np.random.uniform(0.014, 0.024)))

        # 6. Critical Eyes & Mouth Region (Highest perceptual sensitivity)
        # Left eye: (-0.038, 0.46, 0.71), Right eye: (0.038, 0.46, 0.71), Mouth: (0.0, 0.36, 0.70)
        n_per_feature = n_eyes // 3
        for i in range(n_eyes):
            if i < n_per_feature:
                # Left eye
                cx, cy, cz = -0.038, 0.46, 0.71
                ex = cx + np.random.normal(0, 0.015)
                ey = cy + np.random.normal(0, 0.009)
                ez = cz + np.random.normal(0, 0.008)
                color = [0.22, 0.38, 0.48]  # Iris tone
                mv = [float(np.random.normal(0, 0.008)), float(np.random.normal(0, 0.004)), 0.0]
            elif i < 2 * n_per_feature:
                # Right eye
                cx, cy, cz = 0.038, 0.46, 0.71
                ex = cx + np.random.normal(0, 0.015)
                ey = cy + np.random.normal(0, 0.009)
                ez = cz + np.random.normal(0, 0.008)
                color = [0.22, 0.38, 0.48]
                mv = [float(np.random.normal(0, 0.008)), float(np.random.normal(0, 0.004)), 0.0]
            else:
                # Mouth
                cx, cy, cz = 0.0, 0.36, 0.70
                ex = cx + np.random.normal(0, 0.028)
                ey = cy + np.random.normal(0, 0.012)
                ez = cz + np.random.normal(0, 0.009)
                color = [0.85, 0.45, 0.42]  # Lip tone
                # Phoneme articulation dynamics
                mv = [float(np.random.normal(0, 0.012)), float(np.random.normal(0, 0.035)), float(np.random.normal(0, 0.01))]

            positions.append([float(ex), float(ey), float(ez)])
            colors.append(color)
            semantics.append(5)
            motion_vectors.append(mv)
            saliencies.append(1.0)
            radii.append(float(np.random.uniform(0.008, 0.016)))

        return {
            "scene_id": scene_id,
            "primitive_count": len(positions),
            "positions": positions,
            "colors": colors,
            "semantics": semantics,
            "motion_vectors": motion_vectors,
            "saliencies": saliencies,
            "radii": radii,
            "semantic_meta": SEMANTIC_CLASSES
        }
