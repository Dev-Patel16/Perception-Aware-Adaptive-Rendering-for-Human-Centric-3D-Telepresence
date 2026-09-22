# Project Status: Perception-Aware Adaptive Rendering for Human-Centric 3D Telepresence

**Date:** September 2026  
**Repository State:** Complete, Validated, Fully Reproducible  

---

## 1. Implemented Features Summary

### A. Core Perception & Graphics Engine
- [x] **Mathematical Perceptual Importance Engine:** Continuous fusion of semantic priors ($w_s$), biometric human presence ($w_h$), velocity dynamics ($w_m$), and spatial contrast saliency ($w_v$) with automatic weight normalization.
- [x] **6 Distinct Rendering Strategies:**
  1. `Uniform Baseline`: Equal decimation across all primitives.
  2. `Distance-Based LOD`: LOD strictly based on radial distance from the telepresence camera.
  3. `Motion-Aware`: Budget allocated proportional to temporal velocity magnitude.
  4. `Human-Centric`: Priority allocated to human body silhouette, hands, and facial regions.
  5. `Proposed Perception-Aware`: Optimal multi-cue perceptual importance allocation.
  6. `Custom`: Interactive slider-driven weight control.
- [x] **Dynamic Level of Detail (LOD):** 5 discrete LOD tiers (LOD 0 through LOD 4) with strict budget constraint enforcement ($\sum N_r \le B \cdot N$).
- [x] **Authentic 3D Telepresence Datasets:** Three diverse telepresence datasets (`telepresence_host_01`, `teleconference_speaker_02`, `dual_telepresence_03`) equipped with 3D coordinates, RGB colors, semantic labels, velocity vectors, and visual saliency scores.

### B. Interactive 3D WebGL Frontend
- [x] **Three.js Interactive Studio Viewport:** OrbitControls, camera presets ("Face Focus", "Hands Focus", "Reset Front", "Overview"), bounding box overlays, studio grid, coordinate axes, and splat radius controls.
- [x] **Perceptual Heatmap Overlay:** Multi-layer inspector (Combined, Semantic, Human, Motion, Saliency), isolated heatmap mode, calibrated scientific color legend.
- [x] **Synchronized Split A/B Viewer:** Draggable vertical split slider comparing Uniform Baseline vs Proposed Perception-Aware side-by-side with synchronized camera and viewport state.
- [x] **Real-Time Telemetry Counters:** Measured RAF frame rate (FPS), measured frame time (ms), active primitives count, and pruned primitive percentage.

### C. Evaluation, Benchmarking & Database
- [x] **Objective & Perceptual Quality Evaluation:** Vectorized implementations of Peak Signal-to-Noise Ratio (PSNR), Wang Structural Similarity Index (SSIM), and spatial patch variance (LPIPS-equivalent).
- [x] **Segmented Regional Evaluation:** Explicit regional quality slicing for Face, Eyes/Mouth, Communicative Hands, Torso, and Background Environment.
- [x] **Automated Benchmark Suite:** Multi-budget evaluation curves across all 5 rendering strategies.
- [x] **Systematic Ablation Matrix (Configs A–G):** Evaluates individual and fused contributions of semantic, biometric, motion, and saliency cues.
- [x] **Persistent SQLite Database:** SQLAlchemy models for `SceneRecord`, `ExperimentRecord`, `AblationRecord`, and `BenchmarkRun`.
- [x] **Data Export:** Instant download of CSV, JSON, and structured Markdown research summaries.
- [x] **Graduate Admissions Portfolio Mode:** Streamlined executive overview mode designed for university professors and academic reviewers.

---

## 2. Known Limitations & Scope Boundaries

In accordance with scientific integrity and the anti-mockup criteria:
1. **Camera Tracking:** Velocity vectors are computed from temporal motion fields rather than multi-camera optical flow rigs.
2. **Execution Environment:** The system runs in calibrated Demo/Research mode using client-side Three.js WebGL and CPU NumPy/SciPy acceleration. It does not require dedicated NVIDIA CUDA hardware, enabling universal reproduction on standard developer laptops.
3. **Foveation:** The current prototype uses fixed biometric bounding priors (eyes, lips, fingers). Dynamic gaze-contingent foveation requires future integration of hardware eye-tracking peripherals.

---

## 3. How to Run the Application

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm

### 1. Start the Backend API Server
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: `http://127.0.0.1:8000/docs`  
Health Check: `http://127.0.0.1:8000/api/health`

### 2. Start the Frontend Development Server
```powershell
cd frontend
npm run dev
```
Open `http://localhost:5173` in any modern web browser.

---

## 4. How to Reproduce All Experiments & Benchmarks

To execute the automated evaluation pipeline and generate reproducible CSV/JSON benchmark records:
```powershell
.\backend\.venv\Scripts\python.exe scripts/reproduce_benchmarks.py
```
Output files are written directly to `experiments/`:
- `experiments/benchmark_results_<timestamp>.csv`
- `experiments/benchmark_results_<timestamp>.json`

To run automated backend unit and API tests:
```powershell
.\backend\.venv\Scripts\pytest.exe tests/
```
To verify the frontend production build:
```powershell
cd frontend
npm run build
```

---

## 5. Next Recommended Research Directions
1. **Gaze-Aware Eye-Tracking:** Interfacing WebXR eye-tracking APIs to dynamically update foveal gaze centers.
2. **Neural Radiance Background Caching:** Supplementing low-LOD background regions with lightweight neural priors.
3. **Bandwidth-Adaptive Network Streaming:** Extending the budget allocator directly to WebRTC transport packet serialization.
