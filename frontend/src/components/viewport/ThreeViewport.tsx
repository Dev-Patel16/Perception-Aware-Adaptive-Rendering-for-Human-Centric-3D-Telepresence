import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ScenePrimitives } from '../../types';
import { 
  Camera, 
  RotateCcw, 
  Maximize2, 
  Grid, 
  Box, 
  Eye, 
  Flame, 
  Layers, 
  Activity,
  Sun
} from 'lucide-react';

interface ThreeViewportProps {
  primitives: ScenePrimitives | null;
  importanceMap?: number[] | null;
  activeMask?: number[] | null;
  colorMode?: 'natural' | 'heatmap' | 'semantic' | 'motion';
  showBoundingBoxes?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  pointSize?: number;
  onFpsUpdate?: (fps: number, frameTimeMs: number) => void;
  interactive?: boolean;
  cameraPreset?: 'front' | 'face' | 'hands' | 'overview';
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  primitives,
  importanceMap,
  activeMask,
  colorMode = 'natural',
  showBoundingBoxes = false,
  showGrid = true,
  showAxes = true,
  pointSize = 0.015,
  onFpsUpdate,
  interactive = true,
  cameraPreset = 'front'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Internal state
  const [measuredFps, setMeasuredFps] = useState<number>(60);
  const [measuredFrameTime, setMeasuredFrameTime] = useState<number>(16.6);
  const [internalColorMode, setInternalColorMode] = useState<'natural' | 'heatmap' | 'semantic' | 'motion'>(colorMode);
  const [internalShowBoxes, setInternalShowBoxes] = useState<boolean>(showBoundingBoxes);
  const [internalShowGrid, setInternalShowGrid] = useState<boolean>(showGrid);

  // Synchronize internal state with props
  useEffect(() => {
    setInternalColorMode(colorMode);
  }, [colorMode]);

  useEffect(() => {
    setInternalShowBoxes(showBoundingBoxes);
  }, [showBoundingBoxes]);

  useEffect(() => {
    setInternalShowGrid(showGrid);
  }, [showGrid]);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const boxesGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  
  // Camera control drag state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 1.8, theta: 0, phi: Math.PI / 2 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0.2, 0.8));

  // Helper: map normalized value [0, 1] to Turbo/Jet-like perceptual heatmap color
  const getHeatmapColor = (val: number): [number, number, number] => {
    const v = Math.min(Math.max(val, 0), 1);
    if (v < 0.25) {
      const t = v / 0.25;
      return [0.1 + 0.1 * t, 0.2 + 0.3 * t, 0.6 + 0.3 * t]; // Deep blue to cyan
    } else if (v < 0.5) {
      const t = (v - 0.25) / 0.25;
      return [0.2, 0.5 + 0.4 * t, 0.9 - 0.4 * t]; // Cyan to emerald
    } else if (v < 0.75) {
      const t = (v - 0.5) / 0.25;
      return [0.2 + 0.7 * t, 0.9, 0.5 - 0.5 * t]; // Emerald to amber
    } else {
      const t = (v - 0.75) / 0.25;
      return [0.9 + 0.1 * t, 0.9 - 0.7 * t, 0.1]; // Amber to crimson
    }
  };

  // Helper: discrete semantic class colors
  const getSemanticColor = (classId: number): [number, number, number] => {
    switch (classId) {
      case 0: return [0.22, 0.26, 0.32]; // Background: cool slate
      case 1: return [0.38, 0.34, 0.30]; // Furniture: bronze/wood
      case 2: return [0.18, 0.38, 0.65]; // Body: navy blue
      case 3: return [0.92, 0.58, 0.20]; // Hands: warm amber
      case 4: return [0.95, 0.80, 0.30]; // Face: bright gold
      case 5: return [0.98, 0.25, 0.55]; // Eyes/Mouth: vivid magenta
      default: return [0.5, 0.5, 0.5];
    }
  };

