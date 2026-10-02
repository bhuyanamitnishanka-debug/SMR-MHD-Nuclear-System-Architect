import React, { useState } from 'react';
import { GraphicNovelChapter, GraphicNovelPanel, ReactorParameters } from '../types/smr';
import { ChevronLeft, ChevronRight, Play, BookOpen, Sparkles, Volume2, ArrowRight, History } from 'lucide-react';
import { MhdEvolutionTimeline } from './MhdEvolutionTimeline';

export const GRAPHIC_NOVEL_CHAPTERS: GraphicNovelChapter[] = [
  {
    id: 1,
    title: 'Chapter I: The Curse of the Steam Turbine',
    subtitle: 'Breaking free from 140 years of spinning metal blades',
    synopsis: 'Why mechanical turbomachinery limits nuclear reactor efficiency and creates single points of catastrophic failure.',
    panels: [
      {
        id: 'p1_1',
        order: 1,
        speaker: 'Dr. Maya Lin',
        avatarRole: 'architect',
        narration: 'Oak Ridge High-Flux Laboratory · 03:14 AM',
        dialogue: 'Look at the blade root micro-cracks. For over a century, humanity has built state-of-the-art nuclear fission cores only to boil water and spin giant metal blades. Centrifugal stress, steam seal leaks, thermal shock... moving parts are an engineering bottleneck!',
        soundEffect: 'KRRR-KLACK!',
        sfxColor: 'text-amber-400',
        technicalNote: 'Steam turbines cap thermal efficiency around 33-37% and suffer severe maintenance penalties due to high-speed rotational fatigue.',
        cameraPreset: 'overview',
        interactiveAction: {
          label: 'Inspect SMR Pressure Vessel Cutaway',
          applyParams: { thermalPowerMW: 100, magneticFieldTesla: 2, inletVelocity: 300, isEmergencyDumpActive: false }
        }
      },
      {
        id: 'p1_2',
        order: 2,
        speaker: 'Alex Chen',
        avatarRole: 'physicist',
        narration: 'MHD Experimental Duct Testing Cell',
        dialogue: 'What if we eliminate every spinning turbine shaft entirely? If our core coolant is electrically conductive—either a seeded high-temperature gas plasma or a liquid-state actinide salt—Faraday’s law takes over. We generate DC voltage directly from fluid motion!',
        soundEffect: 'ZZZZZZZT-FLUX!',
        sfxColor: 'text-cyan-400',
        technicalNote: 'Direct Magnetohydrodynamic conversion converts fluid kinetic enthalpy into electricity via Lorentz interaction E = u × B.',
        cameraPreset: 'channel',
        interactiveAction: {
          label: 'Engage 6 Tesla Magnetic Channel',
          applyParams: { magneticFieldTesla: 6, loadFactor: 0.5 }
        }
      },
      {
        id: 'p1_3',
        order: 3,
        speaker: 'VANGUARD AI',
        avatarRole: 'vanguard_ai',
        narration: 'Autonomous Core Telemetry',
        dialogue: 'Faraday generator stator locked. Solid-state conversion confirmed. Zero mechanical bearings. Acoustic vibration reduced by 99.8%. Direct DC bus energized to 38.4 Megawatts.',
        soundEffect: 'POWER SURGE: 100% ONLINE',
        sfxColor: 'text-emerald-400',
        technicalNote: 'Without rotating components, an SMR-MHD reactor vessel can be factory-sealed and buried underground for 30-year unattended lifespans.',
        cameraPreset: 'channel',
        interactiveAction: {
          label: 'Run 150 MW Core Baseline',
          applyParams: { thermalPowerMW: 150, magneticFieldTesla: 6, inletVelocity: 750 }
        }
      }
    ]
  },
  {
    id: 2,
    title: 'Chapter II: The Ionized Torrent',
    subtitle: 'Supersonic Helium-Xenon Gas vs Liquid Acid-State Salts',
    synopsis: 'Exploring the flow physics of conductive coolants passing through supersonic converging-diverging nozzles.',
    panels: [
      {
        id: 'p2_1',
        order: 1,
        speaker: 'Alex Chen',
        avatarRole: 'physicist',
        narration: 'Supersonic Wind Tunnel Testing Chamber',
        dialogue: 'We have two distinct fluid paradigms. In our gas core, we mix Helium for extreme heat transfer and Xenon for heavy molecular weight, seeded with trace potassium. Expanding through the de Laval nozzle, it accelerates to Mach 1.4!',
        soundEffect: 'SHOCKWAVE DETONATION!',
        sfxColor: 'text-sky-400',
        technicalNote: 'He-Xe gas mixtures achieve high acoustic velocities (~680 m/s at 1950 K), allowing supersonic expansion with low pressure ratios.',
        cameraPreset: 'nozzle',
        interactiveAction: {
          label: 'Load Supersonic He-Xe Plasma',
          applyParams: { coolantId: 'he_xe_plasma', inletVelocity: 950, ionizationConductivity: 450 }
        }
      },
      {
        id: 'p2_2',
        order: 2,
        speaker: 'Dr. Maya Lin',
        avatarRole: 'architect',
        narration: 'Actinide Chemistry Glovebox',
        dialogue: 'Or consider our liquid "acid-state" nuclear fuel: actinide tetrafluorides dissolved in FLiBe molten salt. It operates at ambient pressure, eliminating high-pressure pipe burst hazards. Even at lower flow speeds, its massive density and conductivity generate brutal electromagnetic braking!',
        soundEffect: 'GLOWING EMERALD ROAR',
        sfxColor: 'text-emerald-400',
        technicalNote: 'Molten actinide salt fuel has zero cladding degradation risk and negative temperature reactivity coefficient.',
        cameraPreset: 'overview',
        interactiveAction: {
          label: 'Switch to Liquid Acid-State Salt Core',
          applyParams: { coolantId: 'acid_molten_salt', inletVelocity: 45, ionizationConductivity: 1200, magneticFieldTesla: 8 }
        }
      }
    ]
  },
  {
    id: 3,
    title: 'Chapter III: The Lorentz Barrier & Hartmann Flattening',
    subtitle: 'Mastering magnetohydrodynamic boundary layers',
    synopsis: 'How strong magnetic fields suppress turbulent eddies and reshape the fluid velocity profile.',
    panels: [
      {
        id: 'p3_1',
        order: 1,
        speaker: 'Alex Chen',
        avatarRole: 'physicist',
        narration: 'MHD Channel Boundary Layer Sensor Array',
        dialogue: 'Look at the fluid velocity profile across the 30 cm duct! In normal pipe flow, you get parabolic poiseuille drag with chaotic turbulent eddies near the wall. But apply 8 Tesla, and the Hartmann effect kicks in!',
        soundEffect: 'LORENTZ CLAMP!',
        sfxColor: 'text-violet-400',
        technicalNote: 'Hartmann number Ha = B * L * sqrt(sigma/mu). When Ha > 500, electromagnetic forces overpower viscous forces, flattening the velocity profile into a uniform plug flow.',
        cameraPreset: 'channel',
        interactiveAction: {
          label: 'Ramp B-Field to 10 Tesla',
          applyParams: { magneticFieldTesla: 10 }
        }
      },
      {
        id: 'p3_2',
        order: 2,
        speaker: 'Dr. Maya Lin',
        avatarRole: 'architect',
        narration: 'Electrode Array Control Bus',
        dialogue: 'Crucial design rule: continuous solid metal wall electrodes cause Hall voltage short-circuiting! That’s why our channel uses segmented pyrolytic tungsten electrodes. And we tune the external load factor to K = 0.5 to extract maximum power density!',
        soundEffect: 'OPTIMAL MPPT: K = 0.50',
        sfxColor: 'text-amber-400',
        technicalNote: 'Power density P = sigma * u^2 * B^2 * K(1-K). The quadratic term K(1-K) reaches a mathematical maximum at exactly K = 0.5.',
        cameraPreset: 'channel',
        interactiveAction: {
          label: 'Set Optimal Load Factor K = 0.50',
          applyParams: { loadFactor: 0.5 }
        }
      }
    ]
  },
  {
    id: 4,
    title: 'Chapter IV: The Fail-Safe Abyss (Passive Gravity Dump)',
    subtitle: 'Zero-pump walk-away safety during extreme transients',
    synopsis: 'What happens when external grid power vanishes or a supersonic duct ruptures?',
    panels: [
      {
        id: 'p4_1',
        order: 1,
        speaker: 'VANGUARD AI',
        avatarRole: 'vanguard_ai',
        narration: 'EMERGENCY TRANSIENT ALERT · SIMULATED STATION BLACKOUT',
        dialogue: 'Warning: Complete loss of off-site AC power. Grid frequency collapsed. All electrical pumps unpowered.',
        soundEffect: 'KLAXON ALARM: WEE-WOO-WEE-WOO!',
        sfxColor: 'text-rose-500',
        technicalNote: 'In Fukushima-style station blackout, traditional reactors melt down when diesel backup generators fail to pump cooling water.',
        cameraPreset: 'overview',
        interactiveAction: {
          label: 'Simulate Station Blackout',
          applyParams: {}
        }
      },
      {
        id: 'p4_2',
        order: 2,
        speaker: 'Dr. Maya Lin',
        avatarRole: 'architect',
        narration: 'Reactor Lower Vault Inspection',
        dialogue: 'We don’t need pumps. We designed the laws of physics to save us! The freeze-plugs at the base of the core are actively chilled by small thermoelectric coolers. The moment power vanishes, the chillers stop!',
        soundEffect: 'FREEZE-PLUG THAW ENGAGED',
        sfxColor: 'text-rose-400',
        technicalNote: 'Freeze valves are solid frozen salt plugs held by active cooling. Loss of power causes them to melt in seconds from core decay heat.',
        cameraPreset: 'dump_tank',
        interactiveAction: {
          label: 'Thaw Freeze Plugs',
          applyParams: { isEmergencyDumpActive: true, dumpProgress: 0.3 }
        }
      },
      {
        id: 'p4_3',
        order: 3,
        speaker: 'Alex Chen',
        avatarRole: 'physicist',
        narration: 'Subcritical Annular Safe Geometry Tanks',
        dialogue: 'Gravity takes over. The entire liquid-state nuclear core drains downward into thin annular storage tanks. Because neutron moderators are separated and the tanks have a subcritical surface-to-volume ratio, fission is physically impossible!',
        soundEffect: 'GRAVITY CASCADE · REACTIVITY: 0.00',
        sfxColor: 'text-emerald-400',
        technicalNote: 'Subcritical geometry prevents criticality regardless of fuel volume or temperature. Natural air circulation removes decay heat forever.',
        cameraPreset: 'dump_tank',
        interactiveAction: {
          label: 'Complete Passive Gravity Dump',
          applyParams: { isEmergencyDumpActive: true, dumpProgress: 1.0 }
        }
      }
    ]
  },
  {
    id: 5,
    title: 'Chapter V: The Frontier & Space Deployment',
    subtitle: 'From Arctic Microgrids to Deep-Space Ion Propulsion',
    synopsis: 'Deploying compact SMR-MHD systems across remote Earth sites and interplanetary spacecraft.',
    panels: [
      {
        id: 'p5_1',
        order: 1,
        speaker: 'Dr. Maya Lin',
        avatarRole: 'architect',
        narration: 'Orbital Shipyard & Remote Terrestrial Deployments',
        dialogue: 'Turbine-less SMR-MHD is the Holy Grail of space propulsion and isolated microgrids. In zero gravity, moving mechanical turbines induce gyroscopic torque on spacecraft hulls. A solid-state MHD channel generates direct DC for magnetoplasmadynamic thrusters with zero vibration!',
        soundEffect: 'INTERPLANETARY VECTOR LOCKED',
        sfxColor: 'text-cyan-300',
        technicalNote: 'High specific impulse and power-to-weight ratio (>1.5 kWe/kg) enable rapid manned transit to Mars and the outer solar system.',
        cameraPreset: 'overview',
        interactiveAction: {
          label: 'Reset to Orbital Full-Power Mode',
          applyParams: { thermalPowerMW: 250, magneticFieldTesla: 8, inletVelocity: 1100, isEmergencyDumpActive: false, dumpProgress: 0 }
        }
      },
      {
        id: 'p5_2',
        order: 2,
        speaker: 'Dr. Maya Lin',
        avatarRole: 'architect',
        narration: 'Oak Ridge High-Flux Archives & Timeline Lab',
        dialogue: 'From Michael Faraday measuring London river currents in 1831, to Julius Hartmann’s mercury tubes in 1937, to Alvin Weinberg’s molten salt freeze-plugs in the 1960s... today’s solid-state SMR-MHD is the culmination of two centuries of physics. Explore our interactive evolutionary chronicle!',
        soundEffect: '200-YEAR CHRONICLE UNLOCKED',
        sfxColor: 'text-amber-400',
        technicalNote: 'Traces the transition from 19th-century magnetic induction to 1960s open-cycle fossil channels, 1980s inert noble gas plasmas, 2010s REBCO stators, and modern 2026 solid-state SMRs.',
        cameraPreset: 'channel',
        interactiveAction: {
          label: 'Launch 200-Year Evolution Timeline',
          applyParams: { magneticFieldTesla: 8.0, thermalPowerMW: 150 },
          targetViewMode: 'timeline'
        }
      }
    ]
  }
];

