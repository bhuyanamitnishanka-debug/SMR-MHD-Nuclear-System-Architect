import React from 'react';
import { ReactorParameters, ReactorTelemetry, COOLANT_SPECS, CoolantType } from '../types/smr';
import { Zap, Magnet, Gauge, Flame, ShieldAlert, Sliders, RefreshCw } from 'lucide-react';

interface PhysicsControlRackProps {
  params: ReactorParameters;
  telemetry: ReactorTelemetry;
  onChangeParams: (newParams: Partial<ReactorParameters>) => void;
  onResetDefaults: () => void;
  onTriggerEmergencyDump: () => void;
}

export const PhysicsControlRack: React.FC<PhysicsControlRackProps> = ({
  params,
  telemetry,
  onChangeParams,
  onResetDefaults,
  onTriggerEmergencyDump
}) => {
  const currentCoolant = COOLANT_SPECS[params.coolantId];

  const handleCoolantChange = (id: CoolantType) => {
    const spec = COOLANT_SPECS[id];
    onChangeParams({
      coolantId: id,
      inletVelocity: Math.round((spec.inletVelocityRange[0] + spec.inletVelocityRange[1]) / 2),
      ionizationConductivity: spec.nominalConductivity
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
            MHD Flow Dynamic Controls
          </span>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 hover:bg-slate-800 px-2 py-0.5 rounded transition"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Coolant Selector */}
        <div>
          <label className="text-[11px] font-comic font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Core Working Fluid
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(COOLANT_SPECS) as CoolantType[]).map(typeKey => {
              const spec = COOLANT_SPECS[typeKey];
              const isSelected = params.coolantId === typeKey;
              return (
                <button
                  key={typeKey}
                  onClick={() => handleCoolantChange(typeKey)}
                  className={`p-2 rounded-lg text-left border transition text-xs ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="font-comic font-bold text-xs truncate" style={{ color: isSelected ? spec.colorHex : undefined }}>
                    {spec.name.split(' (')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    {spec.phase.split(' / ')[0]}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 italic leading-snug">
            {currentCoolant.description}
          </p>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
          {/* Thermal Power */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-sans flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> Core Thermal Power (Q_th)
              </span>
              <span className="font-mono text-cyan-300 font-bold">{params.thermalPowerMW} MWth</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={params.thermalPowerMW}
              onChange={e => onChangeParams({ thermalPowerMW: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Magnetic Field (Tesla) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-sans flex items-center gap-1.5">
                <Magnet className="w-3.5 h-3.5 text-cyan-400" /> Magnetic Stator Field (B)
              </span>
              <span className="font-mono text-cyan-300 font-bold">{params.magneticFieldTesla} Tesla</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={params.magneticFieldTesla}
              onChange={e => onChangeParams({ magneticFieldTesla: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
              <span>0 T (No Conversion)</span>
              <span>6 T (Standard HTS)</span>
              <span>12 T (High Field REBCO)</span>
            </div>
          </div>

          {/* Inlet Flow Velocity (m/s) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-sans flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" /> Duct Inlet Flow Speed (u)
              </span>
              <span className="font-mono text-amber-300 font-bold">{params.inletVelocity} m/s</span>
            </div>
            <input
              type="range"
              min={currentCoolant.inletVelocityRange[0]}
              max={currentCoolant.inletVelocityRange[1]}
              step={params.coolantId === 'he_xe_plasma' ? 25 : 2}
              value={params.inletVelocity}
              onChange={e => onChangeParams({ inletVelocity: Number(e.target.value) })}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
              <span>Min: {currentCoolant.inletVelocityRange[0]} m/s</span>
              <span>Max: {currentCoolant.inletVelocityRange[1]} m/s</span>
            </div>
          </div>

          {/* Fluid Electrical Conductivity (S/m) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-sans flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Electrical Conductivity (σ)
              </span>
              <span className="font-mono text-emerald-300 font-bold">{params.ionizationConductivity} S/m</span>
            </div>
            <input
              type="range"
              min="20"
              max="10000"
              step="50"
              value={params.ionizationConductivity}
              onChange={e => onChangeParams({ ionizationConductivity: Number(e.target.value) })}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Generator Load Factor K */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-sans flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-violet-400" /> Generator Load Factor (K = E / uB)
              </span>
              <span className="font-mono text-violet-300 font-bold">K = {params.loadFactor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={params.loadFactor}
              onChange={e => onChangeParams({ loadFactor: Number(e.target.value) })}
              className="w-full accent-violet-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
              <span>0.0 (Short Circuit)</span>
              <span className="text-violet-400 font-semibold">0.50 (Max Power Point)</span>
              <span>1.0 (Open Circuit)</span>
            </div>
          </div>
        </div>

        {/* Live Calculated Physics Telemetry Readouts */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[10px] font-comic font-bold uppercase tracking-wider text-slate-400">
            Real-Time Magnetohydrodynamic Outputs
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-950/70 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">MHD DC Power:</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                {telemetry.mhdPowerMWe} MWe
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Efficiency (η):</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                {telemetry.efficiencyPercent}%
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Lorentz Braking:</span>
              <span className="font-mono font-semibold text-amber-300">
                {telemetry.lorentzForceDensityKN_m3} kN/m³
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Hartmann Number:</span>
              <span className="font-mono font-semibold text-sky-300">
                Ha = {telemetry.hartmannNumber}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center justify-between">
            <span>Regime:</span>
            <span className="text-cyan-400 font-semibold">{telemetry.flowRegime}</span>
          </div>
        </div>

        {/* Passive Emergency Gravity Dump Button */}
        <div className="pt-2">
          <button
            onClick={onTriggerEmergencyDump}
            className={`w-full py-2.5 px-4 rounded-lg font-comic font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border shadow-lg ${
              params.isEmergencyDumpActive
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-900/40'
                : 'bg-rose-600/90 hover:bg-rose-500 border-rose-400 text-white shadow-rose-950/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {params.isEmergencyDumpActive
                ? 'Reset & Refill Core Vessel'
                : 'Trigger Passive Gravity Dump (LOCA / SBO)'}
            </span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1">
            Melt freeze-plugs & test zero-pump walk-away safety in the 3D simulation
          </p>
        </div>
      </div>
    </div>
  );
};