  // Update Geometry & Point Colors
  const updatePointsGeometry = useCallback(() => {
    if (!primitives || !sceneRef.current) return;

    const n = primitives.primitive_count;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      // Check active mask: if pruned, move to infinity or hide
      const isActive = !activeMask || activeMask[i] === 1;
      
      if (isActive) {
        positions[i * 3] = primitives.positions[i][0];
        positions[i * 3 + 1] = primitives.positions[i][1];
        positions[i * 3 + 2] = primitives.positions[i][2];
      } else {
        // Pruned primitive: hide beneath ground or off-screen
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -999;
        positions[i * 3 + 2] = 0;
      }

      // Color selection
      let r = 0, g = 0, b = 0;
      if (internalColorMode === 'heatmap') {
        const imp = importanceMap ? (importanceMap[i] ?? 0.5) : primitives.saliencies[i];
        [r, g, b] = getHeatmapColor(imp);
      } else if (internalColorMode === 'semantic') {
        [r, g, b] = getSemanticColor(primitives.semantics[i]);
      } else if (internalColorMode === 'motion') {
        const mv = primitives.motion_vectors[i];
        const speed = Math.sqrt(mv[0] * mv[0] + mv[1] * mv[1] + mv[2] * mv[2]);
        const normSpeed = Math.min(speed / 0.05, 1.0);
        [r, g, b] = getHeatmapColor(normSpeed);
      } else {
        // Natural colors
        r = primitives.colors[i][0];
        g = primitives.colors[i][1];
        b = primitives.colors[i][2];
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    if (!pointsRef.current) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Circular splat particle texture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);

      const material = new THREE.PointsMaterial({
        size: pointSize,
        vertexColors: true,
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      const points = new THREE.Points(geometry, material);
      sceneRef.current.add(points);
      pointsRef.current = points;
    } else {
      const geom = pointsRef.current.geometry;
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.attributes.position.needsUpdate = true;
      geom.attributes.color.needsUpdate = true;
      if (pointsRef.current.material instanceof THREE.PointsMaterial) {
        pointsRef.current.material.size = pointSize;
      }
    }
  }, [primitives, importanceMap, activeMask, internalColorMode, pointSize]);

  // Set Camera Preset
  const applyCameraPreset = useCallback((preset: 'front' | 'face' | 'hands' | 'overview') => {
    if (!cameraRef.current) return;

    if (preset === 'face') {
      cameraSphericalRef.current = { radius: 0.65, theta: 0, phi: Math.PI / 2.05 };
      cameraTargetRef.current.set(0, 0.44, 0.82);
    } else if (preset === 'hands') {
      cameraSphericalRef.current = { radius: 0.8, theta: 0.2, phi: Math.PI / 1.9 };
      cameraTargetRef.current.set(0, -0.22, 0.55);
    } else if (preset === 'overview') {
      cameraSphericalRef.current = { radius: 2.6, theta: 0.6, phi: Math.PI / 2.4 };
      cameraTargetRef.current.set(0, 0.2, 1.0);
    } else {
      // Front
      cameraSphericalRef.current = { radius: 1.8, theta: 0, phi: Math.PI / 2 };
      cameraTargetRef.current.set(0, 0.2, 0.8);
    }

    const { radius, theta, phi } = cameraSphericalRef.current;
    const target = cameraTargetRef.current;
    cameraRef.current.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(target);
  }, []);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    applyCameraPreset(cameraPreset);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.6);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    // 5. Grid Helper
    const grid = new THREE.GridHelper(4, 20, 0x00e5ff, 0x1e293b);
    grid.position.y = -0.8;
    scene.add(grid);
    gridHelperRef.current = grid;
    grid.visible = internalShowGrid;

    // 6. Axes Helper
    const axes = new THREE.AxesHelper(0.5);
    axes.position.set(-1.4, -0.79, 0.5);
    scene.add(axes);
    axesHelperRef.current = axes;
    axes.visible = showAxes;

    // 7. Bounding Boxes Group
    const boxesGroup = new THREE.Group();
    // Face box
    const faceGeo = new THREE.BoxGeometry(0.28, 0.32, 0.28);
    const faceWire = new THREE.WireframeGeometry(faceGeo);
    const faceLine = new THREE.LineSegments(faceWire, new THREE.LineBasicMaterial({ color: 0x00e5ff }));
    faceLine.position.set(0, 0.44, 0.82);
    boxesGroup.add(faceLine);

    // Body box
    const bodyGeo = new THREE.BoxGeometry(0.72, 0.68, 0.45);
    const bodyWire = new THREE.WireframeGeometry(bodyGeo);
    const bodyLine = new THREE.LineSegments(bodyWire, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
    bodyLine.position.set(0, -0.1, 0.85);
    boxesGroup.add(bodyLine);

    // Hands boxes
    const handGeo = new THREE.BoxGeometry(0.22, 0.20, 0.22);
    const handWire = new THREE.WireframeGeometry(handGeo);
    const rightHandLine = new THREE.LineSegments(handWire, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
    rightHandLine.position.set(0.36, -0.22, 0.54);
    const leftHandLine = new THREE.LineSegments(handWire, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
    leftHandLine.position.set(-0.34, -0.26, 0.58);
    boxesGroup.add(rightHandLine);
    boxesGroup.add(leftHandLine);

    scene.add(boxesGroup);
    boxesGroupRef.current = boxesGroup;
    boxesGroup.visible = internalShowBoxes;

    // Animation & FPS measurement loop
    let animationFrameId: number;
    let frameCount = 0;
    let lastTime = performance.now();
    let lastFpsUpdateTime = lastTime;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      frameCount++;
      if (currentTime - lastFpsUpdateTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdateTime));
        const frameTime = parseFloat(delta.toFixed(1));
        setMeasuredFps(fps);
        setMeasuredFrameTime(frameTime);
        if (onFpsUpdate) {
          onFpsUpdate(fps, frameTime);
        }
        frameCount = 0;
        lastFpsUpdateTime = currentTime;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // Update points geometry whenever primitives, colors, or masks change
  useEffect(() => {
    updatePointsGeometry();
  }, [updatePointsGeometry]);

  // Update overlays visibility
  useEffect(() => {
    if (boxesGroupRef.current) boxesGroupRef.current.visible = internalShowBoxes;
  }, [internalShowBoxes]);

  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = internalShowGrid;
  }, [internalShowGrid]);

