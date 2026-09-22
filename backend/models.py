import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
try:
    from database import Base
except ImportError:
    from .database import Base


class SceneRecord(Base):
    __tablename__ = "scenes"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    primitive_count = Column(Integer, default=0)
    source_type = Column(String(32), default="gaussian_splat")  # gaussian_splat, point_cloud, synthetic_telepresence
    bounding_box = Column(JSON, nullable=True)
    semantic_classes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ExperimentRecord(Base):
    __tablename__ = "experiments"

    experiment_id = Column(String(64), primary_key=True, index=True)
    scene_id = Column(String(64), nullable=False, index=True)
    method = Column(String(64), nullable=False)  # uniform_baseline, distance_lod, motion_aware, human_centric, proposed_perception_aware, custom
    
    # Perceptual weights
    semantic_weight = Column(Float, default=0.35)
    human_weight = Column(Float, default=0.35)
    motion_weight = Column(Float, default=0.15)
    saliency_weight = Column(Float, default=0.15)
    
    rendering_budget = Column(Float, default=0.5)  # 0.1 to 1.0
    target_fps = Column(Integer, default=60)
    resolution = Column(String(32), default="1920x1080")
    lod_configuration = Column(JSON, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    hardware_information = Column(JSON, nullable=True)
    software_information = Column(JSON, nullable=True)
    status = Column(String(32), default="completed")  # running, completed, failed
    
    # Global quality & performance metrics
    psnr = Column(Float, nullable=True)
    ssim = Column(Float, nullable=True)
    lpips = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    frame_time_ms = Column(Float, nullable=True)
    latency_ms = Column(Float, nullable=True)
    primitive_count = Column(Integer, nullable=True)
    
    # Region-level metrics (Face, Hands, Body, Background)
    region_metrics = Column(JSON, nullable=True)
    output_path = Column(String(256), nullable=True)


class AblationRecord(Base):
    __tablename__ = "ablation_studies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_code = Column(String(8), nullable=False)  # A, B, C, D, E, F, G
    name = Column(String(128), nullable=False)
    weights = Column(JSON, nullable=False)
    rendering_budget = Column(Float, default=0.5)
    psnr = Column(Float, nullable=False)
    ssim = Column(Float, nullable=False)
    lpips = Column(Float, nullable=False)
    fps = Column(Float, nullable=False)
    face_psnr = Column(Float, nullable=False)
    background_psnr = Column(Float, nullable=False)
    active_primitives = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
