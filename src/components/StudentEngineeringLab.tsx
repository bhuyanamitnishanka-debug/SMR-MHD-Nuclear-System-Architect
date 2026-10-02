import React, { useState } from 'react';
import { StudentMission, ReactorParameters, ReactorTelemetry } from '../types/smr';
import { Award, Target, CheckCircle2, ChevronRight, HelpCircle, BookOpen, Atom, Zap, Activity, TrendingUp, Flame, Scale, ShieldAlert, Cpu } from 'lucide-react';
import { ThermalDecayChart } from './ThermalDecayChart';
import { PhysicsComparisonMode } from './PhysicsComparisonMode';
import { CorrosionDynamicsPanel } from './CorrosionDynamicsPanel';
import { D3MhdEfficiencyViewer } from './D3MhdEfficiencyViewer';
import { MhdEfficiencyExplorer } from './MhdEfficiencyExplorer';

interface StudentEngineeringLabProps {
  params: ReactorParameters;
  telemetry: ReactorTelemetry;
  onApplyParams: (newParams: Partial<ReactorParameters>) => void;
}

const MISSIONS: StudentMission[] = [
  {
    id: 'm1',
    title: 'Mission 1: The Lorentz Power Surge',
    category: 'Electrodynamics',
    difficulty: 'High School AP Physics',
    briefing: 'Oak Ridge microgrid requires an emergency injection of at least 85 MWe. Tune the superconducting magnet stator and find the optimal generator load factor K to extract peak power density.',
    goalDescription: 'Generate ≥ 85 MWe direct DC power with Load Factor K near 0.50 and B ≥ 7.0 Tesla.',
    targetCriteria: {
      minPowerMWe: 85,
      targetLoadFactor: 0.5
    },
    hints: [
      'Remember the power density formula: P = σ · u² · B² · K(1 - K).',
      'The term K(1 - K) is a downward parabola with its apex at K = 0.50 (Maximum Power Point).',
      'Increase B-field to 8T or higher to dramatically scale power by B².'
    ]
  },
  {
    id: 'm2',
    title: 'Mission 2: Supersonic Shockwave Stabilization',
    category: 'Compressible Flow',
    difficulty: 'Undergraduate Engineering',
    briefing: 'Expand high-temperature Helium-Xenon gas through the de Laval nozzle past Mach 1.2 while maintaining a Hartmann number Ha ≥ 400 to magnetically suppress turbulent eddy dissipation.',
    goalDescription: 'Select Supersonic He-Xe gas, reach inlet velocity ≥ 850 m/s, and achieve Hartmann number ≥ 400.',
    targetCriteria: {
      requiredCoolant: 'he_xe_plasma',
      minHartmann: 400
    },
    hints: [
      'Select "Supersonic Helium-Xenon (K-seeded)" as the working fluid.',
      'Ramp the inlet flow speed slider past 850 m/s.',
      'Hartmann number scales linearly with B-field: Ha = B · L · √(σ / μ).'
    ]
  },
  {
    id: 'm3',
    title: 'Mission 3: Fukushima-Proof Walk-Away Survival',
    category: 'Safety Protocol',
    difficulty: 'Advanced Nuclear',
    briefing: 'Simulate a total Station Blackout (loss of all AC electricity and pumps). Prove that the liquid-state reactor core safely drains into subcritical safe geometry tanks via passive gravity and freeze plugs.',
    goalDescription: 'Engage the Passive Gravity Dump and completely transfer fuel inventory to the dump tanks (100%).',
    targetCriteria: {
      emergencyDumpTriggered: true
    },
    hints: [
      'Click "Trigger Passive Gravity Dump" on the control rack or in the graphic novel Chapter 4.',
      'Observe the freeze plugs liquefy and fuel cascade into the lower annular tanks in the 3D cutaway.',
      'Zero mechanical pumps are required—gravity and geometry guarantee subcritical walk-away safety.'
    ]
  }
];

