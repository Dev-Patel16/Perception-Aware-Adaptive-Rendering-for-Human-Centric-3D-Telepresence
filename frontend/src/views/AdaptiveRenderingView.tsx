import React, { useState, useEffect } from 'react';
import { Scene, ScenePrimitives, RenderAllocation, ImportanceResult, PerceptionWeights } from '../types';
import { SplitViewport } from '../components/viewport/SplitViewport';
import { allocateRender } from '../services/api';
import { 
  Sliders, 
  Cpu, 
  Layers, 
  Eye, 
  Activity, 
  Flame, 
  Sparkles, 
  TrendingDown, 
  Gauge, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface AdaptiveRenderingViewProps {
  currentScene: Scene | null;
  primitives: ScenePrimitives | null;
  importance: ImportanceResult | null;
  weights: PerceptionWeights;
  initialBudget?: number;
}

export const AdaptiveRenderingView: React.FC<AdaptiveRenderingViewProps> = ({
  currentScene,
  primitives,
  importance,
  weights,
  initialBudget = 0.50
}) => {
  const [budget, setBudget] = useState<number>(initialBudget);
  const [targetFps, setTargetFps] = useState<number>(60);
  const [activeMethod, setActiveMethod] = useState<string>('proposed_perception_aware');

  // Baseline allocation (uniform) and proposed allocation
  const [baselineAlloc, setBaselineAlloc] = useState<RenderAllocation | null>(null);
  const [proposedAlloc, setProposedAlloc] = useState<RenderAllocation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch allocations when budget, targetFps, weights, or method change
  useEffect(() => {
    if (!currentScene) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      allocateRender(currentScene.id, 'uniform_baseline', budget, targetFps),
      allocateRender(currentScene.id, activeMethod, budget, targetFps, weights)
    ])
      .then(([baseRes, propRes]) => {
        if (isMounted) {
          setBaselineAlloc(baseRes);
          setProposedAlloc(propRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to allocate resources:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentScene, budget, targetFps, activeMethod, weights]);

  const methodsList = [
    { id: 'uniform_baseline', name: 'Uniform Baseline', desc: 'Equal primitive sampling across all regions.' },
    { id: 'distance_lod', name: 'Distance-Based LOD', desc: 'Priority strictly determined by camera distance.' },
    { id: 'motion_aware', name: 'Motion-Aware', desc: 'Prioritizes dynamic velocity fields and speaking gestures.' },
    { id: 'human_centric', name: 'Human-Centric', desc: 'Allocates density to human silhouette and face.' },
    { id: 'proposed_perception_aware', name: 'Proposed Perception-Aware', desc: 'Multi-cue fusion (semantics, human biometric, motion, saliency).' },
    { id: 'custom', name: 'Custom Weights', desc: 'User-configured importance slider parameters.' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: '100%', overflow: 'hidden' }}>
      {/* Left: Synchronized A/B Split Viewport */}
      <div style={{ height: '100%', padding: 12, overflow: 'hidden' }}>
        <SplitViewport
          primitives={primitives}
          baselineMask={baselineAlloc?.active_mask}
          proposedMask={proposedAlloc?.active_mask}
          importanceMap={importance?.importance_map}
          budgetPercent={Math.round(budget * 100)}
        />
      </div>

      {/* Right: Adaptive Resource Allocation Controls */}
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
            <Gauge size={16} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Adaptive Resource Allocation
            </h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Dynamic Level of Detail (LOD) & computational budget optimizer.
          </p>
        </div>

        {/* Budget & Target FPS Controls */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 12 }}>
            <span>Computational Budget Constraint</span>
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-label">Rendering Budget (B)</span>
              <span className="slider-value">{(budget * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              className="custom-range"
              min="0.10"
              max="1.00"
              step="0.05"
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              <span>10% (Ultra Constrained)</span>
              <span>50%</span>
              <span>100% (Full Fidelity)</span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Target Telepresence Frame Rate
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[24, 30, 60].map((fps) => (
                <button
                  key={fps}
                  className={`tool-btn ${targetFps === fps ? 'active' : ''}`}
                  onClick={() => setTargetFps(fps)}
                  style={{ justifyContent: 'center' }}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rendering Method Selection */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 10 }}>
            <span>Active Strategy to Compare</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {methodsList.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: activeMethod === m.id ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                  border: `1px solid ${activeMethod === m.id ? 'var(--accent-cyan)' : 'var(--border-hairline)'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {activeMethod === m.id ? (
                    <CheckCircle size={14} color="var(--accent-cyan)" />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeMethod === m.id ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {m.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic LOD Distribution Breakdown */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
            <span>Dynamic LOD Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            {proposedAlloc && Object.entries(proposedAlloc.lod_breakdown).map(([lodKey, count]) => {
              const lodNum = parseInt(lodKey.split('_')[1]);
              const pct = ((count / (proposedAlloc.total_primitives || 1)) * 100).toFixed(1);
              return (
                <div key={lodKey} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {lodKey} {lodNum === 0 ? '(100% Detail)' : lodNum === 1 ? '(75% Detail)' : lodNum === 2 ? '(50% Detail)' : lodNum === 3 ? '(25% Detail)' : '(10% Coarse)'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-deep)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: lodNum === 0 ? 'var(--accent-cyan)' : lodNum === 1 ? 'var(--accent-emerald)' : lodNum === 2 ? 'var(--accent-amber)' : 'var(--accent-violet)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Retention Superiority Proof */}
        {proposedAlloc && baselineAlloc && (
          <div className="panel" style={{ padding: 12, background: 'rgba(0, 229, 255, 0.03)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>
              <TrendingDown size={13} /> Biometric Retention vs Uniform
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              At <strong style={{ color: 'var(--text-primary)' }}>{(budget * 100).toFixed(0)}% budget</strong>, 
              facial features retain <strong style={{ color: 'var(--accent-emerald)' }}>
                {((proposedAlloc.region_breakdowns.find(r => r.region === 'face')?.retention_ratio || 0) * 100).toFixed(0)}%
              </strong> density under Perception-Aware vs only <strong style={{ color: 'var(--accent-rose)' }}>
                {((baselineAlloc.region_breakdowns.find(r => r.region === 'face')?.retention_ratio || 0) * 100).toFixed(0)}%
              </strong> under Uniform Baseline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
