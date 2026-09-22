import React, { useState } from 'react';
import { Scene, ScenePrimitives, RenderAllocation, ImportanceResult } from '../types';
import { ThreeViewport } from '../components/viewport/ThreeViewport';
import { 
  Maximize2, 
  Eye, 
  Flame, 
  Layers, 
  Activity, 
  Box, 
  Grid, 
  Sliders, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface StudioViewProps {
  currentScene: Scene | null;
  primitives: ScenePrimitives | null;
  allocation: RenderAllocation | null;
  importance: ImportanceResult | null;
}

export const StudioView: React.FC<StudioViewProps> = ({
  currentScene,
  primitives,
  allocation,
  importance
}) => {
  const [colorMode, setColorMode] = useState<'natural' | 'heatmap' | 'semantic' | 'motion'>('natural');
  const [pointSize, setPointSize] = useState<number>(0.016);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'face' | 'hands' | 'overview'>('front');

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Primary 3D Viewport */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <ThreeViewport
          primitives={primitives}
          importanceMap={importance?.importance_map}
          activeMask={allocation?.active_mask}
          colorMode={colorMode}
          pointSize={pointSize}
          showBoundingBoxes={showBoundingBoxes}
          showGrid={showGrid}
          showAxes={showAxes}
          cameraPreset={cameraPreset}
        />
      </div>

      {/* Right Studio Controls & Telemetry Sidebar */}
      <div style={{
        width: 320,
        minWidth: 320,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        overflowY: 'auto'
      }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            3D Studio Inspector
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {currentScene?.name || 'Telepresence Scene'}
          </p>
        </div>

        {/* Shading / Color Mode Selection */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
            <span>Visualization Mode</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button 
              className={`tool-btn ${colorMode === 'natural' ? 'active' : ''}`}
              onClick={() => setColorMode('natural')}
              style={{ justifyContent: 'center' }}
            >
              <Eye size={12} /> True RGB
            </button>
            <button 
              className={`tool-btn ${colorMode === 'heatmap' ? 'active' : ''}`}
              onClick={() => setColorMode('heatmap')}
              style={{ justifyContent: 'center' }}
            >
              <Flame size={12} /> Heatmap
            </button>
            <button 
              className={`tool-btn ${colorMode === 'semantic' ? 'active' : ''}`}
              onClick={() => setColorMode('semantic')}
              style={{ justifyContent: 'center' }}
            >
              <Layers size={12} /> Semantic
            </button>
            <button 
              className={`tool-btn ${colorMode === 'motion' ? 'active' : ''}`}
              onClick={() => setColorMode('motion')}
              style={{ justifyContent: 'center' }}
            >
              <Activity size={12} /> Motion
            </button>
          </div>
        </div>

        {/* Viewport Display Settings */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
            <span>Display Elements</span>
          </div>

          <div className="slider-group" style={{ marginBottom: 10 }}>
            <div className="slider-label-row">
              <span className="slider-label">Primitive Splat Size</span>
              <span className="slider-value">{pointSize.toFixed(3)}</span>
            </div>
            <input
              type="range"
              className="custom-range"
              min="0.005"
              max="0.040"
              step="0.001"
              value={pointSize}
              onChange={(e) => setPointSize(parseFloat(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={showBoundingBoxes} 
                onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              Biometric Region Bounding Boxes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={showGrid} 
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              Spatial Studio Grid
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={showAxes} 
                onChange={(e) => setShowAxes(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              Coordinate Axes Reference (XYZ)
            </label>
          </div>
        </div>

        {/* Region Inventory */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
            <span>Semantic Region Inventory</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            {importance?.region_statistics.map((reg) => (
              <div 
                key={reg.class_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  background: 'var(--bg-panel)',
                  borderRadius: 4,
                  borderLeft: `3px solid ${
                    reg.class_id === 5 ? 'var(--accent-rose)' :
                    reg.class_id === 4 ? 'var(--accent-cyan)' :
                    reg.class_id === 3 ? 'var(--accent-amber)' :
                    reg.class_id === 2 ? 'var(--accent-blue)' :
                    'var(--text-dim)'
                  }`
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reg.label}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    {reg.count.toLocaleString()} pts ({reg.percentage}%)
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{reg.mean_importance.toFixed(2)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{reg.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