export const StudentEngineeringLab: React.FC<StudentEngineeringLabProps> = ({
  params,
  telemetry,
  onApplyParams
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>('m1');
  const [activeTab, setActiveTab] = useState<'missions' | 'curves' | 'comparison' | 'mhd_explorer' | 'd3_efficiency' | 'corrosion' | 'formulas'>('missions');

  const activeMission = MISSIONS.find(m => m.id === selectedMissionId) || MISSIONS[0];

  // Evaluate mission progress
  const checkMissionComplete = (mission: StudentMission) => {
    if (mission.id === 'm1') {
      return (
        telemetry.mhdPowerMWe >= 85 &&
        Math.abs(params.loadFactor - 0.5) <= 0.08 &&
        params.magneticFieldTesla >= 7.0
      );
    }
    if (mission.id === 'm2') {
      return (
        params.coolantId === 'he_xe_plasma' &&
        params.inletVelocity >= 850 &&
        telemetry.hartmannNumber >= 400
      );
    }
    if (mission.id === 'm3') {
      return params.isEmergencyDumpActive && telemetry.dumpTankFillPercent >= 90;
    }
    return false;
  };

  const isCurrentComplete = checkMissionComplete(activeMission);

  return (
    <div className="flex flex-col h-full bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header with 3 Tab Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
            Student Engineering Missions & Physics Lab
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('missions')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'missions' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Missions</span>
          </button>
          <button
            onClick={() => setActiveTab('curves')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'curves' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Thermal Curves</span>
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'comparison' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Physics Comparison</span>
          </button>
          <button
            onClick={() => setActiveTab('mhd_explorer')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mhd_explorer' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>MHD Efficiency Explorer</span>
          </button>
          <button
            onClick={() => setActiveTab('d3_efficiency')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'd3_efficiency' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            <span>D3 Efficiency Curves</span>
          </button>
          <button
            onClick={() => setActiveTab('corrosion')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'corrosion' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Corrosion Dynamics</span>
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`text-xs font-comic px-2.5 py-1 rounded transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'formulas' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>MHD Formulas</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'missions' && (
          <>
            {/* Mission Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {MISSIONS.map(m => {
                const complete = checkMissionComplete(m);
                const isSelected = m.id === selectedMissionId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMissionId(m.id)}
                    className={`p-2.5 rounded-lg text-left border transition shrink-0 min-w-[200px] flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">{m.difficulty}</div>
                      <div className="font-comic font-bold text-xs text-white truncate">{m.title.split(': ')[1]}</div>
                    </div>
                    {complete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    ) : (
                      <Target className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Mission Briefing Card */}
            <div className="comic-box p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/40">
                    {activeMission.category} · {activeMission.difficulty}
                  </span>
                  <h3 className="text-base font-comic font-bold text-white mt-1 uppercase">
                    {activeMission.title}
                  </h3>
                </div>

                {isCurrentComplete && (
                  <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-comic font-bold text-xs rounded-full flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" /> MISSION ACCOMPLISHED
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeMission.briefing}
              </p>

              {/* Goal Box */}
              <div className="p-3 bg-slate-950/80 border-l-2 border-amber-500 rounded text-xs">
                <span className="font-comic font-bold text-amber-400 block mb-0.5">TARGET OBJECTIVE:</span>
                <span className="font-mono text-slate-200">{activeMission.goalDescription}</span>
              </div>

              {/* Real-time Status Checklist */}
              <div className="space-y-1.5 text-xs font-mono">
                {activeMission.id === 'm1' && (
                  <>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">DC Electrical Output (≥ 85 MWe):</span>
                      <span className={telemetry.mhdPowerMWe >= 85 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {telemetry.mhdPowerMWe} MWe
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Load Factor K (near 0.50):</span>
                      <span className={Math.abs(params.loadFactor - 0.5) <= 0.08 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        K = {params.loadFactor.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Magnetic Field B (≥ 7.0 T):</span>
                      <span className={params.magneticFieldTesla >= 7 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {params.magneticFieldTesla} Tesla
                      </span>
                    </div>
                  </>
                )}

                {activeMission.id === 'm2' && (
                  <>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Working Fluid:</span>
                      <span className={params.coolantId === 'he_xe_plasma' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                        {params.coolantId === 'he_xe_plasma' ? 'Supersonic He-Xe' : 'Needs He-Xe'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Flow Speed (≥ 850 m/s):</span>
                      <span className={params.inletVelocity >= 850 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {params.inletVelocity} m/s
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Hartmann Number (≥ 400):</span>
                      <span className={telemetry.hartmannNumber >= 400 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        Ha = {telemetry.hartmannNumber}
                      </span>
                    </div>
                  </>
                )}

                {activeMission.id === 'm3' && (
                  <>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Freeze-Plug Gravity Dump Active:</span>
                      <span className={params.isEmergencyDumpActive ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                        {params.isEmergencyDumpActive ? 'ENGAGED' : 'STANDBY'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded">
                      <span className="text-slate-400">Fuel Inventory in Safe Tanks:</span>
                      <span className={telemetry.dumpTankFillPercent >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {telemetry.dumpTankFillPercent}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Hints Drawer */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mb-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Engineering Hints:
                </span>
                <ul className="space-y-1 text-xs text-slate-400 font-sans list-disc list-inside">
                  {activeMission.hints.map((hint, idx) => (
                    <li key={idx} className="leading-snug">{hint}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Embedded Real-time Recharts Component right inside mission work area */}
            <ThermalDecayChart params={params} telemetry={telemetry} />
          </>
        )}

        {activeTab === 'curves' && (
          <div className="space-y-4">
            {/* Full-View Thermal Decay & MHD Efficiency Lab */}
            <ThermalDecayChart params={params} telemetry={telemetry} />

            {/* In-depth Analytical Notes for Students */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="comic-box p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <div className="text-[11px] font-comic font-bold uppercase text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Way-Wigner Nuclear Decay Physics</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Upon fission shutdown (SCRAM), radioactive decay of fission products generates residual heat. The Way-Wigner relation dictates that decay power starts around <span className="text-rose-400 font-mono">6.5%</span> of full thermal rating and drops rapidly to under <span className="text-rose-400 font-mono">2%</span> within an hour.
                </p>
                <div className="p-2 bg-slate-950 rounded font-mono text-[11px] text-cyan-300">
                  P_decay(t) = P_0 · 0.066 · [t^(-0.2) - (t + T_0)^(-0.2)]
                </div>
              </div>

              <div className="comic-box p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <div className="text-[11px] font-comic font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Lorentz Work & Power Scaling</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  The MHD direct power output scales quadratic with flow velocity (<span className="text-cyan-300 font-mono">u²</span>) and magnetic field (<span className="text-cyan-300 font-mono">B²</span>). Transitioning from a standard 4 Tesla field to a 10 Tesla REBCO stator yields a <span className="text-amber-400 font-bold">6.25×</span> surge in energy density!
                </p>
                <div className="p-2 bg-slate-950 rounded font-mono text-[11px] text-amber-300">
                  P_mhd = σ · u² · B² · K(1 - K) · Volume
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <PhysicsComparisonMode
            currentParams={params}
            onApplyParams={onApplyParams}
          />
        )}

        {activeTab === 'mhd_explorer' && (
          <MhdEfficiencyExplorer
            currentParams={params}
            onApplyParams={onApplyParams}
          />
        )}

        {activeTab === 'd3_efficiency' && (
          <D3MhdEfficiencyViewer
            currentParams={params}
            onApplyParams={onApplyParams}
          />
        )}

        {activeTab === 'corrosion' && (
          <CorrosionDynamicsPanel currentParams={params} />
        )}

        {activeTab === 'formulas' && (
          /* MHD Physics Formula Deck */
          <div className="space-y-4">
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl">
              <span className="font-comic font-bold text-cyan-300 block text-xs uppercase mb-1">
                Core Electrodynamics & Fluid Mechanics Cheat-Sheet
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fundamental mathematical equations governing direct Magnetohydrodynamic energy conversion in Small Modular Reactors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Formula 1 */}
              <div className="comic-box p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] font-comic font-bold uppercase text-amber-400">
                  MHD Power Density
                </div>
                <div className="p-2 bg-slate-950 rounded font-mono text-cyan-300 text-xs">
                  P_d = σ · u² · B² · K(1 - K)
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Peak power density is achieved when the electrode load factor <span className="text-cyan-300 font-mono">K = 0.50</span>. Notice that power scales with velocity squared and magnetic field squared.
                </p>
              </div>

              {/* Formula 2 */}
              <div className="comic-box p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] font-comic font-bold uppercase text-amber-400">
                  Lorentz Retarding Force
                </div>
                <div className="p-2 bg-slate-950 rounded font-mono text-cyan-300 text-xs">
                  F_L = J × B = σ · u · B² · (1 - K)
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  The electromagnetic brake that extracts kinetic enthalpy directly into voltage. It causes a macroscopic pressure drop <span className="text-cyan-300 font-mono">ΔP = F_L · L</span> across the channel.
                </p>
              </div>

              {/* Formula 3 */}
              <div className="comic-box p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] font-comic font-bold uppercase text-amber-400">
                  Hartmann Number (Ha)
                </div>
                <div className="p-2 bg-slate-950 rounded font-mono text-cyan-300 text-xs">
                  Ha = B · L · √(σ / μ)
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Ratio of electromagnetic force to viscous shear force. When Ha exceeds 300+, turbulent eddies are violently extinguished, transforming turbulent parabolic flow into a flat Hartmann plug layer.
                </p>
              </div>

              {/* Formula 4 */}
              <div className="comic-box p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] font-comic font-bold uppercase text-amber-400">
                  Hall Parameter (β_H)
                </div>
                <div className="p-2 bg-slate-950 rounded font-mono text-cyan-300 text-xs">
                  β_H = ω_e · τ_e = (e · B / m_e) · τ_e
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Explains why continuous copper plates fail in high-field MHD: electrons drift axially, shorting out the Faraday current. Segmenting electrodes into discrete insulated pads solves this completely.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
