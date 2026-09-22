import React, { useState, useEffect } from 'react';
import { Scene, Experiment, PerceptionWeights } from '../types';
import { fetchExperiments, createExperiment, deleteExperiment, getExportCsvUrl, getExportJsonUrl, getExportReportUrl } from '../services/api';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Download, 
  Eye, 
  Columns, 
  ChevronRight, 
  Cpu, 
  Activity,
  AlertCircle
} from 'lucide-react';

interface ExperimentsViewProps {
  currentScene: Scene | null;
  weights: PerceptionWeights;
}

const PIPELINE_STEPS = [
  'Preparing scene & primitives',
  'Analyzing semantic & motion regions',
  'Calculating perceptual importance',
  'Applying dynamic LOD resource allocation',
  'Executing simulated rendering',
  'Computing objective & regional quality metrics',
  'Persisting experiment record to database'
];

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({ currentScene, weights }) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('proposed_perception_aware');
  const [budget, setBudget] = useState<number>(0.50);
  const [targetFps, setTargetFps] = useState<number>(60);
  const [resolution, setResolution] = useState<string>('1920x1080');

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const loadExperiments = () => {
    fetchExperiments()
      .then((data) => {
        setExperiments(data);
        if (data.length > 0 && !selectedExp) {
          setSelectedExp(data[0]);
        }
      })
      .catch((err) => console.error('Failed to fetch experiments:', err));
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleRunExperiment = async () => {
    if (!currentScene || isRunning) return;
    setIsRunning(true);
    setCurrentStep(0);

    // Visual step progression to match multi-stage backend pipeline
    for (let i = 0; i < PIPELINE_STEPS.length - 1; i++) {
      await new Promise((r) => setTimeout(r, 280));
      setCurrentStep(i + 1);
    }

    try {
      const newExp = await createExperiment({
        scene_id: currentScene.id,
        method: selectedMethod,
        rendering_budget: budget,
        target_fps: targetFps,
        resolution,
        weights
      });

      setCurrentStep(PIPELINE_STEPS.length);
      await new Promise((r) => setTimeout(r, 400));
      setIsRunning(false);
      setCurrentStep(-1);
      loadExperiments();
      setSelectedExp(newExp);
    } catch (err) {
      console.error('Experiment run failed:', err);
      setIsRunning(false);
      setCurrentStep(-1);
      alert('Experiment execution failed. Please ensure the backend is connected.');
    }
  };

  const handleDelete = async (expId: string) => {
    if (!confirm(`Delete experiment ${expId}?`)) return;
    try {
      await deleteExperiment(expId);
      loadExperiments();
      if (selectedExp?.experiment_id === expId) {
        setSelectedExp(null);
      }
    } catch (err) {
      console.error('Failed to delete experiment:', err);
    }
  };

  const toggleCompare = (expId: string) => {
    setCompareList((prev) => 
      prev.includes(expId) ? prev.filter((id) => id !== expId) : [...prev, expId]
    );
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <FlaskConical size={20} color="var(--accent-cyan)" /> Experiment Engine & Benchmark Database
          </h1>
          <p className="view-subtitle">
            Execute reproducible telepresence experiments, inspect regional PSNR/SSIM metrics, and export research reports.
          </p>
        </div>

        {compareList.length >= 2 && (
          <button className="btn btn-primary" onClick={() => setIsComparing(true)}>
            <Columns size={14} /> Compare {compareList.length} Experiments
          </button>
        )}
      </div>

      {/* Top: Experiment Runner Form & Live Pipeline Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Run Parameters Card */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Play size={14} color="var(--accent-cyan)" /> Configure & Launch Experiment
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Scene
              </label>
              <div style={{ background: 'var(--bg-deep)', padding: '6px 10px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {currentScene?.name || 'Telepresence Host 01'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Rendering Strategy
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                disabled={isRunning}
                style={{
                  width: '100%',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  padding: '6px 8px',
                  fontSize: 12
                }}
              >
                <option value="proposed_perception_aware">Proposed Perception-Aware</option>
                <option value="uniform_baseline">Uniform Baseline</option>
                <option value="human_centric">Human-Centric</option>
                <option value="motion_aware">Motion-Aware</option>
                <option value="distance_lod">Distance-Based LOD</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Budget ({(budget * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                className="custom-range"
                min="0.10"
                max="1.00"
                step="0.05"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Target Refresh
              </label>
              <select
                value={targetFps}
                onChange={(e) => setTargetFps(parseInt(e.target.value))}
                disabled={isRunning}
                style={{
                  width: '100%',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  padding: '6px 8px',
                  fontSize: 12
                }}
              >
                <option value={60}>60 FPS (Telepresence)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={24}>24 FPS (Cinematic)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                disabled={isRunning}
                style={{
                  width: '100%',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  padding: '6px 8px',
                  fontSize: 12
                }}
              >
                <option value="1920x1080">1920 x 1080 (FHD)</option>
                <option value="1280x720">1280 x 720 (HD)</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRunExperiment}
            disabled={isRunning}
            style={{ width: '100%', padding: '10px 16px', fontSize: 13 }}
          >
            {isRunning ? 'Executing Scientific Pipeline...' : 'Run Experiment Pipeline'}
          </button>
        </div>

        {/* Multi-Stage Pipeline Progress Stepper */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} color="var(--accent-amber)" /> End-to-End Processing Stepper
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
            {PIPELINE_STEPS.map((step, idx) => {
              const isDone = currentStep > idx || (!isRunning && currentStep === -1 && experiments.length > 0);
              const isActive = currentStep === idx;
              return (
                <div 
                  key={step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12,
                    color: isActive ? 'var(--accent-cyan)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    background: isActive ? 'var(--accent-cyan-dim)' : isDone ? 'var(--accent-emerald-dim)' : 'var(--bg-deep)',
                    color: isActive ? 'var(--accent-cyan)' : isDone ? 'var(--accent-emerald)' : 'var(--text-dim)',
                    border: `1px solid ${isActive ? 'var(--accent-cyan)' : isDone ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontWeight: isActive ? 600 : 400 }}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Experiment History Table & Selected Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Table */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Experiment Run History ({experiments.length} Records)
            </span>
          </div>

          <div className="data-table-container" style={{ border: 'none', maxHeight: 360, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Compare</th>
                  <th>ID</th>
                  <th>Method</th>
                  <th>Budget</th>
                  <th>PSNR</th>
                  <th>SSIM</th>
                  <th>FPS</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr 
                    key={exp.experiment_id}
                    onClick={() => setSelectedExp(exp)}
                    style={{
                      cursor: 'pointer',
                      background: selectedExp?.experiment_id === exp.experiment_id ? 'rgba(0, 229, 255, 0.05)' : 'transparent'
                    }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={compareList.includes(exp.experiment_id)}
                        onChange={() => toggleCompare(exp.experiment_id)}
                        style={{ accentColor: 'var(--accent-cyan)' }}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {exp.experiment_id}
                    </td>
                    <td>{exp.method.replace('_', ' ')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(exp.rendering_budget * 100).toFixed(0)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{exp.psnr?.toFixed(1) || 'N/A'} dB</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{exp.ssim?.toFixed(3) || 'N/A'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{exp.fps?.toFixed(0) || 'N/A'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="tool-btn" 
                        onClick={() => handleDelete(exp.experiment_id)}
                        style={{ color: 'var(--accent-rose)', padding: '2px 6px' }}
                        title="Delete record"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Experiment Inspector */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="panel-title">
            <span>Experiment Details ({selectedExp?.experiment_id || 'None'})</span>
            {selectedExp && (
              <div style={{ display: 'flex', gap: 4 }}>
                <a href={getExportCsvUrl(selectedExp.experiment_id)} download className="tool-btn" title="Download CSV">
                  <Download size={12} /> CSV
                </a>
                <a href={getExportReportUrl(selectedExp.experiment_id)} download className="tool-btn" title="Download Research Report">
                  <Download size={12} /> Report
                </a>
              </div>
            )}
          </div>

          {selectedExp ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="telemetry-card">
                  <span className="telemetry-label">Global PSNR</span>
                  <div className="telemetry-value" style={{ fontSize: 16 }}>{selectedExp.psnr} <span className="telemetry-unit">dB</span></div>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-label">Global SSIM</span>
                  <div className="telemetry-value" style={{ fontSize: 16 }}>{selectedExp.ssim}</div>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-label">Active Primitives</span>
                  <div className="telemetry-value" style={{ fontSize: 16 }}>{selectedExp.primitive_count?.toLocaleString()}</div>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-label">Frame Time</span>
                  <div className="telemetry-value" style={{ fontSize: 16 }}>{selectedExp.frame_time_ms} <span className="telemetry-unit">ms</span></div>
                </div>
              </div>

              {/* Regional Quality Breakdown */}
              {selectedExp.region_metrics && (
                <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Regional Quality Verification
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Human Aggregate PSNR:</span>
                      <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                        {selectedExp.region_metrics.human_aggregate?.psnr} dB
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Background PSNR:</span>
                      <strong style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {selectedExp.region_metrics.background_aggregate?.psnr} dB
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Face Region PSNR:</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {selectedExp.region_metrics.regions?.face?.psnr} dB
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', margin: 'auto' }}>
              Select an experiment to inspect measured results.
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {isComparing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div className="panel" style={{ width: '90%', maxWidth: 900, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="panel-title">
              <span>Side-by-Side Multi-Run Comparison</span>
              <button className="btn btn-secondary" onClick={() => setIsComparing(false)}>Close</button>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Experiment ID</th>
                    <th>Strategy</th>
                    <th>Budget</th>
                    <th>PSNR (dB)</th>
                    <th>SSIM</th>
                    <th>LPIPS</th>
                    <th>FPS</th>
                    <th>Active Primitives</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.filter(e => compareList.includes(e.experiment_id)).map(e => (
                    <tr key={e.experiment_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{e.experiment_id}</td>
                      <td>{e.method}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{(e.rendering_budget * 100).toFixed(0)}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{e.psnr}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{e.ssim}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{e.lpips}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{e.fps}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{e.primitive_count?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
