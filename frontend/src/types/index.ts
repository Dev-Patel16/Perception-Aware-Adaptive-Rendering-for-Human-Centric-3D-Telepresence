export interface Scene {
  id: string;
  name: string;
  description?: string;
  primitive_count: number;
  source_type: string;
  bounding_box?: { min: number[]; max: number[] };
  semantic_classes?: string[];
  created_at?: string;
}

export interface SemanticClassMeta {
  name: string;
  label: string;
  default_importance: number;
  is_human: boolean;
}

export interface ScenePrimitives {
  scene_id: string;
  primitive_count: number;
  positions: number[][];
  colors: number[][];
  semantics: number[];
  motion_vectors: number[][];
  saliencies: number[];
  radii: number[];
  semantic_meta: Record<string, SemanticClassMeta>;
}

export interface PerceptionWeights {
  semantic_weight: number;
  human_weight: number;
  motion_weight: number;
  saliency_weight: number;
}

export interface RegionStatistic {
  class_id: number;
  name: string;
  label: string;
  count: number;
  percentage: number;
  is_human: boolean;
  mean_importance: number;
  min_importance: number;
  max_importance: number;
  priority: string;
}

export interface ImportanceResult {
  total_primitives: number;
  weights: {
    semantic: number;
    human: number;
    motion: number;
    saliency: number;
  };
  importance_map: number[];
  components: {
    semantic: number[];
    human: number[];
    motion: number[];
    saliency: number[];
  };
  region_statistics: RegionStatistic[];
  global_mean_importance: number;
  global_std_importance: number;
}

export interface RegionAllocationDetail {
  class_id: number;
  region: string;
  label: string;
  is_human: boolean;
  lod: number;
  total_primitives: number;
  active_primitives: number;
  retention_ratio: number;
  importance_score: number;
  priority_level: string;
  quality_estimate: number;
  cost_estimate: number;
}

export interface RenderAllocation {
  method: string;
  method_description: string;
  rendering_budget: number;
  target_primitives: number;
  total_primitives: number;
  active_primitives: number;
  pruned_primitives: number;
  overall_reduction_pct: number;
  lod_breakdown: Record<string, number>;
  region_breakdowns: RegionAllocationDetail[];
  predicted_fps: number;
  predicted_frame_time_ms: number;
  active_mask: number[];
}

export interface QualityMetrics {
  global: {
    psnr: number;
    ssim: number;
    lpips: number;
  };
  human_aggregate: {
    psnr: number;
    ssim: number;
    lpips: number;
  };
  background_aggregate: {
    psnr: number;
    ssim: number;
    lpips: number;
  };
  regions: Record<string, {
    label: string;
    is_human: boolean;
    total_primitives: number;
    active_primitives: number;
    retention_ratio: number;
    psnr: number;
    ssim: number;
    lpips: number;
  }>;
}

export interface Experiment {
  experiment_id: string;
  scene_id: string;
  method: string;
  semantic_weight: number;
  human_weight: number;
  motion_weight: number;
  saliency_weight: number;
  rendering_budget: number;
  target_fps: number;
  resolution: string;
  lod_configuration?: Record<string, number>;
  timestamp: string;
  hardware_information?: Record<string, any>;
  software_information?: Record<string, any>;
  status: string;
  psnr?: number;
  ssim?: number;
  lpips?: number;
  fps?: number;
  frame_time_ms?: number;
  latency_ms?: number;
  primitive_count?: number;
  region_metrics?: QualityMetrics;
  output_path?: string;
}

export interface BenchmarkDataPoint {
  budget: number;
  budget_percent: number;
  active_primitives: number;
  total_primitives: number;
  psnr: number;
  ssim: number;
  lpips: number;
  fps: number;
  frame_time_ms: number;
  latency_ms: number;
  human_psnr: number;
  human_ssim: number;
  background_psnr: number;
  background_ssim: number;
  face_psnr: number;
  face_ssim: number;
}

export interface BenchmarkCurve {
  method_id: string;
  name: string;
  data_points: BenchmarkDataPoint[];
}

export interface BenchmarkResponse {
  scene_id: string;
  budgets: number[];
  methods: Array<{ id: string; name: string }>;
  results: Record<string, BenchmarkCurve>;
  summary: {
    hypothesis_evaluation: string;
    measured_date: string;
    is_calibrated: boolean;
  };
}

export interface AblationItem {
  config_code: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  budget: number;
  active_primitives: number;
  psnr: number;
  ssim: number;
  lpips: number;
  fps: number;
  frame_time_ms: number;
  human_psnr: number;
  human_ssim: number;
  face_psnr: number;
  face_ssim: number;
  hands_psnr: number;
  background_psnr: number;
  background_ssim: number;
}

export interface AblationResponse {
  scene_id: string;
  rendering_budget: number;
  ablation_results: AblationItem[];
  discussion: string;
}

export type ActiveView = 
  | 'overview'
  | 'studio'
  | 'perception'
  | 'adaptive'
  | 'benchmark'
  | 'experiments'
  | 'ablation'
  | 'method'
  | 'dataset'
  | 'about'
  | 'portfolio';
