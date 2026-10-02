import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ReactorParameters, ReactorTelemetry, COOLANT_SPECS } from '../types/smr';
import { Eye, RotateCcw, Zap, Shield, Flame, Activity } from 'lucide-react';

interface ThreeMhdSimulationProps {
  params: ReactorParameters;
  telemetry: ReactorTelemetry;
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: string | null) => void;
  cameraPreset?: string;
}

export const ThreeMhdSimulation: React.FC<ThreeMhdSimulationProps> = ({
  params,
  telemetry,
  activeHotspot,
  onSelectHotspot,
  cameraPreset
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleDataRef = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; path: number; t: number }>>([]);
  const fluxLinesRef = useRef<THREE.Group | null>(null);
  const freezePlugsRef = useRef<THREE.Mesh[]>([]);
  const dumpLiquidRef = useRef<THREE.Mesh | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: 0.6, phi: 0.45, distance: 26 });
  const reqAnimIdRef = useRef<number | null>(null);

  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.018);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(16, 12, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5); // Cyan key
    dirLight1.position.set(20, 25, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.8); // Amber rim
    dirLight2.position.set(-18, -10, -15);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x06b6d4, 3, 20);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -9;
    scene.add(gridHelper);

    // Build Reactor Assembly
    buildReactorModel(scene);

    // Build Particle Flow System
    buildParticleStreamlines(scene);

    // Build Magnetic Flux Loops
    buildMagneticFluxLoops(scene);

    // Animation Loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      reqAnimIdRef.current = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update camera position from spherical coords
      const { theta, phi, distance } = cameraRotationRef.current;
      camera.position.x = distance * Math.sin(theta) * Math.cos(phi);
      camera.position.y = distance * Math.sin(phi);
      camera.position.z = distance * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 0, 0);

      // Animate Particles
      updateParticles(dt);

      // Animate Flux lines
      if (fluxLinesRef.current) {
        fluxLinesRef.current.rotation.y += 0.003 * (params.magneticFieldTesla / 6);
      }

      // Update Freeze plug glow & dump tank liquid
      if (freezePlugsRef.current.length > 0) {
        const plugColor = params.isEmergencyDumpActive ? 0xff4500 : 0x0284c7;
        freezePlugsRef.current.forEach(mesh => {
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(plugColor);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = params.isEmergencyDumpActive ? 2.5 : 0.4;
        });
      }

      if (dumpLiquidRef.current) {
        const fillHeight = 0.1 + (params.dumpProgress * 1.8);
        dumpLiquidRef.current.scale.set(1, fillHeight, 1);
        dumpLiquidRef.current.position.y = -7.5 + (fillHeight * 0.5);
      }

      renderer.render(scene, camera);
    };

    reqAnimIdRef.current = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimIdRef.current) cancelAnimationFrame(reqAnimIdRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update particles on param changes
  const updateParticles = (dt: number) => {
    if (!particlesRef.current) return;
    const geom = particlesRef.current.geometry as THREE.BufferGeometry;
    const positions = geom.attributes.position.array as Float32Array;
    const colors = geom.attributes.color.array as Float32Array;
    const coolant = COOLANT_SPECS[params.coolantId];
    const baseColor = new THREE.Color(coolant.colorHex);

    const speedScale = (params.inletVelocity / 400) * (params.isEmergencyDumpActive ? 2.2 : 1.0);

    for (let i = 0; i < particleDataRef.current.length; i++) {
      const p = particleDataRef.current[i];
      p.t += dt * 0.4 * speedScale;
      if (p.t > 1) p.t = 0;

      let px = 0, py = 0, pz = 0;

      if (params.isEmergencyDumpActive) {
        // Particles drain downwards into subcritical dump tanks
        const dumpT = p.t;
        px = Math.sin(dumpT * Math.PI * 4 + i) * (0.8 + dumpT * 2.2);
        py = 0 - dumpT * 7.5;
        pz = Math.cos(dumpT * Math.PI * 4 + i) * (0.8 + dumpT * 2.2);

        // Turn red/orange then cool emerald
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.3 * (1 - dumpT);
        colors[i * 3 + 2] = 0.1;
      } else {
        // Normal circulating loop through Core -> Nozzle -> MHD Channel -> Plenum
        const t = p.t;
        if (t < 0.25) {
          // In the core (rising upwards)
          const coreT = t / 0.25;
          const radius = (1 - coreT * 0.3) * (0.6 + (i % 5) * 0.25);
          const angle = (i * 0.5) + coreT * Math.PI * 2;
          px = Math.cos(angle) * radius;
          py = -4 + coreT * 4.5;
          pz = Math.sin(angle) * radius;

          // Glowing hot core color
          colors[i * 3] = baseColor.r * 1.5;
          colors[i * 3 + 1] = baseColor.g * 1.3;
          colors[i * 3 + 2] = baseColor.b * 0.6;
        } else if (t < 0.6) {
          // In the MHD Channel (horizontal acceleration & Lorentz deceleration)
          const chanT = (t - 0.25) / 0.35;
          px = -4.5 + chanT * 9.0;
          py = 1.0 + Math.sin(chanT * Math.PI) * 0.2;
          pz = ((i % 7) - 3) * 0.22;

          // Electric ionization glow
          colors[i * 3] = 0.2;
          colors[i * 3 + 1] = 0.85;
          colors[i * 3 + 2] = 1.0;
        } else {
          // Return loop / heat rejection back to core
          const retT = (t - 0.6) / 0.4;
          const angle = retT * Math.PI;
          px = 4.5 * Math.cos(angle);
          py = 1.0 - retT * 5.0;
          pz = Math.sin(angle) * 3.5 * ((i % 2 === 0) ? 1 : -1);

          // Cooled fluid color
          colors[i * 3] = baseColor.r * 0.7;
          colors[i * 3 + 1] = baseColor.g * 0.7;
          colors[i * 3 + 2] = baseColor.b * 1.2;
        }
      }

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
    }

    geom.attributes.position.needsUpdate = true;
    geom.attributes.color.needsUpdate = true;
  };

  // Build reactor 3D geometry
  const buildReactorModel = (scene: THREE.Scene) => {
    const reactorGroup = new THREE.Group();

    // 1. Lower Core Pressure Vessel (RPV)
    const rpvMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const rpvGeom = new THREE.CylinderGeometry(2.4, 2.4, 6, 32, 1, true, 0, Math.PI * 1.5);
    const rpvMesh = new THREE.Mesh(rpvGeom, rpvMaterial);
    rpvMesh.position.y = -2;
    reactorGroup.add(rpvMesh);

    // Core fuel assemblies / fluid core zone
    const coreCoreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      wireframe: true
    });
    const coreGeom = new THREE.CylinderGeometry(1.8, 1.8, 5, 16);
    const coreMesh = new THREE.Mesh(coreGeom, coreCoreMat);
    coreMesh.position.y = -2;
    reactorGroup.add(coreMesh);

    // 2. Converging-Diverging Supersonic Nozzle
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    });
    const nozzleGeom = new THREE.CylinderGeometry(0.7, 1.8, 1.8, 24);
    const nozzleMesh = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzleMesh.position.set(-4.5, 0.9, 0);
    nozzleMesh.rotation.z = Math.PI / 2;
    reactorGroup.add(nozzleMesh);

    // 3. Rectangular MHD Generator Channel
    const ductMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0.45
    });
    const ductGeom = new THREE.BoxGeometry(9.0, 1.2, 1.4);
    const ductMesh = new THREE.Mesh(ductGeom, ductMat);
    ductMesh.position.set(0, 1.0, 0);
    reactorGroup.add(ductMesh);

    // Electrodes (Segmented along top & bottom)
    const electrodeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xd97706,
      emissiveIntensity: 0.6
    });

    for (let x = -3.8; x <= 3.8; x += 1.0) {
      // Top Anode Segment
      const elTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 1.2), electrodeMat);
      elTop.position.set(x, 1.6, 0);
      reactorGroup.add(elTop);

      // Bottom Cathode Segment
      const elBottom = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 1.2), electrodeMat);
      elBottom.position.set(x, 0.4, 0);
      reactorGroup.add(elBottom);
    }

    // 4. Superconducting Magnet Solenoids (Left & Right of Channel)
    const magnetMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4
    });

    const magnetLeft = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.45, 16, 32), magnetMat);
    magnetLeft.position.set(0, 1.0, 1.7);
    reactorGroup.add(magnetLeft);

    const magnetRight = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.45, 16, 32), magnetMat);
    magnetRight.position.set(0, 1.0, -1.7);
    reactorGroup.add(magnetRight);

    // 5. Freeze Plugs & Passive Gravity Drain Conduits
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.3
    });

    // 4 drain pipes descending from core base
    const drainPipeOffsets = [
      { x: 1.2, z: 1.2 },
      { x: -1.2, z: 1.2 },
      { x: 1.2, z: -1.2 },
      { x: -1.2, z: -1.2 }
    ];

    const plugs: THREE.Mesh[] = [];
    drainPipeOffsets.forEach(offset => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.2, 16), pipeMat);
      pipe.position.set(offset.x, -5.8, offset.z);
      reactorGroup.add(pipe);

      // Freeze plug valve seal
      const plugMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        roughness: 0.2
      });
      const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.5, 16), plugMat);
      plug.position.set(offset.x, -5.0, offset.z);
      reactorGroup.add(plug);
      plugs.push(plug);
    });
    freezePlugsRef.current = plugs;

    // 6. Subcritical Annular Safe Geometry Tanks (Base)
    const dumpTankMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.75
    });

    const tankOuter = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.9, 16, 36), dumpTankMat);
    tankOuter.rotation.x = Math.PI / 2;
    tankOuter.position.y = -7.5;
    reactorGroup.add(tankOuter);

    // Liquid in dump tank (scales up when dump is triggered)
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    const liquidMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.1, 32), liquidMat);
    liquidMesh.position.y = -7.5;
    reactorGroup.add(liquidMesh);
    dumpLiquidRef.current = liquidMesh;

    scene.add(reactorGroup);
  };

  // Build Particle Streamlines
  const buildParticleStreamlines = (scene: THREE.Scene) => {
    const particleCount = 1400;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    particleDataRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      const p = {
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        path: i % 4,
        t: Math.random()
      };
      particleDataRef.current.push(p);

      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMaterial = new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geom, pMaterial);
    scene.add(particles);
    particlesRef.current = particles;
  };

  // Build Magnetic Flux Loops (cyan glowing lines between magnets)
  const buildMagneticFluxLoops = (scene: THREE.Scene) => {
    const fluxGroup = new THREE.Group();
    const curvePointsCount = 24;

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 1.8;
      const points = [];
      for (let j = 0; j <= curvePointsCount; j++) {
        const u = j / curvePointsCount;
        const z = -1.7 + u * 3.4;
        const arch = Math.sin(u * Math.PI) * 0.9;
        const x = Math.cos(angle) * (r + arch);
        const y = 1.0 + Math.sin(angle) * (r + arch);
        points.push(new THREE.Vector3(x, y, z));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geom, mat);
      fluxGroup.add(line);
    }

    scene.add(fluxGroup);
    fluxLinesRef.current = fluxGroup;
  };

  // Camera presets
  const applyPreset = (preset: string) => {
    if (preset === 'overview') {
      cameraRotationRef.current = { theta: 0.6, phi: 0.45, distance: 26 };
    } else if (preset === 'channel') {
      cameraRotationRef.current = { theta: 0.1, phi: 0.2, distance: 13 };
    } else if (preset === 'nozzle') {
      cameraRotationRef.current = { theta: -0.9, phi: 0.35, distance: 15 };
    } else if (preset === 'dump_tank') {
      cameraRotationRef.current = { theta: 0.8, phi: -0.35, distance: 20 };
    } else if (preset === 'top_flux') {
      cameraRotationRef.current = { theta: 0.0, phi: 1.45, distance: 24 };
    }
  };

  useEffect(() => {
    if (cameraPreset) {
      applyPreset(cameraPreset);
    }
  }, [cameraPreset]);

  // Mouse interaction for orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    cameraRotationRef.current.theta -= dx * 0.006;
    cameraRotationRef.current.phi = Math.max(-1.4, Math.min(1.4, cameraRotationRef.current.phi + dy * 0.006));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraRotationRef.current.distance = Math.max(8, Math.min(45, cameraRotationRef.current.distance + e.deltaY * 0.02));
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#060913] select-none overflow-hidden rounded-xl border border-slate-800">
      {/* Three.js canvas mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* 3D Camera Controls Toolbar */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/60 z-10">
        <button
          onClick={() => applyPreset('overview')}
          className="px-2.5 py-1 text-xs font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          Full Vessel
        </button>
        <button
          onClick={() => applyPreset('channel')}
          className="px-2.5 py-1 text-xs font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
        >
          <Zap className="w-3 h-3 text-cyan-400" /> MHD Duct
        </button>
        <button
          onClick={() => applyPreset('nozzle')}
          className="px-2.5 py-1 text-xs font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          Nozzle
        </button>
        <button
          onClick={() => applyPreset('dump_tank')}
          className="px-2.5 py-1 text-xs font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
        >
          <Shield className="w-3 h-3 text-emerald-400" /> Dump Tanks
        </button>
        <button
          onClick={() => applyPreset('top_flux')}
          className="px-2.5 py-1 text-xs font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          B-Field
        </button>
        <button
          onClick={() => applyPreset('overview')}
          title="Reset Orbit"
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live 3D Overlay Telemetry Badges */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10 pointer-events-none">
        <div className="px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-md border border-cyan-500/40 text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Direct DC Power</div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {telemetry.mhdPowerMWe} <span className="text-xs text-slate-400">MWe</span>
          </div>
        </div>

        <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-md border border-slate-700/60 text-right">
          <div className="text-[10px] font-mono text-slate-400">Lorentz Braking</div>
          <div className="text-xs font-mono text-amber-300 font-semibold">
            {telemetry.lorentzForceDensityKN_m3} <span className="text-[10px] text-slate-400">kN/m³</span>
          </div>
        </div>

        <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-md border border-slate-700/60 text-right">
          <div className="text-[10px] font-mono text-slate-400">Hartmann No. (Ha)</div>
          <div className="text-xs font-mono text-emerald-300 font-semibold">
            {telemetry.hartmannNumber}
          </div>
        </div>
      </div>

      {/* Emergency Dump Visual Banner */}
      {params.isEmergencyDumpActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-rose-950/90 border border-rose-500 rounded-lg backdrop-blur-md flex items-center gap-3 z-10 shadow-lg shadow-rose-950/50 animate-pulse">
          <Flame className="w-5 h-5 text-rose-400 animate-bounce" />
          <div>
            <div className="text-xs font-comic font-bold text-rose-300 uppercase tracking-wider">
              PASSIVE EMERGENCY GRAVITY DUMP ACTIVE
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              Core Fuel In Tank: {telemetry.dumpTankFillPercent}% · Subcritical Non-Pumping Safe Geometry
            </div>
          </div>
        </div>
      )}

      {/* Interactive 3D Hotspot Tags */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400 z-10">
        <span className="text-slate-500">Callouts:</span>
        <button
          onClick={() => {
            onSelectHotspot(activeHotspot === 'mhd_stator' ? null : 'mhd_stator');
            applyPreset('channel');
          }}
          className={`px-2 py-0.5 rounded border transition ${
            activeHotspot === 'mhd_stator'
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-500/40'
              : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
          }`}
        >
          REBCO Magnets ({params.magneticFieldTesla}T)
        </button>
        <button
          onClick={() => {
            onSelectHotspot(activeHotspot === 'electrodes' ? null : 'electrodes');
            applyPreset('channel');
          }}
          className={`px-2 py-0.5 rounded border transition ${
            activeHotspot === 'electrodes'
              ? 'bg-amber-950 text-amber-300 border-amber-500'
              : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
          }`}
        >
          Segmented Electrodes
        </button>
        <button
          onClick={() => {
            onSelectHotspot(activeHotspot === 'freeze_plug' ? null : 'freeze_plug');
            applyPreset('dump_tank');
          }}
          className={`px-2 py-0.5 rounded border transition ${
            activeHotspot === 'freeze_plug'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
              : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
          }`}
        >
          Freeze Plugs & Safe Vault
        </button>
      </div>

      {/* Hotspot Info Popup Drawer */}
      {activeHotspot && (
        <div className="absolute bottom-12 left-3 right-3 sm:right-auto sm:max-w-md p-3.5 bg-slate-900/95 border border-cyan-500/60 rounded-xl backdrop-blur-md shadow-2xl z-20">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-comic font-bold text-cyan-400 uppercase tracking-wider">
              {activeHotspot === 'mhd_stator' && 'REBCO Superconducting Solenoid Stator'}
              {activeHotspot === 'electrodes' && 'Continuous vs Segmented Electrodes'}
              {activeHotspot === 'freeze_plug' && 'Passive Subcritical Gravity Safe Tanks'}
            </span>
            <button
              onClick={() => onSelectHotspot(null)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-slate-300 mt-2 leading-relaxed">
            {activeHotspot === 'mhd_stator' && (
              <p>
                Two opposing Rare-Earth Barium Copper Oxide (REBCO) high-temperature superconducting coils maintain a continuous transverse magnetic field up to 12 Tesla. As conductive coolant rushes through, Lorentz force separates positive ions and electrons toward opposite channel walls, generating direct DC power without any spinning turbine shaft.
              </p>
            )}
            {activeHotspot === 'electrodes' && (
              <p>
                Segmented pyrolytic tungsten electrodes prevent axial Hall current shorting (<span className="text-amber-300 font-mono">β_H = ω_e τ_e</span>). Operating at optimal load factor <span className="text-amber-300 font-mono">K = 0.5</span> extracts maximum power density: <span className="text-cyan-300 font-mono">P = σ u² B² K(1-K)</span>.
              </p>
            )}
            {activeHotspot === 'freeze_plug' && (
              <p>
                Unlike conventional pressurized water reactors that require emergency diesel generator pumps, the fluid-state nuclear core is held by actively cooled freeze-plugs. If station blackout occurs, the plugs thaw naturally; gravity dumps the liquid fuel into annular, high-surface-area tanks where physical geometry strictly prevents neutron criticality.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
