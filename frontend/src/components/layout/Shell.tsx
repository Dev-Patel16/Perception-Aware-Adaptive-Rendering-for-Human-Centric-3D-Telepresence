import React from 'react';
import { ActiveView, Scene } from '../../types';
import { 
  Compass, 
  Camera, 
  Flame, 
  Sliders, 
  BarChart3, 
  FlaskConical, 
  Layers, 
  BookOpen, 
  Database, 
  Info,
  GraduationCap,
  Activity,
  Layers2
} from 'lucide-react';

interface ShellProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  scenes: Scene[];
  currentScene: Scene | null;
  onSelectScene: (sceneId: string) => void;
  backendHealthy: boolean;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  activeView,
  onNavigate,
  scenes,
  currentScene,
  onSelectScene,
  backendHealthy,
  children
}) => {
  const navItems: Array<{ id: ActiveView; label: string; icon: React.ReactNode; section: string }> = [
    { id: 'overview', label: 'Overview', icon: <Compass size={15} />, section: 'Research Overview' },
    { id: 'studio', label: '3D Studio', icon: <Camera size={15} />, section: '3D Studio' },
    { id: 'perception', label: 'Perception Map', icon: <Flame size={15} />, section: 'Perception' },
    { id: 'adaptive', label: 'Adaptive Rendering', icon: <Sliders size={15} />, section: 'Adaptive' },
    { id: 'benchmark', label: 'Benchmark', icon: <BarChart3 size={15} />, section: 'Evaluation' },
    { id: 'experiments', label: 'Experiments', icon: <FlaskConical size={15} />, section: 'Evaluation' },
    { id: 'ablation', label: 'Ablation Study', icon: <Layers size={15} />, section: 'Evaluation' },
    { id: 'method', label: 'Research Method', icon: <BookOpen size={15} />, section: 'Academic' },
    { id: 'dataset', label: 'Dataset / Scenes', icon: <Database size={15} />, section: 'Academic' },
    { id: 'about', label: 'About', icon: <Info size={15} />, section: 'Academic' },
  ];

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="brand-badge">
            <Layers2 size={18} className="brand-icon" />
            <span>PERCEPTION-AWARE RENDERING</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>| 3D Telepresence</span>
          </div>

          <div className="system-status-pill">
            <div className="status-dot" style={{ background: backendHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
            <span>{backendHealthy ? 'FASTAPI BACKEND ONLINE' : 'DISCONNECTED'}</span>
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            padding: '2px 8px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)'
          }}>
            DEMO / LAPTOP MODE
          </div>
        </div>

        <div className="top-bar-right">
          {/* Quick Scene Selector */}
          <select
            value={currentScene?.id || ''}
            onChange={(e) => onSelectScene(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-primary)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px'
            }}
          >
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.primitive_count.toLocaleString()} pts)
              </option>
            ))}
          </select>

          {/* Portfolio Mode Toggle */}
          <button
            className={`btn ${activeView === 'portfolio' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => onNavigate(activeView === 'portfolio' ? 'overview' : 'portfolio')}
          >
            <GraduationCap size={13} />
            {activeView === 'portfolio' ? 'Exit Portfolio Mode' : 'Portfolio Mode'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div>
            <div className="nav-section-title">Navigation Workspace</div>
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <div className="nav-item-icon">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '1px solid var(--border-hairline)',
            paddingTop: 10,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            <div>Target: 60 FPS</div>
            <div>LOD Levels: 5 Tiers</div>
            <div>Primitives: {currentScene?.primitive_count.toLocaleString() || '24,500'}</div>
          </div>
        </aside>

        {/* Main Center Workspace */}
        <main className="workspace">
          {children}
        </main>
      </div>
    </div>
  );
};