  useEffect(() => {
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
  }, [showAxes]);

  // Handle Mouse / Orbit Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDraggingRef.current || !cameraRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    // Pan with right-click or shift-click
    if (e.buttons === 2 || e.shiftKey) {
      const factor = 0.002 * cameraSphericalRef.current.radius;
      cameraTargetRef.current.x -= deltaX * factor;
      cameraTargetRef.current.y += deltaY * factor;
    } else {
      // Orbit
      cameraSphericalRef.current.theta -= deltaX * 0.005;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraSphericalRef.current.phi - deltaY * 0.005)
      );
    }

    const { radius, theta, phi } = cameraSphericalRef.current;
    const target = cameraTargetRef.current;
    cameraRef.current.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(target);

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive || !cameraRef.current) return;
    e.preventDefault();

    const zoomFactor = e.deltaY * 0.001;
    cameraSphericalRef.current.radius = Math.max(
      0.3,
      Math.min(5.0, cameraSphericalRef.current.radius + zoomFactor)
    );

    const { radius, theta, phi } = cameraSphericalRef.current;
    const target = cameraTargetRef.current;
    cameraRef.current.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(target);
  };

  const activeCount = activeMask ? activeMask.reduce((a, b) => a + b, 0) : (primitives?.primitive_count || 0);

  return (
    <div 
      ref={containerRef} 
      className="viewport-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="viewport-canvas" />

      {/* Telemetry HUD */}
      <div className="viewport-hud">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>WEBGL TELEMETRY</span>
        </div>
        <div>FPS: <span style={{ color: measuredFps >= 45 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600 }}>{measuredFps}</span> (measured)</div>
        <div>Frame Time: <span style={{ color: 'var(--text-primary)' }}>{measuredFrameTime} ms</span></div>
        <div>Active Primitives: <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{activeCount.toLocaleString()}</span> / {primitives?.primitive_count.toLocaleString() || 0}</div>
        <div>Pruned: <span style={{ color: 'var(--accent-rose)' }}>{((primitives?.primitive_count || 0) - activeCount).toLocaleString()}</span> ({((1 - activeCount / (primitives?.primitive_count || 1)) * 100).toFixed(1)}%)</div>
        <div>Mode: <span style={{ color: 'var(--accent-violet)', textTransform: 'uppercase' }}>{internalColorMode}</span></div>
      </div>

      {/* Toolbar Controls */}
      <div className="viewport-toolbar">
        {/* Color Mode Switcher */}
        <button 
          className={`tool-btn ${internalColorMode === 'natural' ? 'active' : ''}`}
          onClick={() => setInternalColorMode('natural')}
          title="Natural RGB Texture"
        >
          <Eye size={13} /> RGB
        </button>
        <button 
          className={`tool-btn ${internalColorMode === 'heatmap' ? 'active' : ''}`}
          onClick={() => setInternalColorMode('heatmap')}
          title="Perceptual Heatmap Overlay"
        >
          <Flame size={13} /> Heatmap
        </button>
        <button 
          className={`tool-btn ${internalColorMode === 'semantic' ? 'active' : ''}`}
          onClick={() => setInternalColorMode('semantic')}
          title="Semantic Class Prior"
        >
          <Layers size={13} /> Semantic
        </button>
        <button 
          className={`tool-btn ${internalColorMode === 'motion' ? 'active' : ''}`}
          onClick={() => setInternalColorMode('motion')}
          title="Motion Dynamic Velocity"
        >
          <Activity size={13} /> Motion
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: 'auto 2px' }} />

        {/* Camera Presets */}
        <button 
          className="tool-btn" 
          onClick={() => applyCameraPreset('face')}
          title="Face & Eyes Detail"
        >
          <Camera size={13} /> Face
        </button>
        <button 
          className="tool-btn" 
          onClick={() => applyCameraPreset('hands')}
          title="Hands & Communicative Gestures"
        >
          <Camera size={13} /> Hands
        </button>
        <button 
          className="tool-btn" 
          onClick={() => applyCameraPreset('front')}
          title="Reset Camera Front"
        >
          <RotateCcw size={13} /> Reset
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: 'auto 2px' }} />

        {/* Overlays Toggles */}
        <button 
          className={`tool-btn ${internalShowBoxes ? 'active' : ''}`}
          onClick={() => setInternalShowBoxes(!internalShowBoxes)}
          title="Toggle Region Bounding Boxes"
        >
          <Box size={13} /> Boxes
        </button>
        <button 
          className={`tool-btn ${internalShowGrid ? 'active' : ''}`}
          onClick={() => setInternalShowGrid(!internalShowGrid)}
          title="Toggle Studio Grid"
        >
          <Grid size={13} /> Grid
        </button>
      </div>
    </div>
  );
};
