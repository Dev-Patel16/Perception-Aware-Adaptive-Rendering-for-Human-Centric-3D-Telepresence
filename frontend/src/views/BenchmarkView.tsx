import React, { useState, useEffect } from 'react';
import { Scene, BenchmarkResponse, BenchmarkCurve } from '../types';
import { fetchBenchmark } from '../services/api';
import { 
  BarChart3, 
  Download, 
  Filter, 
  TrendingUp, 
  Zap, 
  Eye, 
  Layers, 
  HelpCircle,
  Clock
} from 'lucide-react';

interface BenchmarkViewProps {
  currentScene: Scene | null;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ currentScene }) => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMetric, setSelectedMetric] = useState<'psnr' | 'ssim' | 'fps' | 'latency_ms' | 'face_vs_bg'>('psnr');
  const [activeMethods, setActiveMethods] = useState<Record<string, boolean>>({
    uniform_baseline: true,
    distance_lod: true,
    motion_aware: true,
    human_centric: true,
    proposed_perception_aware: true
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const sceneId = currentScene?.id || 'telepresence_host_01';

    fetchBenchmark(sceneId)
      .then((res) => {
        if (isMounted) {
          setBenchmarkData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load benchmark data:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentScene]);

  const methodColors: Record<string, string> = {
    uniform_baseline: '#f43f5e',
    distance_lod: '#a855f7',
    motion_aware: '#f59e0b',
    human_centric: '#38bdf8',
    proposed_perception_aware: '#00e5ff'
  };

  const toggleMethod = (methodId: string) => {
    setActiveMethods((prev) => ({ ...prev, [methodId]: !prev[methodId] }));
  };

  // Export benchmark data as JSON
  const handleExportJson = () => {
    if (!benchmarkData) return;
    const blob = new Blob([JSON.stringify(benchmarkData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_${benchmarkData.scene_id}.json`;
    a.click();
  };

  // Export benchmark data as CSV
  const handleExportCsv = () => {
    if (!benchmarkData) return;
    let csv = 'Method,Budget(%),ActivePrimitives,PSNR(dB),SSIM,LPIPS,FPS,Latency(ms),FacePSNR(dB),BackgroundPSNR(dB)\n';
    Object.entries(benchmarkData.results).forEach(([mId, curve]) => {
      curve.data_points.forEach((pt) => {
        csv += `${curve.name},${pt.budget_percent},${pt.active_primitives},${pt.psnr},${pt.ssim},${pt.lpips},${pt.fps},${pt.latency_ms},${pt.face_psnr},${pt.background_psnr}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_${benchmarkData.scene_id}.csv`;
    a.click();
  };

  // Compute SVG Chart Coordinates
  const renderChart = () => {
    if (!benchmarkData) return null;

    const width = 740;
    const height = 340;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const budgets = benchmarkData.budgets.map((b) => b * 100);
    const minX = 15;
    const maxX = 100;

    let minY = 0;
    let maxY = 50;
    let yUnit = 'dB';

    if (selectedMetric === 'psnr') {
      minY = 20; maxY = 45; yUnit = 'dB';
    } else if (selectedMetric === 'ssim') {
      minY = 0.85; maxY = 1.00; yUnit = '';
    } else if (selectedMetric === 'fps') {
      minY = 20; maxY = 70; yUnit = 'FPS';
    } else if (selectedMetric === 'latency_ms') {
      minY = 4; maxY = 22; yUnit = 'ms';
    } else if (selectedMetric === 'face_vs_bg') {
      minY = 20; maxY = 50; yUnit = 'dB';
    }

    const scaleX = (val: number) => padding.left + ((val - minX) / (maxX - minX)) * chartW;
    const scaleY = (val: number) => padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
          const val = minY + t * (maxY - minY);
          const y = scaleY(val);
          return (
            <g key={t}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)">
                {selectedMetric === 'ssim' ? val.toFixed(3) : val.toFixed(1)} {yUnit}
              </text>
            </g>
          );
        })}

        {/* Vertical Grid lines (Budgets) */}
        {budgets.map((b) => {
          const x = scaleX(b);
          return (
            <g key={b}>
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + chartH} stroke="rgba(255,255,255,0.06)" />
              <text x={x} y={padding.top + chartH + 18} textAnchor="middle" fill="var(--text-secondary)" fontSize={10} fontFamily="var(--font-mono)">
                {b}%
              </text>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text x={padding.left + chartW / 2} y={padding.top + chartH + 38} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
          Rendering Budget Constraint (B)
        </text>

        {/* Curves for active methods */}
        {Object.entries(benchmarkData.results).map(([mId, curve]) => {
          if (!activeMethods[mId]) return null;
          const color = methodColors[mId] || '#fff';

          // Points path
          const pts = curve.data_points.map((pt) => {
            const x = scaleX(pt.budget_percent);
            let yVal = (pt as any)[selectedMetric];
            if (selectedMetric === 'face_vs_bg') yVal = pt.face_psnr;
            const y = scaleY(yVal);
            return `${x},${y}`;
          });
          const pathD = `M ${pts.join(' L ')}`;

          return (
            <g key={mId}>
              <path d={pathD} fill="none" stroke={color} strokeWidth={mId === 'proposed_perception_aware' ? 3 : 1.8} />
              {curve.data_points.map((pt) => {
                const cx = scaleX(pt.budget_percent);
                let yVal = (pt as any)[selectedMetric];
                if (selectedMetric === 'face_vs_bg') yVal = pt.face_psnr;
                const cy = scaleY(yVal);
                return (
                  <circle
                    key={pt.budget}
                    cx={cx}
                    cy={cy}
                    r={mId === 'proposed_perception_aware' ? 4.5 : 3.5}
                    fill="var(--bg-deep)"
                    stroke={color}
                    strokeWidth={2}
                  >
                    <title>{`${curve.name} @ ${pt.budget_percent}%: ${yVal} ${yUnit}`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="view-container">
      {/* Benchmark Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <BarChart3 size={20} color="var(--accent-cyan)" /> Comparative Benchmark Suite
          </h1>
          <p className="view-subtitle">
            Controlled empirical evaluation across 5 rendering strategies over computational budget curves (15% - 100%).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportCsv}>
            <Download size={13} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportJson}>
            <Download size={13} /> Export JSON
          </button>
        </div>
      </div>

      {/* Main Benchmark Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Chart View Area */}
        <div className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
          {/* Metric Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                className={`tool-btn ${selectedMetric === 'psnr' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('psnr')}
              >
                PSNR (dB)
              </button>
              <button 
                className={`tool-btn ${selectedMetric === 'ssim' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('ssim')}
              >
                SSIM Index
              </button>
              <button 
                className={`tool-btn ${selectedMetric === 'face_vs_bg' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('face_vs_bg')}
              >
                Face Region PSNR
              </button>
              <button 
                className={`tool-btn ${selectedMetric === 'fps' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('fps')}
              >
                Render FPS
              </button>
              <button 
                className={`tool-btn ${selectedMetric === 'latency_ms' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('latency_ms')}
              >
                Frame Time (ms)
              </button>
            </div>

            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              CALIBRATED EMPIRICAL DATA
            </span>
          </div>

          {/* SVG Chart */}
          <div style={{ flex: 1, minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Computing multi-budget curve evaluations...
              </div>
            ) : (
              renderChart()
            )}
          </div>
        </div>

        {/* Method Filter Legend & Findings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-title" style={{ fontSize: 11, marginBottom: 8 }}>
              <span>Filter Strategies</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {benchmarkData && benchmarkData.methods.map((m) => {
                const color = methodColors[m.id];
                const isActive = activeMethods[m.id];
                return (
                  <div 
                    key={m.id}
                    onClick={() => toggleMethod(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: isActive ? 'var(--bg-panel)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--border-subtle)' : 'transparent'}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: isActive ? 1 : 0.3 }} />
                      <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.name}</span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                      {isActive ? 'SHOWN' : 'HIDDEN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scientific Finding Callout */}
          <div className="panel" style={{ padding: 14, background: 'rgba(0, 229, 255, 0.03)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>
              <TrendingUp size={13} /> Empirical Validation
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {benchmarkData?.summary.hypothesis_evaluation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
