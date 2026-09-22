import React, { useState, useRef, useEffect } from 'react';
import { ScenePrimitives } from '../../types';
import { ThreeViewport } from './ThreeViewport';
import { Columns, SplitSquareVertical } from 'lucide-react';

interface SplitViewportProps {
  primitives: ScenePrimitives | null;
  baselineMask?: number[] | null;
  proposedMask?: number[] | null;
  importanceMap?: number[] | null;
  budgetPercent?: number;
}

export const SplitViewport: React.FC<SplitViewportProps> = ({
  primitives,
  baselineMask,
  proposedMask,
  importanceMap,
  budgetPercent = 50
}) => {
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const baselineCount = baselineMask ? baselineMask.reduce((a, b) => a + b, 0) : (primitives?.primitive_count || 0);
  const proposedCount = proposedMask ? proposedMask.reduce((a, b) => a + b, 0) : (primitives?.primitive_count || 0);

  return (
    <div className="panel" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Split Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            SYNCHRONIZED A/B PERCEPTION BENCHMARK
          </span>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <span className="telemetry-badge badge-rose">BASELINE (UNIFORM): {baselineCount.toLocaleString()} pts</span>
            <span className="telemetry-badge badge-cyan">PROPOSED (PERCEPTION-AWARE): {proposedCount.toLocaleString()} pts</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            className={`tool-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Draggable Split Slider View"
          >
            <SplitSquareVertical size={13} /> Split Slider
          </button>
          <button 
            className={`tool-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => setViewMode('side-by-side')}
            title="Side-by-Side Dual Viewports"
          >
            <Columns size={13} /> Side-by-Side
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {viewMode === 'side-by-side' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
            {/* Left: Baseline */}
            <div style={{ position: 'relative', borderRight: '1px solid var(--border-subtle)' }}>
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 10,
                background: 'rgba(14, 19, 29, 0.9)',
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: 'var(--accent-rose)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600
              }}>
                BASELINE: UNIFORM ({budgetPercent}% Budget)
              </div>
              <ThreeViewport primitives={primitives} activeMask={baselineMask} colorMode="natural" />
            </div>

            {/* Right: Proposed */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 10,
                background: 'rgba(14, 19, 29, 0.9)',
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid rgba(0, 229, 255, 0.4)',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600
              }}>
                PROPOSED: PERCEPTION-AWARE ({budgetPercent}% Budget)
              </div>
              <ThreeViewport primitives={primitives} activeMask={proposedMask} importanceMap={importanceMap} colorMode="natural" />
            </div>
          </div>
        ) : (
          /* Draggable Split View */
          <div style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none' }}>
            {/* Base Layer: Proposed Perception-Aware */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{
                position: 'absolute',
                top: 14,
                right: 14,
                zIndex: 10,
                background: 'rgba(14, 19, 29, 0.85)',
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600
              }}>
                PROPOSED: PERCEPTION-AWARE
              </div>
              <ThreeViewport primitives={primitives} activeMask={proposedMask} importanceMap={importanceMap} colorMode="natural" />
            </div>

            {/* Clipped Top Layer: Baseline Uniform */}
            <div style={{
              position: 'absolute',
              inset: 0,
              clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
              borderRight: '1px solid var(--accent-cyan)'
            }}>
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 10,
                background: 'rgba(14, 19, 29, 0.85)',
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600
              }}>
                BASELINE: UNIFORM
              </div>
              <ThreeViewport primitives={primitives} activeMask={baselineMask} colorMode="natural" />
            </div>

            {/* Draggable Divider Handle */}
            <div 
              className="split-divider" 
              style={{ left: `${splitPos}%` }}
              onMouseDown={handleMouseDown}
            >
              <div className="split-handle">
                <SplitSquareVertical size={16} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
