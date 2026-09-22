import React, { useState } from 'react';
import { Scene, ScenePrimitives, PerceptionWeights, ImportanceResult, RenderAllocation } from '../types';
import { ThreeViewport } from '../components/viewport/ThreeViewport';
import { Sliders, Layers, Eye, Activity, Flame, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface PerceptionMapViewProps {
  currentScene: Scene | null;
  primitives: ScenePrimitives | null;
  importance: ImportanceResult | null;
  allocation: RenderAllocation | null;
  weights: PerceptionWeights;
  onWeightsChange: (weights: PerceptionWeights) => void;
}

export const PerceptionMapView: React.FC<PerceptionMapViewProps> = ({
  currentScene,
  primitives,
  importance,
  allocation,
  weights,
  onWeightsChange
}) => {
  const [activeLayer, setActiveLayer] = useState<'combined' | 'semantic' | 'human' | 'motion' | 'saliency'>('combined');
  const [isIsolatedMap, setIsIsolatedMap] = useState<boolean>(false);

  // Helper to update specific weight
  const handleWeightChange = (key: keyof PerceptionWeights, val: number) => {
    const updated = { ...weights, [key]: val };
    onWeightsChange(updated);
  };

  // Determine active component map for the viewport
  const displayedMap = React.useMemo(() => {
    if (!importance) return null;
    if (activeLayer === 'combined') return importance.importance_map;
    return importance.components[activeLayer] || importance.importance_map;
  }, [importance, activeLayer]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: '100%', overflow: 'hidden' }}>
      {/* Left: 3D Viewport with Perceptual Heatmap Overlay */}
      <div style={{ position: 'relative', height: '100%' }}>
        <ThreeViewport
          primitives={primitives}
          importanceMap={displayedMap}
          activeMask={isIsolatedMap ? null : allocation?.active_mask}
          colorMode="heatmap"
          showBoundingBoxes={true}
          pointSize={0.016}
        />

        {/* Floating Calibrated Legend */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(14, 19, 29, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          padding: '10px 14px',
          width: 240,
          zIndex: 10
        }}>
          <div className="heatmap-legend">
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Calibrated Perceptual Map ({activeLayer.toUpperCase()})
            </span>
            <div className="legend-bar" />
            <div className="legend-labels">
              <span>0.0 (Suppressed)</span>
              <span>0.5</span>
              <span>1.0 (Critical)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Importance Engine Parameter Controls & Region Breakdown */}
      <div style={{
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        overflowY: 'auto'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Sliders size={15} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Perceptual Engine Parameters
            </h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Configure multi-cue fusion weights. Weights are normalized automatically:
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', display: 'block', marginTop: 2 }}>
              &Sigma; w_i = 1.0
            </span>
          </p>
        </div>

        {/* Weights Sliders */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 12 }}>
            <span>Weight Allocations</span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '2px 6px', fontSize: 10 }}
              onClick={() => onWeightsChange({ semantic_weight: 0.35, human_weight: 0.35, motion_weight: 0.15, saliency_weight: 0.15 })}
            >
              <RefreshCw size={10} /> Reset Default
            </button>
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Layers size={12} color="var(--accent-violet)" /> Semantic Weight (w_s)
              </span>
              <span className="slider-value">{weights.semantic_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="custom-range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={weights.semantic_weight}
              onChange={(e) => handleWeightChange('semantic_weight', parseFloat(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye size={12} color="var(--accent-cyan)" /> Human Biometric Weight (w_h)
              </span>
              <span className="slider-value">{weights.human_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="custom-range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={weights.human_weight}
              onChange={(e) => handleWeightChange('human_weight', parseFloat(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={12} color="var(--accent-amber)" /> Motion Dynamics Weight (w_m)
              </span>
              <span className="slider-value">{weights.motion_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="custom-range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={weights.motion_weight}
              onChange={(e) => handleWeightChange('motion_weight', parseFloat(e.target.value))}
            />
          </div>

          <div className="slider-group" style={{ marginBottom: 4 }}>
            <div className="slider-label-row">
              <span className="slider-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={12} color="var(--accent-emerald)" /> Visual Saliency Weight (w_v)
              </span>
              <span className="slider-value">{weights.saliency_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="custom-range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={weights.saliency_weight}
              onChange={(e) => handleWeightChange('saliency_weight', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Layer Toggles & Isolated Mode */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
            <span>Active Layer Inspection</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            <button 
              className={`tool-btn ${activeLayer === 'combined' ? 'active' : ''}`}
              onClick={() => setActiveLayer('combined')}
              style={{ justifyContent: 'center' }}
            >
              Combined Map
            </button>
            <button 
              className={`tool-btn ${activeLayer === 'human' ? 'active' : ''}`}
              onClick={() => setActiveLayer('human')}
              style={{ justifyContent: 'center' }}
            >
              Human Layer
            </button>
            <button 
              className={`tool-btn ${activeLayer === 'motion' ? 'active' : ''}`}
              onClick={() => setActiveLayer('motion')}
              style={{ justifyContent: 'center' }}
            >
              Motion Layer
            </button>
            <button 
              className={`tool-btn ${activeLayer === 'saliency' ? 'active' : ''}`}
              onClick={() => setActiveLayer('saliency')}
              style={{ justifyContent: 'center' }}
            >
              Saliency Layer
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={isIsolatedMap} 
              onChange={(e) => setIsIsolatedMap(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
            Show Isolated Heatmap (Ignore Budget Pruning)
          </label>
        </div>

        {/* Region Breakdown Table */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
            <span>Per-Region Importance & Priority</span>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Imp.</th>
                  <th>Priority</th>
                  <th>LOD</th>
                </tr>
              </thead>
              <tbody>
                {allocation?.region_breakdowns.map((reg) => (
                  <tr key={reg.class_id}>
                    <td style={{ fontWeight: 600 }}>{reg.label}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{reg.importance_score.toFixed(2)}</td>
                    <td>
                      <span className={`telemetry-badge ${
                        reg.priority_level === 'CRITICAL' ? 'badge-rose' :
                        reg.priority_level === 'HIGH' ? 'badge-amber' :
                        reg.priority_level === 'MEDIUM' ? 'badge-cyan' :
                        'badge-violet'
                      }`}>
                        {reg.priority_level}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: reg.lod === 0 ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                      LOD {reg.lod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
