import React, { useState } from 'react';
import { ReactorParameters } from '../types/smr';
import {
  History,
  Compass,
  Zap,
  Flame,
  Atom,
  Magnet,
  Rocket,
  ShieldCheck,
  ChevronRight,
  Play,
  Calendar,
  Sparkles,
  ArrowRight,
  Gauge
} from 'lucide-react';

export interface TimelineMilestone {
  id: string;
  year: string;
  epoch: string;
  title: string;
  keyFigure: string;
  location: string;
  description: string;
  breakthrough: string;
  bottleneck: string;
  equation: string;
  equationLabel: string;
  icon: 'compass' | 'wave' | 'flame' | 'nuclear' | 'magnet' | 'modern' | 'space';
  cameraPreset: 'overview' | 'channel' | 'nozzle' | 'dump_tank';
  simParams: Partial<ReactorParameters>;
  soundEffect?: string;
}

export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: 'faraday_1831',
    year: '1831',
    epoch: 'The Classical Genesis',
    title: "Faraday's River Thames Experiment",
    keyFigure: 'Michael Faraday',
    location: 'Waterloo Bridge, London, UK',
    description: 'Michael Faraday lowers brass electrodes into the brackish, flowing waters of the River Thames, attempting to measure the electric potential induced by the river moving across Earth’s geomagnetic field.',
    breakthrough: 'First empirical demonstration of Faraday Induction in continuous flowing conductors: E = u × B.',
    bottleneck: "Earth's magnetic field (~0.00005 T) was too weak; galvanometer deflection was masked by electrochemical noise.",
    equation: 'E_ind = u × B',
    equationLabel: "Faraday's Law in Moving Fluid",
    icon: 'compass',
    cameraPreset: 'channel',
    simParams: {
      coolantId: 'liquid_lead_bismuth',
      magneticFieldTesla: 0.5,
      inletVelocity: 15,
      thermalPowerMW: 50,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'FARADAY VOLTAGE DETECTED'
  },
  {
    id: 'hartmann_1937',
    year: '1937',
    epoch: 'Boundary Layer Physics',
    title: 'Hartmann Mercury Tubes & The Ha Number',
    keyFigure: 'Julius Hartmann',
    location: 'Royal Technical College, Copenhagen',
    description: 'Julius Hartmann investigates laminar liquid mercury flowing in rectangular channels between electromagnet poles. He discovers that strong transverse magnetic fields damp turbulence and flatten velocity profiles.',
    breakthrough: 'Formulated the Hartmann Number (Ha), quantifying electromagnetic suppression of turbulent eddies.',
    bottleneck: 'Liquid mercury is toxic and heavy; early copper electromagnets overheated without high-power cryogenic cooling.',
    equation: 'Ha = B · L · √(σ / μ)',
    equationLabel: 'Hartmann Dimensionless Number',
    icon: 'wave',
    cameraPreset: 'channel',
    simParams: {
      coolantId: 'liquid_lead_bismuth',
      magneticFieldTesla: 2.0,
      inletVelocity: 25,
      thermalPowerMW: 80,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'HARTMANN LAYER LAMINARIZED'
  },
  {
    id: 'alfven_1942',
    year: '1942',
    epoch: 'Cosmic Magnetohydrodynamics',
    title: 'Discovery of Magnetohydrodynamic Waves',
    keyFigure: 'Hannes Alfvén (Nobel Prize 1970)',
    location: 'Royal Institute of Technology, Stockholm',
    description: 'Alfvén proves theoretically that magnetic field lines in a conducting fluid behave like taut elastic strings, giving rise to transverse shear waves that transport momentum and energy through plasma.',
    breakthrough: 'Unified Maxwell’s electrodynamics with Navier-Stokes fluid mechanics, birthing modern plasma physics.',
    bottleneck: 'Terrestrial laboratories lacked magnetic fields strong enough to reproduce cosmic-scale plasma confinement.',
    equation: 'v_A = B / √(μ₀ · ρ)',
    equationLabel: 'Alfvén Wave Propagation Speed',
    icon: 'wave',
    cameraPreset: 'channel',
    simParams: {
      coolantId: 'he_xe_plasma',
      magneticFieldTesla: 3.5,
      inletVelocity: 650,
      thermalPowerMW: 120,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'ALFVÉN WAVE PROPAGATION'
  },
  {
    id: 'avco_1959',
    year: '1959–1975',
    epoch: 'The Open-Cycle Combustion Boom',
    title: 'Megawatt Coal/Gas MHD Channels & The Slag Wall',
    keyFigure: 'Richard Rosa / Soviet U-25 Team',
    location: 'AVCO Everett (USA) & IVTAN (Moscow)',
    description: 'Engineers burn pulverized coal or natural gas at 3,000 K with potassium carbonate seed to achieve direct generation. AVCO builds the 32 MW Mark V generator; the USSR operates the U-25 plant feeding the Moscow electrical grid.',
    breakthrough: 'Proved multi-megawatt direct MHD generation was feasible with high-temperature combustion plasmas.',
    bottleneck: 'Combustion ash slagging, seed chemical recovery costs, and aggressive electrode erosion destroyed ducts in under 200 hours.',
    equation: 'P_density = σ · u² · B² · K(1 - K)',
    equationLabel: 'Channel Power Density',
    icon: 'flame',
    cameraPreset: 'nozzle',
    simParams: {
      coolantId: 'he_xe_plasma',
      magneticFieldTesla: 4.5,
      inletVelocity: 850,
      thermalPowerMW: 200,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'OPEN-CYCLE SLAGGING CRISIS'
  },
  {
    id: 'msre_1965',
    year: '1965–1969',
    epoch: 'The Liquid-Core Revolution',
    title: 'Oak Ridge Molten Salt Reactor Experiment (MSRE)',
    keyFigure: 'Dr. Alvin Weinberg',
    location: 'Oak Ridge National Laboratory, Tennessee',
    description: 'Alvin Weinberg and his team demonstrate that liquid fluoride salts (FLiBe carrying dissolved UF4) can sustain nuclear criticality at atmospheric pressure. The reactor operates for thousands of hours with zero fuel cladding.',
    breakthrough: 'Proved the freeze-plug passive safety concept: unpowered melting dropped fuel into subcritical tanks via gravity.',
    bottleneck: 'Conventional Rankine steam loops risked steam-salt contact; direct MHD generation was not yet integrated.',
    equation: 'Δk_temp < 0 (Prompt Negative Reactivity)',
    equationLabel: 'Inherent Negative Feedback',
    icon: 'nuclear',
    cameraPreset: 'dump_tank',
    simParams: {
      coolantId: 'acid_molten_salt',
      magneticFieldTesla: 5.0,
      inletVelocity: 40,
      thermalPowerMW: 100,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'FREEZE-PLUG GRAVITY SAFETY VERIFIED'
  },
  {
    id: 'ccmhd_1985',
    year: '1985–1998',
    epoch: 'Closed-Cycle Noble Gases',
    title: 'Closed-Cycle Inert Gas (CCMHD) Plasma',
    keyFigure: 'Tokyo Tech & Eindhoven Teams',
    location: 'Tokyo Institute of Technology, Japan',
    description: 'To solve the dirty combustion problem, researchers couple high-temperature nuclear gas reactors with pure Helium-Xenon noble gases seeded with trace cesium. Non-equilibrium ionization achieves conductivities of 500 S/m at 1,800 K.',
    breakthrough: 'Eliminated combustion slag and duct erosion using clean, recirculating noble gas loops.',
    bottleneck: 'Low-temperature superconductors required liquid helium cryogenics (4.2 K), making stators bulky and prone to thermal quench.',
    equation: 'T_e / T_gas > 1 (Non-Equilibrium Electron Temp)',
    equationLabel: 'Two-Temperature Plasma Model',
    icon: 'wave',
    cameraPreset: 'channel',
    simParams: {
      coolantId: 'he_xe_plasma',
      magneticFieldTesla: 6.0,
      inletVelocity: 1100,
      thermalPowerMW: 150,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'NOBLE GAS NON-EQUILIBRIUM IONIZATION'
  },
  {
    id: 'rebco_2015',
    year: '2015–2022',
    epoch: 'The Superconducting Leap',
    title: 'High-Temperature Superconducting (REBCO) Stators',
    keyFigure: 'Applied Superconductivity Consortium',
    location: 'MIT / CERN / National High Magnetic Field Lab',
    description: 'Commercial maturation of Rare-Earth Barium Copper Oxide (REBCO) tape magnets allows continuous 10–15 Tesla magnetic fields at 20 K using compact closed-loop cryocoolers instead of volatile liquid helium.',
    breakthrough: 'Because MHD power scales with B², 10 Tesla stators quadrupled power density compared to 5 Tesla coils.',
    bottleneck: 'High mechanical Lorentz strain (>600 MPa) required advanced Hastelloy reinforcement tapes.',
    equation: 'F_strain ∝ B² / (2 · μ₀)',
    equationLabel: 'Magnetic Hoop Stress',
    icon: 'magnet',
    cameraPreset: 'channel',
    simParams: {
      coolantId: 'he_xe_plasma',
      magneticFieldTesla: 10.0,
      inletVelocity: 950,
      thermalPowerMW: 200,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: '10-TESLA REBCO STATOR LOCKED'
  },
  {
    id: 'smr_mhd_2026',
    year: '2026+',
    epoch: 'The Modern Solid-State Era',
    title: 'The Quantum Fluid Vanguard: Solid-State SMR-MHD',
    keyFigure: 'Dr. Maya Lin & Vanguard AI',
    location: 'Next-Gen Microgrid & Orbital Testbed',
    description: 'The ultimate synthesis: Small Modular Reactor core with liquid acid-state actinide salt or supersonic He-Xe noble gas, feeding a 10T REBCO solid-state MHD channel with subcritical annular gravity drop tanks. Zero moving parts, walk-away safe, 30-year sealed vessel.',
    breakthrough: 'Eliminated steam turbines entirely; achieved direct 60%+ combined-cycle efficiency with passive freeze-plug safety.',
    bottleneck: 'None remaining in principle: factory fabrication and deployment for remote microgrids and deep space underway.',
    equation: 'η_total = P_mhd / Q_th ≥ 58.4%',
    equationLabel: 'Solid-State Nuclear Direct Conversion',
    icon: 'modern',
    cameraPreset: 'overview',
    simParams: {
      coolantId: 'acid_molten_salt',
      magneticFieldTesla: 8.0,
      inletVelocity: 45,
      thermalPowerMW: 150,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'QUANTUM FLUID VANGUARD: ONLINE'
  },
  {
    id: 'deep_space_2035',
    year: '2035+',
    epoch: 'The Interplanetary Frontier',
    title: 'Nuclear Electric Propulsion (NEP) for Deep Space',
    keyFigure: 'Interplanetary Expeditionary Corps',
    location: 'Cislunar & Outer Solar System Trajectories',
    description: 'High-thrust magnetoplasmadynamic (MPD) thrusters powered directly by multi-megawatt SMR-MHD generators. Zero moving turbomachinery eliminates gyroscopic precession torque, allowing precise orbital maneuvering across the Jovian moons.',
    breakthrough: 'Unlocks rapid crewed transit to Mars and asteroid belts with continuous megawatt-class ion propulsion.',
    bottleneck: 'Radiative heat rejection in vacuum requires high-temperature deployable carbon-composite radiators.',
    equation: 'I_sp > 5,000 s (Specific Impulse)',
    equationLabel: 'Continuous Ion Acceleration',
    icon: 'space',
    cameraPreset: 'overview',
    simParams: {
      coolantId: 'he_xe_plasma',
      magneticFieldTesla: 12.0,
      inletVelocity: 1300,
      thermalPowerMW: 300,
      loadFactor: 0.5,
      isEmergencyDumpActive: false
    },
    soundEffect: 'INTERPLANETARY NEP VECTOR ENGAGED'
  }
];

interface MhdEvolutionTimelineProps {
  onApplyParams: (params: Partial<ReactorParameters>) => void;
  onSetCameraPreset: (preset: string) => void;
}

export const MhdEvolutionTimeline: React.FC<MhdEvolutionTimelineProps> = ({
  onApplyParams,
  onSetCameraPreset
}) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('smr_mhd_2026');
  const [activeTab, setActiveTab] = useState<'chronicle' | 'comparison'>('chronicle');

  const activeMilestone =
    TIMELINE_MILESTONES.find(m => m.id === selectedMilestoneId) || TIMELINE_MILESTONES[0];

  const handleSelectMilestone = (m: TimelineMilestone) => {
    setSelectedMilestoneId(m.id);
    onSetCameraPreset(m.cameraPreset);
    onApplyParams(m.simParams);
  };

  return (
    <div className="flex flex-col h-full bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
            SMR-MHD Technology Evolution (1831–2035+)
          </span>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('chronicle')}
            className={`px-2.5 py-1 text-xs font-comic rounded-md transition ${
              activeTab === 'chronicle' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chronicle Rail
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-2.5 py-1 text-xs font-comic rounded-md transition ${
              activeTab === 'comparison' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Steam vs Solid-State
          </button>
        </div>
      </div>

      {activeTab === 'chronicle' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Horizontal Timeline Scrubber / Milestone Node Track */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Timeline Nodes · Click to Jump & Simulate</span>
              <span className="text-cyan-400 font-bold">{activeMilestone.year}</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {TIMELINE_MILESTONES.map((m, idx) => {
                const isSelected = m.id === selectedMilestoneId;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMilestone(m)}
                    className={`shrink-0 px-2.5 py-2 rounded-lg text-left transition border ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                      <span className="font-mono text-xs font-bold text-white">{m.year}</span>
                    </div>
                    <div className="text-[10px] font-comic uppercase tracking-wider truncate max-w-[110px] mt-0.5">
                      {m.epoch}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Era Featured Comic Card */}
          <div className="comic-box p-5 rounded-xl border border-slate-800 space-y-4">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/40">
                    {activeMilestone.year}
                  </span>
                  <span className="text-[11px] font-comic uppercase tracking-wider text-slate-400">
                    {activeMilestone.epoch}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-comic font-bold text-white uppercase mt-1">
                  {activeMilestone.title}
                </h3>
              </div>

              {/* Instant 3D Simulation Button */}
              <button
                onClick={() => {
                  onSetCameraPreset(activeMilestone.cameraPreset);
                  onApplyParams(activeMilestone.simParams);
                }}
                className="px-3.5 py-1.5 text-xs font-comic font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow-md shadow-cyan-600/30 self-start sm:self-auto shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Simulate Era in 3D</span>
              </button>
            </div>

            {/* Persona & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Pioneer:</span>
                <span className="text-cyan-300 font-bold">{activeMilestone.keyFigure}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Facility:</span>
                <span className="text-slate-300 truncate">{activeMilestone.location}</span>
              </div>
            </div>

            {/* Sound Effect Splash if present */}
            {activeMilestone.soundEffect && (
              <div className="comic-sfx text-lg text-cyan-400 uppercase tracking-tight">
                ⚡ {activeMilestone.soundEffect}
              </div>
            )}

            {/* Narrative Description */}
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              "{activeMilestone.description}"
            </p>

            {/* Formula & Breakthrough Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Breakthrough Box */}
              <div className="p-3 bg-emerald-950/20 border-l-2 border-emerald-500 rounded text-xs space-y-1">
                <span className="font-comic font-bold text-emerald-400 block uppercase tracking-wider text-[11px]">
                  Core Breakthrough
                </span>
                <p className="text-slate-300 leading-snug font-sans">
                  {activeMilestone.breakthrough}
                </p>
              </div>

              {/* Bottleneck Solved Box */}
              <div className="p-3 bg-amber-950/20 border-l-2 border-amber-500 rounded text-xs space-y-1">
                <span className="font-comic font-bold text-amber-400 block uppercase tracking-wider text-[11px]">
                  Bottleneck / Limitation
                </span>
                <p className="text-slate-300 leading-snug font-sans">
                  {activeMilestone.bottleneck}
                </p>
              </div>
            </div>

            {/* Governing Physics Equation Display */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  {activeMilestone.equationLabel}:
                </span>
                <span className="font-mono font-bold text-sm text-cyan-300">
                  {activeMilestone.equation}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                Preset: {activeMilestone.simParams.magneticFieldTesla}T · {activeMilestone.simParams.inletVelocity} m/s
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Era Comparison Table / Infographic */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl">
            <h4 className="font-comic font-bold text-cyan-300 text-xs uppercase mb-1">
              Technological Paradigm Shift: 1884 to 2026+
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              How moving-part steam turbomachinery evolved into direct magnetohydrodynamic solid-state nuclear generators.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                  <th className="p-2.5 font-comic uppercase">Metric</th>
                  <th className="p-2.5 font-comic uppercase text-amber-300">Parsons Steam Turbine (1884–Present)</th>
                  <th className="p-2.5 font-comic uppercase text-sky-300">Open-Cycle Fossil MHD (1960s)</th>
                  <th className="p-2.5 font-comic uppercase text-emerald-300">Solid-State SMR-MHD (2026+)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-400">Moving Parts</td>
                  <td className="p-2.5 text-rose-400">Thousands (Blades, Shafts, Bearings)</td>
                  <td className="p-2.5 text-slate-300">Zero in Duct (Feed pumps required)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">Zero (100% Solid-State)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-400">Working Medium</td>
                  <td className="p-2.5">Superheated Steam (H₂O)</td>
                  <td className="p-2.5">Coal/Gas Combustion + K₂CO₃ Seed</td>
                  <td className="p-2.5 text-cyan-300 font-bold">Liquid Actinide Salt or Seeded He-Xe</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-400">Thermal Efficiency</td>
                  <td className="p-2.5">33% – 36% (Carnot Limited)</td>
                  <td className="p-2.5">45% – 50%</td>
                  <td className="p-2.5 text-emerald-400 font-bold">55% – 62% (Direct DC Conversion)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-400">Maintenance Cycle</td>
                  <td className="p-2.5">Annual inspection; blade erosion</td>
                  <td className="p-2.5 text-rose-400">Hours to Days (Slag erosion)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">30 Years Unattended / Sealed Vessel</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-400">Safety During Blackout</td>
                  <td className="p-2.5 text-rose-400">Requires emergency active injection</td>
                  <td className="p-2.5">Fuel valve shutoff</td>
                  <td className="p-2.5 text-emerald-400 font-bold">100% Passive Freeze-Plug Gravity Dump</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-400">Space & Zero-G Use</td>
                  <td className="p-2.5 text-rose-400">Gyroscopic torque destabilizes ships</td>
                  <td className="p-2.5 text-slate-400">Not feasible in vacuum</td>
                  <td className="p-2.5 text-cyan-300 font-bold">Ideal for Deep Space Propulsion (NEP)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
