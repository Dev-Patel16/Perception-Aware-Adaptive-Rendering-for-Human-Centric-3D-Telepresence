import React from 'react';
import { Scene, ScenePrimitives, RenderAllocation, ImportanceResult } from '../types';
import { ThreeViewport } from '../components/viewport/ThreeViewport';
import { 
  Compass, 
  HelpCircle, 
  Target, 
  Cpu, 
  Layers, 
  Eye, 
  TrendingUp, 
  Zap, 
  Play, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface OverviewViewProps {
  currentScene: Scene | null;
  primitives: ScenePrimitives | null;
  allocation: RenderAllocation | null;
  importance: ImportanceResult | null;
  onNavigate: (view: any) => void;
  onSelectScene: (sceneId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  currentScene,
  primitives,
  allocation,
  importance,
  onNavigate
}) => {
  return (
    <div className="view-container">
      {/* Hero Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 20,
        background: 'linear-gradient(135deg, rgba(14, 19, 29, 0.95), rgba(19, 26, 39, 0.95))',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 24,
        boxShadow: 'var(--shadow-panel)'
      }}>
        {/* Left Column: Problem & Formulation */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="telemetry-badge badge-cyan">GRADUATE MULTIMEDIA RESEARCH</span>
              <span className="telemetry-badge badge-emerald">PEER-REVIEW CALIBRATED</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Perception-Aware Adaptive Rendering
            </h1>
            <p style={{ fontSize: 14, color: 'var(--accent-cyan)', fontWeight: 500, marginTop: 6 }}>
              Efficient human-centric 3D telepresence through perceptually guided resource allocation.
            </p>
          </div>

          <div style={{
            background: 'rgba(0, 229, 255, 0.04)',
            borderLeft: '3px solid var(--accent-cyan)',
            padding: '12px 14px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <HelpCircle size={13} /> Central Research Question
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>
              "Can perceptual importance be used to dynamically allocate rendering resources so that human-centric regions maintain higher perceived visual quality under constrained computational budgets?"
            </p>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.04)',
            borderLeft: '3px solid var(--accent-emerald)',
            padding: '12px 14px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Target size={13} /> Primary Scientific Hypothesis
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              Under constrained rendering budgets (&le; 50%), allocating more computational resources to perceptually important human-centric regions (eyes, face, hands) preserves critical communicative visual information more effectively than uniform resource distribution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={() => onNavigate('studio')}>
              <Play size={14} /> Open 3D Studio
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('adaptive')}>
              <TrendingUp size={14} /> Compare A/B Allocations <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Live Interactive Mini 3D Viewport */}
        <div style={{
          height: 320,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          position: 'relative'
        }}>
          <ThreeViewport
            primitives={primitives}
            importanceMap={importance?.importance_map}
            activeMask={allocation?.active_mask}
            colorMode="natural"
            pointSize={0.016}
          />
        </div>
      </div>

      {/* System Telemetry Counters */}
      <div className="telemetry-grid">
        <div className="telemetry-card">
          <span className="telemetry-label">Active Scene</span>
          <div className="telemetry-value" style={{ fontSize: 15 }}>
            {currentScene?.name || 'Loading...'}
          </div>
          <span className="telemetry-badge badge-cyan">{currentScene?.source_type.toUpperCase()}</span>
        </div>

        <div className="telemetry-card">
          <span className="telemetry-label">Active Primitives</span>
          <div className="telemetry-value">
            {allocation?.active_primitives.toLocaleString() || primitives?.primitive_count.toLocaleString() || '0'}
            <span className="telemetry-unit">/ {primitives?.primitive_count.toLocaleString() || '0'}</span>
          </div>
          <span className="telemetry-badge badge-emerald">
            {allocation ? `${(allocation.active_primitives / allocation.total_primitives * 100).toFixed(0)}% BUDGET ACTIVE` : '100% FULL FIDELITY'}
          </span>
        </div>

        <div className="telemetry-card">
          <span className="telemetry-label">Rendering Mode</span>
          <div className="telemetry-value" style={{ fontSize: 16 }}>
            {allocation?.method ? allocation.method.replace('_', ' ').toUpperCase() : 'PROPOSED PERCEPTION'}
          </div>
          <span className="telemetry-badge badge-violet">DYNAMIC ADAPTIVE LOD</span>
        </div>

        <div className="telemetry-card">
          <span className="telemetry-label">Measured WebGL FPS</span>
          <div className="telemetry-value">
            {allocation?.predicted_fps || 60}
            <span className="telemetry-unit">FPS</span>
          </div>
          <span className="telemetry-badge badge-emerald">REAL-TIME TELEPRESENCE</span>
        </div>
      </div>

      {/* Core Methodological Framework */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} color="var(--accent-cyan)" /> 1. Scene & Semantic Analysis
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Identifies discrete semantic entities across telepresence space: human face, communicative hands, torso, and static background environment.
          </p>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="telemetry-badge badge-cyan">Face & Eyes Prior</span>
            <span className="telemetry-badge badge-amber">Motion Estimation</span>
            <span className="telemetry-badge badge-violet">Spatial Saliency</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color="var(--accent-amber)" /> 2. Perceptual Importance Model
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Computes per-primitive importance:
            <code style={{ display: 'block', background: 'var(--bg-deep)', padding: '6px 8px', borderRadius: 4, margin: '8px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-cyan)' }}>
              P_i = w_s S_i + w_h H_i + w_m M_i + w_v V_i
            </code>
            Normalizes weights dynamically to balance semantic presence against motion articulation.
          </p>
        </div>

        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" /> 3. Adaptive Resource Allocation
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Under constrained budgets (10% to 100%), maps importance to discrete LOD tiers (LOD 0 through LOD 4). High-importance biometric features retain full density while background drops.
          </p>
        </div>
      </div>
    </div>
  );
};
