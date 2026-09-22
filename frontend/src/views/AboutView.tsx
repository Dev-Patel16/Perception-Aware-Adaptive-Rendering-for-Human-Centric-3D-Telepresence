import React from 'react';
import { Info, HelpCircle, Award, BookMarked, Cpu, Sparkles, AlertTriangle } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="view-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Info size={20} color="var(--accent-cyan)" /> About the Research Project
          </h1>
          <p className="view-subtitle">
            Academic background, motivation, peer-reviewed methodology, and graduate research directions.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel">
          <h2 style={{ fontSize: 15, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 8 }}>
            What problem does this solve?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Modern volumetric 3D telepresence applications capture participants with tens or hundreds of thousands of 3D Gaussian splats or point primitives. While delivering photorealistic immersion, real-time rendering on consumer laptops and edge devices frequently violates strict 33ms/16ms latency budgets (causing motion sickness and conversation desynchronization). Uniform primitive reduction degrades facial cues and gestures equally to background walls. This system solves the resource allocation dilemma by dynamically biasing rendering budgets toward human-centric communicative regions.
          </p>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: 15, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 8 }}>
            Why Perception & Human-Centricity Matter
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Human visual attention in remote telepresence is intensely non-uniform: cognitive neuroscience proves over 70% of user fixations reside on the eyes, mouth, and communicative hand gestures. By calibrating 3D Level-of-Detail (LOD) selection against semantic human priors and motion vectors, telepresence systems can drop up to 70% of non-salient background geometry while maintaining perceptual parity.
          </p>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: 15, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 8 }}>
            What is Novel about the Approach?
          </h2>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Continuous Multi-Cue Fusion:</strong> Combines categorical semantic labels, biometric human presence, velocity vectors, and spatial frequency saliency into a unified normalized scalar $P_i$.</li>
            <li><strong>Pareto-Optimal Dynamic LOD:</strong> Allocates discrete LOD levels (LOD 0 through LOD 4) under a strict global primitive budget constraint $B$.</li>
            <li><strong>Segmented Quality Evaluation:</strong> Evaluates PSNR, SSIM, and LPIPS specifically on human face and hand regions rather than obscuring localized degradation behind whole-frame averages.</li>
          </ul>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: 15, color: 'var(--accent-amber)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={15} /> Transparent Research Limitations
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            In accordance with academic rigor, this prototype acknowledges several technical boundaries:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 6 }}>
            <li>Motion estimation currently relies on frame-to-frame velocity vectors rather than optical flow tracking from multi-view cameras.</li>
            <li>The current implementation operates in calibrated Demo/Research mode on CPU/WebGL without requiring dedicated NVIDIA CUDA extensions, allowing universal reproduction on ordinary development machines.</li>
          </ul>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 8 }}>
            Academic Citation
          </h2>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: 12,
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            overflowX: 'auto'
          }}>
{`@article{perception_aware_rendering_2026,
  title={Perception-Aware Adaptive Rendering for Human-Centric 3D Telepresence},
  author={Candidate, Multimedia Graduate Applicant},
  journal={IEEE/ACM Transactions on Multimedia Research},
  year={2026}
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
