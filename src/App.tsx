import React, { useState, useEffect, useRef } from 'react';
import { ReactorParameters, ReactorTelemetry, EngineeringBlueprint, COOLANT_SPECS } from './types/smr';
import { calculateReactorTelemetry } from './utils/physics';
import { ThreeMhdSimulation } from './components/ThreeMhdSimulation';
import { GraphicNovelViewer } from './components/GraphicNovelViewer';
import { PhysicsControlRack } from './components/PhysicsControlRack';
import { AiArchitectAdvisor } from './components/AiArchitectAdvisor';
import { StudentEngineeringLab } from './components/StudentEngineeringLab';
import { BlueprintModal } from './components/BlueprintModal';
import {
  Atom,
  BookOpen,
  Sliders,
  Bot,
  Award,
  Zap,
  ShieldAlert,
  FileText,
  Maximize2,
  Minimize2,
  Flame,
  Info
} from 'lucide-react';

const INITIAL_PARAMS: ReactorParameters = {
  thermalPowerMW: 150,
  magneticFieldTesla: 6.0,
  coolantId: 'he_xe_plasma',
  inletVelocity: 920,
  ionizationConductivity: 450,
  loadFactor: 0.50,
  isEmergencyDumpActive: false,
  dumpProgress: 0,
  cutawayView: true,
  showMagneticFlux: true,
  showStreamlines: true
};

