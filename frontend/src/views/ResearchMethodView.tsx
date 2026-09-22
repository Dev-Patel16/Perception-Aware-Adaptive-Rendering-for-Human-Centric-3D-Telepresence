import React, { useState } from 'react';
import { BookOpen, Layers, Cpu, Eye, Activity, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const ResearchMethodView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('perception');

  const nodeDetails: Record<string, { title: string; math: string; desc: string }> = {
    scene: {
      title: '3D Telepresence Scene Input',
      math: '\\mathcal{S} = \\{ (\\mathbf{p}_i, \\mathbf{c}_i, \\Sigma_i, s_i, \\mathbf{v}_i) \\}_{i=1}^N',
      desc: 'Each 3D telepresence primitive contains 3D spatial position p_i, color vector c_i, spatial covariance/splat radius Sigma_i, semantic class s_i, and temporal motion velocity vector v_i.'
    },
    analysis: {
      title: 'Multi-Cue Semantic & Motion Parsing',
      math: '\\mathbf{S} \\in [0, 1]^N, \\quad \\mathbf{H} \\in \\{0, 1\\}^N, \\quad \\mathbf{M} = \\frac{\\|\\mathbf{v}_i\\|_2}{\\max_j \\|\\mathbf{v}_j\\|_2}',
      desc: 'Scene primitives are decomposed into four orthogonal perceptual indicators: categorical semantic importance S, biometric human indicator H, normalized motion dynamics M, and spatial contrast frequency saliency V.'
    },
    perception: {
      title: 'Perceptual Importance Fusion',
      math: 'P_i = \\text{clip}\\left(\\frac{w_s S_i + w_h H_i + w_m M_i + w_v V_i}{w_s + w_h + w_m + w_v}, 0, 1\\right)',
      desc: 'Formulates a convex combination of perceptual cues. Normalizing by the weight sum ensures stability, mapping every 3D primitive to a bounded perceptual importance score P_i in [0, 1].'
    },
    allocation: {
      title: 'Budget-Constrained Dynamic LOD Allocator',
      math: '\\max_{\\mathbf{a} \\in \\{0, 1\\}^N} \\sum_{i=1}^N a_i P_i \\quad \\text{s.t.} \\quad \\sum_{i=1}^N a_i \\le B \\cdot N',
      desc: 'Formulates resource allocation as a knapsack problem with uniform primitive unit costs, solved in O(N log N) by sorting importance scores P_i. Regions with high mean importance are assigned LOD 0 (100% density), while low-importance background regions drop to LOD 3/4.'
    },
    renderer: {
      title: 'Real-Time Adaptive WebGL / Splat Renderer',
      math: '\\text{FPS} = \\min\\left(\\text{FPS}_{target}, \\frac{1000}{t_{base} + \\alpha (N_{active}/N)^\\beta}\\right)',
      desc: 'Renders the retained primitives using WebGL shader pipelines. Evaluates draw calls and frame rate dynamically, ensuring stable target frame rates under resource bottlenecks.'
    },
    evaluation: {
      title: 'Segmented Objective & Perceptual Quality Evaluation',
      math: '\\text{PSNR} = 10 \\log_{10}\\left(\\frac{1}{\\text{MSE}}\\right), \\quad \\text{SSIM} = \\frac{(2\\mu_x\\mu_y + c_1)(2\\sigma_{xy} + c_2)}{(\\mu_x^2 + \\mu_y^2 + c_1)(\\sigma_x^2 + \\sigma_y^2 + c_2)}',
      desc: 'Quality is evaluated both globally and segmented into human-centric (face, communicative hands) vs background regions to test whether perceptual allocation preserves high visual fidelity where human attention is focused.'
    }
  };

  return (
    <div className="view-container" style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <BookOpen size={20} color="var(--accent-cyan)" /> Research Methodology & System Formulation
          </h1>
          <p className="view-subtitle">
            Formal mathematical framework, pipeline architecture, and empirical experimental protocols.
          </p>
        </div>
      </div>

      {/* Interactive System Architecture Diagram */}
      <div className="panel" style={{ padding: 20 }}>
        <div className="panel-title">
          <span>Interactive End-to-End System Architecture (Click a node to inspect)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '24px 12px',
          background: 'var(--bg-deep)',
          borderRadius: 6,
          overflowX: 'auto'
        }}>
          {[
            { id: 'scene', label: '3D Scene / Splat', color: 'var(--text-secondary)' },
            { id: 'analysis', label: 'Scene Analysis', color: 'var(--accent-violet)' },
            { id: 'perception', label: 'Perceptual Model', color: 'var(--accent-cyan)' },
            { id: 'allocation', label: 'Resource Allocator', color: 'var(--accent-amber)' },
            { id: 'renderer', label: 'Adaptive Renderer', color: 'var(--accent-emerald)' },
            { id: 'evaluation', label: 'Quality Evaluation', color: 'var(--accent-rose)' }
          ].map((node, i, arr) => (
            <React.Fragment key={node.id}>
              <div
                onClick={() => setSelectedNode(node.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: selectedNode === node.id ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  border: `1.5px solid ${selectedNode === node.id ? node.color : 'var(--border-subtle)'}`,
                  boxShadow: selectedNode === node.id ? `0 0 14px ${node.color}33` : 'none',
                  transition: 'all 0.15s ease',
                  minWidth: 120
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: node.color }}>
                  {node.label}
                </div>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={14} color="var(--border-medium)" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Selected Node Deep Dive */}
        {nodeDetails[selectedNode] && (
          <div style={{
            marginTop: 16,
            background: 'var(--bg-surface)',
            padding: 16,
            borderRadius: 6,
            borderLeft: '4px solid var(--accent-cyan)'
          }}>
            <h3 style={{ fontSize: 14, color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {nodeDetails[selectedNode].title}
            </h3>
            <code style={{
              display: 'block',
              background: 'var(--bg-deep)',
              padding: '8px 12px',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              margin: '8px 0',
              color: 'var(--text-primary)'
            }}>
              {nodeDetails[selectedNode].math}
            </code>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {nodeDetails[selectedNode].desc}
            </p>
          </div>
        )}
      </div>

      {/* Formal Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-title"><span>1. Problem Statement & Motivation</span></div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Real-time human-centric 3D telepresence systems (e.g. volumetric video, 3D Gaussian Splatting) require rendering millions of primitives per second. On edge clients or bandwidth-constrained connections, full-resolution rendering drops frame rates below the required 30-60 FPS telepresence threshold.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 8 }}>
            Uniform point/Gaussian decimation causes severe degradation on critical communicative features (eyes, lips, gesturing fingers). By exploiting human visual perception, we can allocate rendering budgets non-uniformly.
          </p>
        </div>

        <div className="panel">
          <div className="panel-title"><span>2. Dynamic LOD Strategy</span></div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Pruning is structured across 5 discrete Level-of-Detail tiers:
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 6, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
            <li><strong>LOD 0 (100%):</strong> Retains full primitive geometry (Face, Eyes, Mouth).</li>
            <li><strong>LOD 1 (75%):</strong> High-fidelity sampling (Communicative Hands).</li>
            <li><strong>LOD 2 (50%):</strong> Medium sampling for torso and clothing.</li>
            <li><strong>LOD 3 (25%):</strong> Coarse approximation for foreground furniture.</li>
            <li><strong>LOD 4 (10%):</strong> Sparse ambient representation for distant background walls.</li>
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><span>3. Limitations & Future Research Directions</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
          <div style={{ background: 'var(--bg-deep)', padding: 12, borderRadius: 4 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 4 }}>Gaze & Foveation</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Current implementation utilizes fixed biometric priors. Future work will integrate hardware eye-tracking for dynamic real-time foveated rendering.
            </p>
          </div>
          <div style={{ background: 'var(--bg-deep)', padding: 12, borderRadius: 4 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 4 }}>Neural Radiance Caching</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Pruned background regions could be supplemented by neural background priors to preserve perceived depth without high primitive counts.
            </p>
          </div>
          <div style={{ background: 'var(--bg-deep)', padding: 12, borderRadius: 4 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: 4 }}>Bandwidth Telepresence</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Extending the perception-aware budget allocator directly to the network transport layer for adaptive progressive point streaming over WebRTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
