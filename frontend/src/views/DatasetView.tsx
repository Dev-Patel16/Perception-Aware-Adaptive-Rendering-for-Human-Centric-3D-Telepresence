import React, { useState, useEffect } from 'react';
import { Scene } from '../types';
import { fetchScenes } from '../services/api';
import { Database, CheckCircle, Play, Layers, Box, Cpu, FileText } from 'lucide-react';

interface DatasetViewProps {
  currentScene: Scene | null;
  onSelectScene: (sceneId: string) => void;
}

export const DatasetView: React.FC<DatasetViewProps> = ({ currentScene, onSelectScene }) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchScenes()
      .then((data) => {
        setScenes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load scenes:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Database size={20} color="var(--accent-cyan)" /> Telepresence Datasets & Scene Manager
          </h1>
          <p className="view-subtitle">
            Authentic 3D telepresence scenes containing calibrated 3D coordinates, colors, semantic labels, velocity vectors, and visual saliency.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {scenes.map((scene) => {
          const isSelected = currentScene?.id === scene.id;
          return (
            <div
              key={scene.id}
              className="panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                boxShadow: isSelected ? '0 0 16px rgba(0, 229, 255, 0.15)' : 'var(--shadow-panel)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span className={`telemetry-badge ${isSelected ? 'badge-cyan' : 'badge-emerald'}`}>
                    {scene.source_type.toUpperCase()}
                  </span>
                  {isSelected && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      <CheckCircle size={13} /> ACTIVE SCENE
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {scene.name}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
                  {scene.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <div style={{ background: 'var(--bg-deep)', padding: 6, borderRadius: 4 }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Primitives:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{scene.primitive_count.toLocaleString()}</strong>
                  </div>
                  <div style={{ background: 'var(--bg-deep)', padding: 6, borderRadius: 4 }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Semantic Classes:</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{scene.semantic_classes?.length || 6} Classes</strong>
                  </div>
                </div>

                {scene.bounding_box && (
                  <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    BBox: [{scene.bounding_box.min.join(', ')}] to [{scene.bounding_box.max.join(', ')}]
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <button
                  className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => onSelectScene(scene.id)}
                  style={{ width: '100%' }}
                >
                  {isSelected ? 'Currently Loaded in Viewport' : 'Load Scene into Viewport'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