export default function App() {
  const [params, setParams] = useState<ReactorParameters>(INITIAL_PARAMS);
  const [telemetry, setTelemetry] = useState<ReactorTelemetry>(() => calculateReactorTelemetry(INITIAL_PARAMS));
  const [activeTab, setActiveTab] = useState<'novel' | 'controls' | 'ai' | 'lab'>('novel');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<string>('overview');
  const [blueprintData, setBlueprintData] = useState<EngineeringBlueprint | null>(null);
  const [isSimFullscreen, setIsSimFullscreen] = useState(false);

  // Recalculate physics telemetry whenever parameters change
  useEffect(() => {
    setTelemetry(calculateReactorTelemetry(params));
  }, [params]);

  // Handle Emergency Dump Animation Progression
  useEffect(() => {
    let interval: any = null;
    if (params.isEmergencyDumpActive) {
      interval = setInterval(() => {
        setParams(prev => {
          if (prev.dumpProgress >= 1.0) {
            clearInterval(interval);
            return prev;
          }
          return {
            ...prev,
            dumpProgress: Math.min(1.0, prev.dumpProgress + 0.04)
          };
        });
      }, 150);
    } else {
      setParams(prev => ({ ...prev, dumpProgress: 0 }));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [params.isEmergencyDumpActive]);

  const handleUpdateParams = (newParams: Partial<ReactorParameters>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  const handleResetDefaults = () => {
    setParams(INITIAL_PARAMS);
    setActiveHotspot(null);
    setCameraPreset('overview');
  };

  const handleToggleEmergencyDump = () => {
    setParams(prev => ({
      ...prev,
      isEmergencyDumpActive: !prev.isEmergencyDumpActive,
      dumpProgress: !prev.isEmergencyDumpActive ? 0.05 : 0
    }));
    if (!params.isEmergencyDumpActive) {
      setCameraPreset('dump_tank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050811] text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="px-4 py-3 bg-[#070c18] border-b border-slate-800/90 sticky top-0 z-40">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 shrink-0">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-comic font-bold text-white tracking-wide uppercase">
                  SMR-MHD Nuclear System Architect
                </h1>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                  Solid-State Core v2.6
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Interactive Engineering Graphic Novel & 3D Magnetohydrodynamic Flow Simulation
              </p>
            </div>
          </div>

          {/* Quick Unboxed Telemetry Strip */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 overflow-x-auto py-1 w-full md:w-auto justify-start md:justify-center border-y md:border-y-0 border-slate-800/60">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500">Output:</span>
              <span className="text-cyan-300 font-bold">{telemetry.mhdPowerMWe} MWe</span>
            </div>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500">Efficiency:</span>
              <span className="text-emerald-400 font-bold">{telemetry.efficiencyPercent}%</span>
            </div>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500">Stator:</span>
              <span className="text-cyan-400 font-bold">{params.magneticFieldTesla} T</span>
            </div>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500">Hartmann:</span>
              <span className="text-sky-300 font-bold">{telemetry.hartmannNumber}</span>
            </div>
          </div>

          {/* Blueprint Extraction CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/architect/blueprint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      thermalPowerMW: params.thermalPowerMW,
                      magneticFieldTesla: params.magneticFieldTesla,
                      fluidType: COOLANT_SPECS[params.coolantId].name,
                      inletVelocity: params.inletVelocity,
                      ionizationConductivity: params.ionizationConductivity,
                      loadFactor: params.loadFactor
                    })
                  });
                  const bp = await res.json();
                  setBlueprintData(bp);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="px-3 py-1.5 text-xs font-comic font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extract JSON Blueprint</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 3D Simulation Canvas & Visual Diagnostics */}
        <section className={`${isSimFullscreen ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-7'} flex flex-col gap-3 min-h-[480px] lg:min-h-[720px]`}>
          {/* 3D Canvas Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-200">
                Core & Channel Coolant Dynamics (3D WebGL)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Drag to Orbit · Scroll to Zoom
              </span>
              <button
                onClick={() => setIsSimFullscreen(!isSimFullscreen)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                title={isSimFullscreen ? 'Restore Split View' : 'Maximize 3D Canvas'}
              >
                {isSimFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Three.js Simulation Viewport */}
          <div className="flex-1 w-full rounded-xl overflow-hidden shadow-2xl relative">
            <ThreeMhdSimulation
              params={params}
              telemetry={telemetry}
              activeHotspot={activeHotspot}
              onSelectHotspot={setActiveHotspot}
              cameraPreset={cameraPreset}
            />
          </div>

          {/* Bottom Diagnostics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] font-mono text-slate-400">Flow Velocity</div>
              <div className="text-sm font-mono font-bold text-amber-300">
                {params.inletVelocity} m/s
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Mach {telemetry.machNumber}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] font-mono text-slate-400">MHD Pressure Drop</div>
              <div className="text-sm font-mono font-bold text-cyan-300">
                {telemetry.pressureDropBar} Bar
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Across 4.8m Duct
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] font-mono text-slate-400">Magnetic Reynolds (Rm)</div>
              <div className="text-sm font-mono font-bold text-emerald-300">
                {telemetry.magneticReynoldsNumber}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Field Induction Ratio
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] font-mono text-slate-400">Core Inventory</div>
              <div className={`text-sm font-mono font-bold ${params.isEmergencyDumpActive ? 'text-rose-400' : 'text-slate-200'}`}>
                {telemetry.fuelInventoryInCorePercent}%
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {params.isEmergencyDumpActive ? 'Draining into Vault' : 'Normal Circulation'}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Graphic Novel / Controls / AI Architect / Student Lab */}
        {!isSimFullscreen && (
          <section className="lg:col-span-5 xl:col-span-5 flex flex-col gap-3 min-h-[600px] lg:min-h-[720px]">
            {/* View Mode Tabs (Zero-pill clean buttons) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('novel')}
                className={`py-2 px-1 text-xs font-comic font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'novel'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Graphic Novel</span>
                <span className="sm:hidden">Story</span>
              </button>

              <button
                onClick={() => setActiveTab('controls')}
                className={`py-2 px-1 text-xs font-comic font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'controls'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Controls</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`py-2 px-1 text-xs font-comic font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Architect</span>
                <span className="sm:hidden">AI</span>
              </button>

              <button
                onClick={() => setActiveTab('lab')}
                className={`py-2 px-1 text-xs font-comic font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'lab'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Student Lab</span>
                <span className="sm:hidden">Lab</span>
              </button>
            </div>

            {/* Tab Panels */}
            <div className="flex-1 min-h-[500px]">
              {activeTab === 'novel' && (
                <GraphicNovelViewer
                  onApplySimulationParams={handleUpdateParams}
                  onSetCameraPreset={setCameraPreset}
                />
              )}

              {activeTab === 'controls' && (
                <PhysicsControlRack
                  params={params}
                  telemetry={telemetry}
                  onChangeParams={handleUpdateParams}
                  onResetDefaults={handleResetDefaults}
                  onTriggerEmergencyDump={handleToggleEmergencyDump}
                />
              )}

              {activeTab === 'ai' && (
                <AiArchitectAdvisor
                  params={params}
                  telemetry={telemetry}
                  onOpenBlueprint={setBlueprintData}
                  onApplySafetyScenario={scenario => {
                    if (scenario === 'LOCA_PRESSURE_LOSS' || scenario === 'STATION_BLACKOUT') {
                      handleToggleEmergencyDump();
                    } else if (scenario === 'MAGNET_QUENCH') {
                      handleUpdateParams({ magneticFieldTesla: 0.1 });
                    }
                  }}
                />
              )}

              {activeTab === 'lab' && (
                <StudentEngineeringLab
                  params={params}
                  telemetry={telemetry}
                  onApplyParams={handleUpdateParams}
                />
              )}
            </div>
          </section>
        )}
      </main>

      {/* Structured Blueprint & JSON Modal */}
      <BlueprintModal
        blueprint={blueprintData}
        onClose={() => setBlueprintData(null)}
      />
    </div>
  );
}
