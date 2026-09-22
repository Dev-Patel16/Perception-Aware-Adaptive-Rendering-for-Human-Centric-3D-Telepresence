import { 
  Scene, 
  ScenePrimitives, 
  PerceptionWeights, 
  ImportanceResult, 
  RenderAllocation, 
  Experiment, 
  BenchmarkResponse, 
  AblationResponse 
} from '../types';

const API_BASE = '/api';

export async function fetchScenes(): Promise<Scene[]> {
  const res = await fetch(`${API_BASE}/scenes`);
  if (!res.ok) throw new Error(`Failed to fetch scenes: ${res.statusText}`);
  return res.json();
}

export async function fetchScene(sceneId: string): Promise<Scene> {
  const res = await fetch(`${API_BASE}/scenes/${sceneId}`);
  if (!res.ok) throw new Error(`Failed to fetch scene ${sceneId}`);
  return res.json();
}

export async function fetchScenePrimitives(sceneId: string, maxCount?: number): Promise<ScenePrimitives> {
  const url = maxCount 
    ? `${API_BASE}/scenes/${sceneId}/primitives?max_count=${maxCount}`
    : `${API_BASE}/scenes/${sceneId}/primitives`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch primitives for scene ${sceneId}`);
  return res.json();
}

export async function analyzePerception(
  sceneId: string, 
  weights: PerceptionWeights
): Promise<ImportanceResult> {
  const res = await fetch(`${API_BASE}/perception/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene_id: sceneId, ...weights })
  });
  if (!res.ok) throw new Error(`Perception analysis failed: ${res.statusText}`);
  return res.json();
}

export async function allocateRender(
  sceneId: string,
  method: string,
  budget: number,
  targetFps: number = 60,
  weights?: PerceptionWeights
): Promise<RenderAllocation> {
  const payload = {
    scene_id: sceneId,
    method,
    rendering_budget: budget,
    target_fps: targetFps,
    weights: weights || {
      semantic_weight: 0.35,
      human_weight: 0.35,
      motion_weight: 0.15,
      saliency_weight: 0.15
    }
  };
  const res = await fetch(`${API_BASE}/render/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Render allocation failed: ${res.statusText}`);
  return res.json();
}

export async function simulateRender(
  sceneId: string,
  method: string,
  budget: number,
  targetFps: number = 60,
  weights?: PerceptionWeights
): Promise<{ allocation: RenderAllocation; metrics: any; baseline_comparison: any }> {
  const payload = {
    scene_id: sceneId,
    method,
    rendering_budget: budget,
    target_fps: targetFps,
    weights: weights || {
      semantic_weight: 0.35,
      human_weight: 0.35,
      motion_weight: 0.15,
      saliency_weight: 0.15
    }
  };
  const res = await fetch(`${API_BASE}/render/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Render simulation failed: ${res.statusText}`);
  return res.json();
}

export async function fetchExperiments(sceneId?: string, method?: string): Promise<Experiment[]> {
  const params = new URLSearchParams();
  if (sceneId) params.set('scene_id', sceneId);
  if (method) params.set('method', method);
  const url = `${API_BASE}/experiments${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch experiments');
  return res.json();
}

export async function createExperiment(data: {
  scene_id: string;
  method: string;
  rendering_budget: number;
  target_fps: number;
  resolution: string;
  weights: PerceptionWeights;
}): Promise<Experiment> {
  const res = await fetch(`${API_BASE}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to create experiment: ${res.statusText}`);
  return res.json();
}

export async function deleteExperiment(experimentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/experiments/${experimentId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete experiment: ${res.statusText}`);
}

export async function fetchBenchmark(sceneId: string = 'telepresence_host_01'): Promise<BenchmarkResponse> {
  const res = await fetch(`${API_BASE}/benchmark?scene_id=${sceneId}`);
  if (!res.ok) throw new Error(`Failed to fetch benchmark data for scene ${sceneId}`);
  return res.json();
}

export async function fetchAblation(sceneId: string = 'telepresence_host_01', budget: number = 0.5): Promise<AblationResponse> {
  const res = await fetch(`${API_BASE}/ablation?scene_id=${sceneId}&budget=${budget}`);
  if (!res.ok) throw new Error(`Failed to fetch ablation study for scene ${sceneId}`);
  return res.json();
}

export function getExportCsvUrl(experimentId: string): string {
  return `${API_BASE}/export/${experimentId}/csv`;
}

export function getExportJsonUrl(experimentId: string): string {
  return `${API_BASE}/export/${experimentId}/json`;
}

export function getExportReportUrl(experimentId: string): string {
  return `${API_BASE}/export/${experimentId}/report`;
}
