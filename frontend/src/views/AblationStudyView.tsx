import React, { useState, useEffect } from 'react';
import { Scene, AblationResponse, AblationItem } from '../types';
import { fetchAblation } from '../services/api';
import { Layers, HelpCircle, CheckCircle, BarChart3, ArrowUpRight, Scale } from 'lucide-react';

interface AblationStudyViewProps {
  currentScene: Scene | null;
}

export const AblationStudyView: React.FC<AblationStudyViewProps> = ({ currentScene }) => {
  const [ablationData, setAblationData] = useState<AblationResponse | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<number>(0.50);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const sceneId = currentScene?.id || 'telepresence_host_01';

    fetchAblation(sceneId, selectedBudget)
      .then((res) => {
        if (isMounted) {
          setAblationData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch ablation study:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentScene, selectedBudget]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Layers size={20} color="var(--accent-cyan)" /> Systematic Ablation Study (Configurations A – G)
          </h1>
          <p className="view-subtitle">
            Evaluating individual perceptual cues (Semantic, Biometric Human Presence, Motion Vectors, Visual Saliency) under controlled computational constraints.
          </p>
        </div>

        {/* Budget Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Evaluation Budget:
          </span>
          {[0.25, 0.50, 0.75].map((b) => (
            <button
              key={b}
              className={`tool-btn ${selectedBudget === b ? 'active' : ''}`}
              onClick={() => setSelectedBudget(b)}
            >
              {(b * 100).toFixed(0)}% Budget
            </button>
          ))}
        </div>
      </div>

      {/* Main Ablation Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Config</th>
                <th>Model Architecture</th>
                <th>Weights (w_s, w_h, w_m, w_v)</th>
                <th>Global PSNR</th>
                <th>Global SSIM</th>
                <th>Face PSNR</th>
                <th>Hands PSNR</th>
                <th>Background PSNR</th>
                <th>FPS</th>
              </tr>
            </thead>
            <tbody>
              {ablationData?.ablation_results.map((item) => {
                const isFull = item.config_code === 'G';
                return (
                  <tr 
                    key={item.config_code}
                    style={{
                      background: isFull ? 'rgba(0, 229, 255, 0.06)' : 'transparent',
                      fontWeight: isFull ? 600 : 400
                    }}
                  >
                    <td>
                      <span className={`telemetry-badge ${isFull ? 'badge-cyan' : 'badge-violet'}`} style={{ fontSize: 11 }}>
                        Config {item.config_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: isFull ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.description}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      [{item.weights.semantic.toFixed(2)}, {item.weights.human.toFixed(2)}, {item.weights.motion.toFixed(2)}, {item.weights.saliency.toFixed(2)}]
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.psnr} dB</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.ssim}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {item.face_psnr} dB
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                      {item.hands_psnr} dB
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {item.background_psnr} dB
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.fps}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Visualization & Evidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Visual Bar Comparison */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={14} color="var(--accent-cyan)" /> Face PSNR vs Background PSNR Tradeoff
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {ablationData?.ablation_results.map((item) => (
              <div key={item.config_code} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    [{item.config_code}] {item.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                    Face: {item.face_psnr} dB | BG: {item.background_psnr} dB
                  </span>
                </div>
                <div style={{ height: 6, display: 'flex', gap: 2, background: 'var(--bg-deep)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(item.face_psnr / 50) * 100}%`, background: 'var(--accent-emerald)' }} title="Face Quality" />
                  <div style={{ width: `${(item.background_psnr / 50) * 100}%`, background: 'var(--text-dim)' }} title="Background Quality" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Analysis */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale size={14} color="var(--accent-amber)" /> Evidence Synthesis & Trade-offs
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {ablationData?.discussion}
            </p>
            <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-deep)', borderRadius: 4, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 4 }}>Key Observations:</div>
              <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
                <li><strong>Config B (Human Only):</strong> Maximizes biometric shape but misses conversational hand articulation.</li>
                <li><strong>Config C (Motion Only):</strong> Focuses aggressively on lips and fingers but drops static facial contours.</li>
                <li><strong>Config G (Full Proposed):</strong> Achieves superior Pareto-optimal perceptual distribution across all communicative regions.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