interface GraphicNovelViewerProps {
  onApplySimulationParams: (params: Partial<ReactorParameters>) => void;
  onSetCameraPreset: (preset: string) => void;
}

export const GraphicNovelViewer: React.FC<GraphicNovelViewerProps> = ({
  onApplySimulationParams,
  onSetCameraPreset
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState(1);
  const [currentPanelIdx, setCurrentPanelIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'step' | 'full_comic' | 'timeline'>('step');

  const chapter = GRAPHIC_NOVEL_CHAPTERS.find(c => c.id === selectedChapterId) || GRAPHIC_NOVEL_CHAPTERS[0];
  const currentPanel = chapter.panels[currentPanelIdx] || chapter.panels[0];

  const handleNextPanel = () => {
    if (currentPanelIdx < chapter.panels.length - 1) {
      const nextIdx = currentPanelIdx + 1;
      setCurrentPanelIdx(nextIdx);
      const nextPanel = chapter.panels[nextIdx];
      if (nextPanel.cameraPreset) onSetCameraPreset(nextPanel.cameraPreset);
      if (nextPanel.interactiveAction) onApplySimulationParams(nextPanel.interactiveAction.applyParams);
    } else if (selectedChapterId < GRAPHIC_NOVEL_CHAPTERS.length) {
      setSelectedChapterId(selectedChapterId + 1);
      setCurrentPanelIdx(0);
      const firstPanel = GRAPHIC_NOVEL_CHAPTERS[selectedChapterId].panels[0];
      if (firstPanel.cameraPreset) onSetCameraPreset(firstPanel.cameraPreset);
      if (firstPanel.interactiveAction) onApplySimulationParams(firstPanel.interactiveAction.applyParams);
    }
  };

  const handlePrevPanel = () => {
    if (currentPanelIdx > 0) {
      setCurrentPanelIdx(currentPanelIdx - 1);
    } else if (selectedChapterId > 1) {
      const prevChap = GRAPHIC_NOVEL_CHAPTERS[selectedChapterId - 2];
      setSelectedChapterId(selectedChapterId - 1);
      setCurrentPanelIdx(prevChap.panels.length - 1);
    }
  };

  if (viewMode === 'timeline') {
    return (
      <div className="flex flex-col h-full bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Navigation Bar with Timeline highlighted */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
              SMR-MHD Evolutionary Timeline
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setViewMode('step')}
              className="text-xs font-comic px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Slide Mode
            </button>
            <button
              onClick={() => setViewMode('full_comic')}
              className="text-xs font-comic px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Full Comic
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className="text-xs font-comic px-2.5 py-1 rounded bg-cyan-600 text-white font-semibold transition flex items-center gap-1 shadow-sm"
            >
              <History className="w-3.5 h-3.5" />
              <span>Timeline (1831–2035+)</span>
            </button>
          </div>
        </div>

        {/* Embedded Timeline Content */}
        <div className="flex-1 overflow-hidden">
          <MhdEvolutionTimeline
            onApplyParams={onApplySimulationParams}
            onSetCameraPreset={onSetCameraPreset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Chapter Selection Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex items-center gap-1.5">
            {GRAPHIC_NOVEL_CHAPTERS.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedChapterId(c.id);
                  setCurrentPanelIdx(0);
                  if (c.panels[0].cameraPreset) onSetCameraPreset(c.panels[0].cameraPreset);
                  if (c.panels[0].interactiveAction) onApplySimulationParams(c.panels[0].interactiveAction.applyParams);
                }}
                className={`px-2.5 py-1 text-xs font-comic rounded-md transition whitespace-nowrap ${
                  selectedChapterId === c.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Ch. {c.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setViewMode('step')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition ${
              viewMode === 'step' ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Slide Mode
          </button>
          <button
            onClick={() => setViewMode('full_comic')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition ${
              viewMode === 'full_comic' ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Full Comic
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className="text-xs font-comic px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Chapter Title & Synopsis */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent border-b border-slate-800/80">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-comic font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <span className="text-cyan-400">CH. {chapter.id}:</span> {chapter.title.split(': ')[1] || chapter.title}
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Panel {currentPanelIdx + 1} of {chapter.panels.length}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{chapter.subtitle}</p>
      </div>

      {/* Comic Panels Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {viewMode === 'step' ? (
          /* Step-by-Step Interactive Comic Slide */
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {/* Comic Frame Card */}
            <div className={`comic-box p-5 rounded-lg border-2 ${
              currentPanel.avatarRole === 'vanguard_ai'
                ? 'border-cyan-500/60 bg-slate-900/90'
                : currentPanel.avatarRole === 'physicist'
                ? 'border-amber-500/60 bg-slate-900/90'
                : 'border-slate-700 bg-slate-900/90'
            }`}>
              {/* Narration Kicker Box */}
              <div className="inline-block px-2.5 py-1 bg-black/60 border border-slate-700 text-[10px] font-comic font-semibold uppercase tracking-wider text-amber-300 rounded mb-3">
                {currentPanel.narration}
              </div>

              {/* Dynamic Sound Effect Splash */}
              {currentPanel.soundEffect && (
                <div className={`comic-sfx text-2xl sm:text-3xl my-1 uppercase tracking-tight transform -rotate-1 ${currentPanel.sfxColor || 'text-cyan-400'}`}>
                  {currentPanel.soundEffect}
                </div>
              )}

              {/* Character Speech Balloon */}
              {currentPanel.dialogue && (
                <div className="mt-3 relative p-4 bg-slate-950/80 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      currentPanel.avatarRole === 'architect' ? 'bg-cyan-400' :
                      currentPanel.avatarRole === 'physicist' ? 'bg-amber-400' :
                      currentPanel.avatarRole === 'vanguard_ai' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`} />
                    <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-200">
                      {currentPanel.speaker}
                    </span>
                  </div>
                  <p className="text-sm font-sans leading-relaxed text-slate-100">
                    "{currentPanel.dialogue}"
                  </p>
                </div>
              )}

              {/* Technical Engineering Explainer Note */}
              {currentPanel.technicalNote && (
                <div className="mt-4 p-3 bg-cyan-950/20 border-l-2 border-cyan-500 rounded text-xs font-mono text-cyan-200/90 leading-relaxed">
                  <span className="font-bold text-cyan-400 block mb-0.5">ENGINEERING PRINCIPLE:</span>
                  {currentPanel.technicalNote}
                </div>
              )}

              {/* Interactive Simulation Bridge Button */}
              {currentPanel.interactiveAction && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (currentPanel.cameraPreset) onSetCameraPreset(currentPanel.cameraPreset);
                      if (currentPanel.interactiveAction) {
                        onApplySimulationParams(currentPanel.interactiveAction.applyParams);
                        if (currentPanel.interactiveAction.targetViewMode) {
                          setViewMode(currentPanel.interactiveAction.targetViewMode);
                        }
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-comic font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Action: {currentPanel.interactiveAction.label}</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-500">Auto-links to 3D simulation</span>
                </div>
              )}
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrevPanel}
                disabled={currentPanelIdx === 0 && selectedChapterId === 1}
                className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Beat
              </button>

              <div className="flex items-center gap-1">
                {chapter.panels.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPanelIdx(i);
                      const p = chapter.panels[i];
                      if (p.cameraPreset) onSetCameraPreset(p.cameraPreset);
                      if (p.interactiveAction) onApplySimulationParams(p.interactiveAction.applyParams);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentPanelIdx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextPanel}
                className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition shadow-md shadow-cyan-600/30"
              >
                <span>{currentPanelIdx === chapter.panels.length - 1 ? 'Next Chapter' : 'Next Beat'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Comic Scroll Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapter.panels.map((panel, idx) => (
              <div
                key={panel.id}
                onClick={() => {
                  if (panel.cameraPreset) onSetCameraPreset(panel.cameraPreset);
                  if (panel.interactiveAction) {
                    onApplySimulationParams(panel.interactiveAction.applyParams);
                    if (panel.interactiveAction.targetViewMode) {
                      setViewMode(panel.interactiveAction.targetViewMode);
                    }
                  }
                }}
                className="comic-box p-4 rounded-lg cursor-pointer hover:border-cyan-500 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-comic uppercase tracking-wider text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                      {panel.narration}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                  </div>

                  {panel.soundEffect && (
                    <div className={`comic-sfx text-lg uppercase my-1 ${panel.sfxColor || 'text-cyan-400'}`}>
                      {panel.soundEffect}
                    </div>
                  )}

                  {panel.dialogue && (
                    <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded">
                      <div className="text-[11px] font-comic font-bold text-slate-300 uppercase mb-1">
                        {panel.speaker}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed italic">
                        "{panel.dialogue}"
                      </p>
                    </div>
                  )}

                  {panel.technicalNote && (
                    <p className="text-[11px] font-mono text-cyan-300/80 mt-2 bg-cyan-950/30 p-2 rounded border-l border-cyan-500">
                      {panel.technicalNote}
                    </p>
                  )}
                </div>

                {panel.interactiveAction && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 group-hover:text-cyan-300">
                    <span className="font-comic font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {panel.interactiveAction.label}
                    </span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
