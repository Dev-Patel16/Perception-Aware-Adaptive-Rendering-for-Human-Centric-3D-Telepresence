import React, { useState, useEffect } from 'react';
import { ActiveView, Scene, ScenePrimitives, PerceptionWeights, ImportanceResult, RenderAllocation } from './types';
import { fetchScenes, fetchScenePrimitives, analyzePerception, allocateRender } from './services/api';
import { Shell } from './components/layout/Shell';

// Views
import { OverviewView } from './views/OverviewView';
import { StudioView } from './views/StudioView';
import { PerceptionMapView } from './views/PerceptionMapView';
import { AdaptiveRenderingView } from './views/AdaptiveRenderingView';
import { BenchmarkView } from './views/BenchmarkView';
import { ExperimentsView } from './views/ExperimentsView';
import { AblationStudyView } from './views/AblationStudyView';
import { ResearchMethodView } from './views/ResearchMethodView';
import { DatasetView } from './views/DatasetView';
import { AboutView } from './views/AboutView';
import { PortfolioModeView } from './views/PortfolioModeView';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [primitives, setPrimitives] = useState<ScenePrimitives | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);

  // Global Perceptual Weights
  const [weights, setWeights] = useState<PerceptionWeights>({
    semantic_weight: 0.35,
    human_weight: 0.35,
    motion_weight: 0.15,
    saliency_weight: 0.15
  });

  // Global Engine Results
  const [importance, setImportance] = useState<ImportanceResult | null>(null);
  const [allocation, setAllocation] = useState<RenderAllocation | null>(null);

  // 1. Initial Load: Fetch scenes
  useEffect(() => {
    fetchScenes()
      .then((data) => {
        setScenes(data);
        if (data.length > 0) {
          setCurrentScene(data[0]);
        }
        setBackendHealthy(true);
      })
      .catch((err) => {
        console.error('Backend connection check failed:', err);
        setBackendHealthy(false);
      });
  }, []);

  // 2. Fetch primitives and run initial perception & allocation on scene change
  useEffect(() => {
    if (!currentScene) return;

    let isMounted = true;

    // Fetch primitives
    fetchScenePrimitives(currentScene.id)
      .then((primData) => {
        if (!isMounted) return;
        setPrimitives(primData);

        // Run perception analysis
        return analyzePerception(currentScene.id, weights);
      })
      .then((impData) => {
        if (!isMounted || !impData) return;
        setImportance(impData);

        // Run render allocation at default 50% budget
        return allocateRender(currentScene.id, 'proposed_perception_aware', 0.50, 60, weights);
      })
      .then((allocData) => {
        if (!isMounted || !allocData) return;
        setAllocation(allocData);
        setBackendHealthy(true);
      })
      .catch((err) => {
        console.error('Scene load error:', err);
        if (isMounted) setBackendHealthy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentScene]);

  // 3. Re-calculate when weights change
  const handleWeightsChange = (newWeights: PerceptionWeights) => {
    setWeights(newWeights);
    if (!currentScene) return;

    analyzePerception(currentScene.id, newWeights)
      .then((impData) => {
        setImportance(impData);
        return allocateRender(currentScene.id, 'proposed_perception_aware', allocation?.rendering_budget || 0.50, 60, newWeights);
      })
      .then((allocData) => {
        setAllocation(allocData);
      })
      .catch((err) => console.error('Weight update error:', err));
  };

  const handleSelectScene = (sceneId: string) => {
    const s = scenes.find((item) => item.id === sceneId);
    if (s) setCurrentScene(s);
  };

  return (
    <Shell
      activeView={activeView}
      onNavigate={setActiveView}
      scenes={scenes}
      currentScene={currentScene}
      onSelectScene={handleSelectScene}
      backendHealthy={backendHealthy}
    >
      {activeView === 'overview' && (
        <OverviewView
          currentScene={currentScene}
          primitives={primitives}
          allocation={allocation}
          importance={importance}
          onNavigate={setActiveView}
          onSelectScene={handleSelectScene}
        />
      )}

      {activeView === 'studio' && (
        <StudioView
          currentScene={currentScene}
          primitives={primitives}
          allocation={allocation}
          importance={importance}
        />
      )}

      {activeView === 'perception' && (
        <PerceptionMapView
          currentScene={currentScene}
          primitives={primitives}
          importance={importance}
          allocation={allocation}
          weights={weights}
          onWeightsChange={handleWeightsChange}
        />
      )}

      {activeView === 'adaptive' && (
        <AdaptiveRenderingView
          currentScene={currentScene}
          primitives={primitives}
          importance={importance}
          weights={weights}
        />
      )}

      {activeView === 'benchmark' && (
        <BenchmarkView currentScene={currentScene} />
      )}

      {activeView === 'experiments' && (
        <ExperimentsView currentScene={currentScene} weights={weights} />
      )}

      {activeView === 'ablation' && (
        <AblationStudyView currentScene={currentScene} />
      )}

      {activeView === 'method' && (
        <ResearchMethodView />
      )}

      {activeView === 'dataset' && (
        <DatasetView currentScene={currentScene} onSelectScene={handleSelectScene} />
      )}

      {activeView === 'about' && (
        <AboutView />
      )}

      {activeView === 'portfolio' && (
        <PortfolioModeView
          currentScene={currentScene}
          primitives={primitives}
          allocation={allocation}
          importance={importance}
          onNavigate={setActiveView}
        />
      )}
    </Shell>
  );
};
