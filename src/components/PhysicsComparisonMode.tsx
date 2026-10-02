import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { ReactorParameters, COOLANT_SPECS, CoolantType } from '../types/smr';
import { Scale, Zap, Flame, Shield, ArrowRight, Sparkles, Check, Info, TrendingUp, AlertTriangle } from 'lucide-react';

interface PhysicsComparisonModeProps {
  currentParams: ReactorParameters;
  onApplyParams: (params: Partial<ReactorParameters>) => void;
}

interface CoolantConfigState {
  coolantId: CoolantType;
  magneticFieldTesla: number;
  inletVelocity: number;
  loadFactor: number;
}

export type AlloyType = 'Inconel 718 Superalloy' | 'Silicon Carbide Composite' | 'Hastelloy-N Matrix';

interface AlloySpec {
  name: AlloyType;
  preFactor: number;
  activationEnergy: number; // J/mol
  maxServiceTempC: number;
  description: string;
  colorHex: string;
}

const ALLOY_SPECS: Record<AlloyType, AlloySpec> = {
  'Inconel 718 Superalloy': {
    name: 'Inconel 718 Superalloy',
    preFactor: 0.08,
    activationEnergy: 45000,
    maxServiceTempC: 950,
    description: 'Precipitation-hardened nickel-chromium superalloy with exceptional high-temperature yield strength.',
    colorHex: '#38bdf8'
  },
  'Silicon Carbide Composite': {
    name: 'Silicon Carbide Composite',
    preFactor: 0.01,
    activationEnergy: 60000,
    maxServiceTempC: 1350,
    description: 'Ceramic matrix composite (SiC/SiC) inert to halide fluoride salts and resistant to neutron irradiation.',
    colorHex: '#10b981'
  },
  'Hastelloy-N Matrix': {
    name: 'Hastelloy-N Matrix',
    preFactor: 0.04,
    activationEnergy: 38000,
    maxServiceTempC: 1100,
    description: 'Molybdenum-nickel alloy formulated during the Oak Ridge MSRE specifically for molten fluoride salts.',
    colorHex: '#f59e0b'
  }
};

export const PhysicsComparisonMode: React.FC<PhysicsComparisonModeProps> = ({
  currentParams,
  onApplyParams
}) => {
  // Configuration A: Supersonic He-Xe Default
  const [configA, setConfigA] = useState<CoolantConfigState>({
    coolantId: 'he_xe_plasma',
    magneticFieldTesla: currentParams.magneticFieldTesla || 6.0,
    inletVelocity: 950,
    loadFactor: 0.5
  });

  // Configuration B: Liquid Acid Salt Default
  const [configB, setConfigB] = useState<CoolantConfigState>({
    coolantId: 'acid_molten_salt',
    magneticFieldTesla: 8.0,
    inletVelocity: 45,
    loadFactor: 0.5
  });

  const [comparisonMetric, setComparisonMetric] = useState<'efficiency_curve' | 'wall_lifespan' | 'corrosion_wear' | 'decay_wigner'>('efficiency_curve');
  const [selectedAlloy, setSelectedAlloy] = useState<AlloyType>('Hastelloy-N Matrix');

  // Lifespan model parameter states
  const [coreTempCelsius, setCoreTempCelsius] = useState<number>(950);
  const [initialThicknessMm, setInitialThicknessMm] = useState<number>(25.0);
  const [criticalFailureThicknessMm, setCriticalFailureThicknessMm] = useState<number>(8.0);

  const specA = COOLANT_SPECS[configA.coolantId];
  const specB = COOLANT_SPECS[configB.coolantId];

  // Quick Preset Handlers
  const handleApplyPreset = (preset: 'he_vs_salt' | 'salt_vs_lead' | 'high_rebco') => {
    if (preset === 'he_vs_salt') {
      setConfigA({ coolantId: 'he_xe_plasma', magneticFieldTesla: 6.0, inletVelocity: 950, loadFactor: 0.5 });
      setConfigB({ coolantId: 'acid_molten_salt', magneticFieldTesla: 8.0, inletVelocity: 45, loadFactor: 0.5 });
    } else if (preset === 'salt_vs_lead') {
      setConfigA({ coolantId: 'acid_molten_salt', magneticFieldTesla: 8.0, inletVelocity: 45, loadFactor: 0.5 });
      setConfigB({ coolantId: 'liquid_lead_bismuth', magneticFieldTesla: 8.0, inletVelocity: 25, loadFactor: 0.5 });
    } else if (preset === 'high_rebco') {
      setConfigA({ coolantId: configA.coolantId, magneticFieldTesla: 10.0, inletVelocity: configA.inletVelocity, loadFactor: 0.5 });
      setConfigB({ coolantId: configA.coolantId, magneticFieldTesla: 4.0, inletVelocity: configA.inletVelocity, loadFactor: 0.5 });
    }
  };

  // Calculate live physics for Config A
  const physicsA = useMemo(() => {
    const channelVol = 0.43; // m^3
    const u = configA.inletVelocity;
    const B = configA.magneticFieldTesla;
    const sigma = specA.nominalConductivity;
    const K = configA.loadFactor;

    const pDensityMW_m3 = (sigma * Math.pow(u, 2) * Math.pow(B, 2) * K * (1 - K)) / 1e6;
    const powerMWe = Math.min(currentParams.thermalPowerMW * 0.62, pDensityMW_m3 * channelVol);
    const efficiency = currentParams.thermalPowerMW > 0 ? (powerMWe / currentParams.thermalPowerMW) * 100 : 0;
    const lorentzKN_m3 = (sigma * u * Math.pow(B, 2) * (1 - K)) / 1000;
    const ha = Math.round(B * 0.25 * Math.sqrt(sigma / specA.viscosityPaS));

    return {
      powerMWe: Number(powerMWe.toFixed(2)),
      efficiency: Number(efficiency.toFixed(1)),
      lorentzKN_m3: Number(lorentzKN_m3.toFixed(1)),
      hartmann: ha,
      mach: configA.coolantId === 'he_xe_plasma' ? (u / 680).toFixed(2) : 'Subsonic'
    };
  }, [configA, specA, currentParams.thermalPowerMW]);

  // Calculate live physics for Config B
  const physicsB = useMemo(() => {
    const channelVol = 0.43; // m^3
    const u = configB.inletVelocity;
    const B = configB.magneticFieldTesla;
    const sigma = specB.nominalConductivity;
    const K = configB.loadFactor;

    const pDensityMW_m3 = (sigma * Math.pow(u, 2) * Math.pow(B, 2) * K * (1 - K)) / 1e6;
    const powerMWe = Math.min(currentParams.thermalPowerMW * 0.62, pDensityMW_m3 * channelVol);
    const efficiency = currentParams.thermalPowerMW > 0 ? (powerMWe / currentParams.thermalPowerMW) * 100 : 0;
    const lorentzKN_m3 = (sigma * u * Math.pow(B, 2) * (1 - K)) / 1000;
    const ha = Math.round(B * 0.25 * Math.sqrt(sigma / specB.viscosityPaS));

    return {
      powerMWe: Number(powerMWe.toFixed(2)),
      efficiency: Number(efficiency.toFixed(1)),
      lorentzKN_m3: Number(lorentzKN_m3.toFixed(1)),
      hartmann: ha,
      mach: configB.coolantId === 'he_xe_plasma' ? (u / 680).toFixed(2) : 'Subsonic'
    };
  }, [configB, specB, currentParams.thermalPowerMW]);

  // Performance Deltas
  const deltaPower = Number((physicsA.powerMWe - physicsB.powerMWe).toFixed(2));
  const deltaEff = Number((physicsA.efficiency - physicsB.efficiency).toFixed(1));
  const deltaHa = physicsA.hartmann - physicsB.hartmann;

  // 1. Dynamic Efficiency & Power Curves Comparison
  const efficiencyCurveData = useMemo(() => {
    const points = [];
    const channelVol = 0.43;

    const maxUA = configA.coolantId === 'he_xe_plasma' ? 1600 : 80;
    const maxUB = configB.coolantId === 'he_xe_plasma' ? 1600 : 80;

    for (let percent = 10; percent <= 100; percent += 5) {
      const uA = (percent / 100) * maxUA;
      const uB = (percent / 100) * maxUB;

      const pA = Math.min(
        currentParams.thermalPowerMW * 0.62,
        ((specA.nominalConductivity * Math.pow(uA, 2) * Math.pow(configA.magneticFieldTesla, 2) * configA.loadFactor * (1 - configA.loadFactor)) / 1e6) * channelVol
      );
      const pB = Math.min(
        currentParams.thermalPowerMW * 0.62,
        ((specB.nominalConductivity * Math.pow(uB, 2) * Math.pow(configB.magneticFieldTesla, 2) * configB.loadFactor * (1 - configB.loadFactor)) / 1e6) * channelVol
      );

      const effA = currentParams.thermalPowerMW > 0 ? (pA / currentParams.thermalPowerMW) * 100 : 0;
      const effB = currentParams.thermalPowerMW > 0 ? (pB / currentParams.thermalPowerMW) * 100 : 0;

      points.push({
        flowPercent: `${percent}%`,
        efficiencyA: Number(effA.toFixed(1)),
        efficiencyB: Number(effB.toFixed(1)),
        powerA: Number(pA.toFixed(2)),
        powerB: Number(pB.toFixed(2)),
        velocityA: Math.round(uA),
        velocityB: Math.round(uB)
      });
    }
    return points;
  }, [configA, configB, specA, specB, currentParams.thermalPowerMW]);

  // 2. Arrhenius Alloy Corrosion & Wall Degradation Dynamics
  // R = A * exp(-Ea / (R_gas * T_K)) * (1.0 + u^0.5 * 0.15)
  const corrosionCurveData = useMemo(() => {
    const tempsC = [500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100, 1150, 1200, 1250, 1300];
    const R_gas = 8.314;

    const velA = configA.inletVelocity;
    const velB = configB.inletVelocity;

    const velMultA = 1.0 + Math.sqrt(Math.min(velA, 50)) * 0.15;
    const velMultB = 1.0 + Math.sqrt(Math.min(velB, 50)) * 0.15;

    return tempsC.map(tC => {
      const tK = tC + 273.15;

      // Rate for Inconel
      const rateInconel = ALLOY_SPECS['Inconel 718 Superalloy'].preFactor * Math.exp(-ALLOY_SPECS['Inconel 718 Superalloy'].activationEnergy / (R_gas * tK)) * velMultA * 1000;
      // Rate for SiC Composite
      const rateSiC = ALLOY_SPECS['Silicon Carbide Composite'].preFactor * Math.exp(-ALLOY_SPECS['Silicon Carbide Composite'].activationEnergy / (R_gas * tK)) * velMultB * 1000;
      // Rate for Hastelloy-N
      const rateHastelloy = ALLOY_SPECS['Hastelloy-N Matrix'].preFactor * Math.exp(-ALLOY_SPECS['Hastelloy-N Matrix'].activationEnergy / (R_gas * tK)) * velMultB * 1000;

      return {
        tempC: `${tC}°C`,
        inconelRate: Number(rateInconel.toFixed(4)),
        sicRate: Number(rateSiC.toFixed(4)),
        hastelloyRate: Number(rateHastelloy.toFixed(4))
      };
    });
  }, [configA.inletVelocity, configB.inletVelocity]);

  // 3. Fission Wigner-Way Thermal Decay Comparison
  // P_decay(t) = P_0 * 0.066 * t^(-0.2)
  const decayComparisonData = useMemo(() => {
    const times = [1, 2, 5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600];
    const P0 = currentParams.thermalPowerMW || 150;

    return times.map(tSec => {
      const baseDecayMW = P0 * 0.066 * Math.pow(tSec, -0.2);
      const coolingRateA = baseDecayMW * (tSec > 5 ? 1.05 : 1.0);
      const coolingRateB = baseDecayMW * (tSec > 4.8 ? 0.78 : 1.0);

      return {
        timeSeconds: tSec,
        timeLabel: tSec < 60 ? `${tSec}s` : `${Math.round(tSec / 60)}m`,
        decayHeatA: Number(coolingRateA.toFixed(2)),
        decayHeatB: Number(coolingRateB.toFixed(2)),
        safeConvectionLimit: Number((P0 * 0.045).toFixed(2))
      };
    });
  }, [currentParams.thermalPowerMW]);

  // Dynamic Lifespan and Degradation calculations based on user sliders
  const currentAlloySpec = ALLOY_SPECS[selectedAlloy];
  const { calculatedCorrosionRate, allocableWearMargin, calculatedLifespanYears, wallLifespanData } = useMemo(() => {
    const tK = coreTempCelsius + 273.15;
    const R_gas = 8.314;
    const vel = configB.coolantId === 'acid_molten_salt' ? configB.inletVelocity : 3.0;
    const velMult = 1.0 + Math.sqrt(Math.min(vel, 50)) * 0.15;

    // Corrosion rate in mm / year (Arrhenius equation)
    const rate = currentAlloySpec.preFactor * Math.exp(-currentAlloySpec.activationEnergy / (R_gas * tK)) * velMult * 1000;
    const rateCapped = Math.max(0.0001, Number(rate.toFixed(4)));

    const margin = Math.max(0.1, initialThicknessMm - criticalFailureThicknessMm);
    const lifespan = Number((margin / rateCapped).toFixed(2));

    // Generate time series for Recharts
    const maxYears = Math.min(60, Math.max(10, Math.ceil(lifespan * 1.35)));
    const step = maxYears <= 20 ? 1 : 2;
    const data = [];

    for (let yr = 0; yr <= maxYears; yr += step) {
      const thickness = Math.max(0, initialThicknessMm - (rateCapped * yr));
      data.push({
        year: yr,
        yearLabel: `${yr} yrs`,
        wallThicknessMm: Number(thickness.toFixed(2)),
        criticalThresholdMm: criticalFailureThicknessMm
      });
    }

    return {
      calculatedCorrosionRate: rateCapped,
      allocableWearMargin: Number(margin.toFixed(1)),
      calculatedLifespanYears: lifespan,
      wallLifespanData: data
    };
  }, [selectedAlloy, currentAlloySpec, coreTempCelsius, initialThicknessMm, criticalFailureThicknessMm, configB]);

  return (
    <div className="space-y-4">
      {/* Top Banner with Presets and Metric Tabs */}
      <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-amber-950/40 border border-slate-800 rounded-xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <h3 className="font-comic font-bold text-sm text-white uppercase tracking-wide">
                Physics Comparison Mode: Dual Coolant Performance
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Plot and contrast two distinct MHD coolant datasets on the same Recharts graph to visualize efficiency and power deltas.
              </p>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => setComparisonMetric('efficiency_curve')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition whitespace-nowrap ${
                comparisonMetric === 'efficiency_curve' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Efficiency & Power Curves
            </button>
            <button
              onClick={() => setComparisonMetric('wall_lifespan')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition whitespace-nowrap ${
                comparisonMetric === 'wall_lifespan' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⏳ Wall-Thinning Lifespan
            </button>
            <button
              onClick={() => setComparisonMetric('corrosion_wear')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition whitespace-nowrap ${
                comparisonMetric === 'corrosion_wear' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Arrhenius Alloy Wear
            </button>
            <button
              onClick={() => setComparisonMetric('decay_wigner')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition whitespace-nowrap ${
                comparisonMetric === 'decay_wigner' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wigner-Way Decay
            </button>
          </div>
        </div>

        {/* Quick Presets Strip */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto text-[11px] font-mono">
          <span className="text-slate-500 uppercase text-[10px] shrink-0">1-Click Presets:</span>
          <button
            onClick={() => handleApplyPreset('he_vs_salt')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition shrink-0"
          >
            ⚡ He-Xe Gas vs Liquid Salt
          </button>
          <button
            onClick={() => handleApplyPreset('salt_vs_lead')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition shrink-0"
          >
            🧪 Liquid Salt vs Lead-Bismuth (LBE)
          </button>
          <button
            onClick={() => handleApplyPreset('high_rebco')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 transition shrink-0"
          >
            🧲 10T REBCO vs 4T Baseline Stator
          </button>
        </div>
      </div>

      {/* Configuration Controls: Side-by-Side Dual Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Config A: Cyan Theme */}
        <div className="comic-box p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/10 space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-comic font-bold text-xs uppercase text-cyan-300 tracking-wider">
                Dataset A: {specA.name.split(' ')[0]}
              </span>
            </div>

            <button
              onClick={() => {
                onApplyParams({
                  coolantId: configA.coolantId,
                  magneticFieldTesla: configA.magneticFieldTesla,
                  inletVelocity: configA.inletVelocity,
                  loadFactor: configA.loadFactor
                });
              }}
              className="text-[10px] font-comic px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" /> Apply to 3D Simulation
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Coolant Fluid</label>
              <select
                value={configA.coolantId}
                onChange={e => {
                  const newId = e.target.value as CoolantType;
                  setConfigA(prev => ({
                    ...prev,
                    coolantId: newId,
                    inletVelocity: newId === 'he_xe_plasma' ? 950 : 40
                  }));
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
              >
                <option value="he_xe_plasma">Supersonic He-Xe (K-seeded)</option>
                <option value="acid_molten_salt">Liquid Acid-State Salt</option>
                <option value="liquid_lead_bismuth">Liquid Lead-Bismuth (LBE)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Stator Field</span>
                <span className="text-cyan-300 font-bold">{configA.magneticFieldTesla} T</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={configA.magneticFieldTesla}
                onChange={e => setConfigA(prev => ({ ...prev, magneticFieldTesla: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Inlet Velocity</span>
                <span className="text-cyan-300 font-bold">{configA.inletVelocity} m/s</span>
              </div>
              <input
                type="range"
                min={configA.coolantId === 'he_xe_plasma' ? 200 : 5}
                max={configA.coolantId === 'he_xe_plasma' ? 1600 : 100}
                step={configA.coolantId === 'he_xe_plasma' ? 25 : 2}
                value={configA.inletVelocity}
                onChange={e => setConfigA(prev => ({ ...prev, inletVelocity: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Load Factor K</span>
                <span className="text-cyan-300 font-bold">{configA.loadFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={configA.loadFactor}
                onChange={e => setConfigA(prev => ({ ...prev, loadFactor: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Quick Metrics Bar A */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/80 rounded-lg text-center font-mono border border-slate-800">
            <div>
              <div className="text-[9px] text-slate-500 uppercase">Power Output</div>
              <div className="text-xs font-bold text-cyan-300">{physicsA.powerMWe} MWe</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase">Efficiency η</div>
              <div className="text-xs font-bold text-cyan-300">{physicsA.efficiency}%</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase">Hartmann Ha</div>
              <div className="text-xs font-bold text-cyan-300">{physicsA.hartmann}</div>
            </div>
          </div>
        </div>

        {/* Config B: Amber Theme */}
        <div className="comic-box p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-comic font-bold text-xs uppercase text-amber-300 tracking-wider">
                Dataset B: {specB.name.split(' ')[0]}
              </span>
            </div>

            <button
              onClick={() => {
                onApplyParams({
                  coolantId: configB.coolantId,
                  magneticFieldTesla: configB.magneticFieldTesla,
                  inletVelocity: configB.inletVelocity,
                  loadFactor: configB.loadFactor
                });
              }}
              className="text-[10px] font-comic px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" /> Apply to 3D Simulation
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Coolant Fluid</label>
              <select
                value={configB.coolantId}
                onChange={e => {
                  const newId = e.target.value as CoolantType;
                  setConfigB(prev => ({
                    ...prev,
                    coolantId: newId,
                    inletVelocity: newId === 'he_xe_plasma' ? 950 : 40
                  }));
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
              >
                <option value="acid_molten_salt">Liquid Acid-State Salt</option>
                <option value="he_xe_plasma">Supersonic He-Xe (K-seeded)</option>
                <option value="liquid_lead_bismuth">Liquid Lead-Bismuth (LBE)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Stator Field</span>
                <span className="text-amber-300 font-bold">{configB.magneticFieldTesla} T</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={configB.magneticFieldTesla}
                onChange={e => setConfigB(prev => ({ ...prev, magneticFieldTesla: parseFloat(e.target.value) }))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Inlet Velocity</span>
                <span className="text-amber-300 font-bold">{configB.inletVelocity} m/s</span>
              </div>
              <input
                type="range"
                min={configB.coolantId === 'he_xe_plasma' ? 200 : 5}
                max={configB.coolantId === 'he_xe_plasma' ? 1600 : 100}
                step={configB.coolantId === 'he_xe_plasma' ? 25 : 2}
                value={configB.inletVelocity}
                onChange={e => setConfigB(prev => ({ ...prev, inletVelocity: parseFloat(e.target.value) }))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Load Factor K</span>
                <span className="text-amber-300 font-bold">{configB.loadFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={configB.loadFactor}
                onChange={e => setConfigB(prev => ({ ...prev, loadFactor: parseFloat(e.target.value) }))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Quick Metrics Bar B */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/80 rounded-lg text-center font-mono border border-slate-800">
            <div>
              <div className="text-[9px] text-slate-500 uppercase">Power Output</div>
              <div className="text-xs font-bold text-amber-300">{physicsB.powerMWe} MWe</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase">Efficiency η</div>
              <div className="text-xs font-bold text-amber-300">{physicsB.efficiency}%</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase">Hartmann Ha</div>
              <div className="text-xs font-bold text-amber-300">{physicsB.hartmann}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Delta KPI Indicator Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Power Delta (ΔP)</div>
          <div className={`text-sm font-bold ${deltaPower >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {deltaPower >= 0 ? `+${deltaPower}` : deltaPower} MWe
          </div>
          <div className="text-[9px] text-slate-500">Dataset A vs Dataset B</div>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Efficiency Delta (Δη)</div>
          <div className={`text-sm font-bold ${deltaEff >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {deltaEff >= 0 ? `+${deltaEff}` : deltaEff}%
          </div>
          <div className="text-[9px] text-slate-500">MHD Direct Conversion</div>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Hartmann Ratio (Ha_A / Ha_B)</div>
          <div className="text-sm font-bold text-white">
            {physicsB.hartmann > 0 ? (physicsA.hartmann / physicsB.hartmann).toFixed(2) : 'N/A'}×
          </div>
          <div className="text-[9px] text-slate-500">Turbulence Suppression</div>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase">Flow Regimes</div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {physicsA.mach === 'Subsonic' ? 'Liquid State' : `Mach ${physicsA.mach}`} vs {physicsB.mach === 'Subsonic' ? 'Liquid State' : `Mach ${physicsB.mach}`}
          </div>
          <div className="text-[9px] text-slate-500">Compressibility Limit</div>
        </div>
      </div>

      {/* The Overlaid Recharts Visualization Canvas */}
      <div className="comic-box p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
              {comparisonMetric === 'efficiency_curve' && 'Overlaid Efficiency Curves & Power Output (Dataset A vs Dataset B)'}
              {comparisonMetric === 'wall_lifespan' && `Conduit Wall Degradation Tracking: ${selectedAlloy}`}
              {comparisonMetric === 'corrosion_wear' && 'Arrhenius Alloy Degradation & Wall Thinning Rate (500°C – 1300°C)'}
              {comparisonMetric === 'decay_wigner' && 'Overlaid Wigner-Way Post-Scram Thermal Decay Curves'}
            </h4>
          </div>

          {(comparisonMetric === 'corrosion_wear' || comparisonMetric === 'wall_lifespan') && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Inspected Alloy:</span>
              <select
                value={selectedAlloy}
                onChange={e => setSelectedAlloy(e.target.value as AlloyType)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-amber-300"
              >
                <option value="Hastelloy-N Matrix">Hastelloy-N Matrix (MSRE Standard)</option>
                <option value="Inconel 718 Superalloy">Inconel 718 Superalloy</option>
                <option value="Silicon Carbide Composite">Silicon Carbide (SiC/SiC)</option>
              </select>
            </div>
          )}

          {comparisonMetric === 'efficiency_curve' && (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> η_A: {specA.name.split(' ')[0]}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" /> η_B: {specB.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Sliders Bar when Wall Lifespan Mode is Selected */}
        {comparisonMetric === 'wall_lifespan' && (
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Reactor Core Target Temp</span>
                  <span className="text-amber-300 font-bold">{coreTempCelsius}°C</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="1500"
                  step="50"
                  value={coreTempCelsius}
                  onChange={e => setCoreTempCelsius(parseInt(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Initial Conduit Wall</span>
                  <span className="text-cyan-300 font-bold">{initialThicknessMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="10.0"
                  max="50.0"
                  step="1.0"
                  value={initialThicknessMm}
                  onChange={e => setInitialThicknessMm(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Critical Failure Boundary</span>
                  <span className="text-rose-400 font-bold">{criticalFailureThicknessMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="15.0"
                  step="0.5"
                  value={criticalFailureThicknessMm}
                  onChange={e => setCriticalFailureThicknessMm(parseFloat(e.target.value))}
                  className="w-full accent-rose-400"
                />
              </div>
            </div>

            {/* Structural metric displays matching Streamlit tab 4 */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-center font-mono">
              <div className="p-1.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">Estimated Loss Rate</div>
                <div className="text-xs font-bold text-amber-300">{calculatedCorrosionRate} mm / Year</div>
              </div>

              <div className="p-1.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">Total Wear Margin</div>
                <div className="text-xs font-bold text-cyan-300">{allocableWearMargin} mm</div>
              </div>

              <div className="p-1.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase">Projected System Lifespan</div>
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                  <span>{calculatedLifespanYears} Years</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-semibold ${
                    calculatedLifespanYears < 5 ? 'bg-rose-950 text-rose-300 border border-rose-500' : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                  }`}>
                    {calculatedLifespanYears < 5 ? 'Critical' : 'Safe'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-[250px] w-full pt-1">
          {comparisonMetric === 'efficiency_curve' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyCurveData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis
                  dataKey="flowPercent"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Normalized Flow Velocity (%)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1a',
                    borderColor: '#0284c7',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0'
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === 'efficiencyA') return [`${val}%`, `Config A Efficiency (${specA.name})`];
                    if (name === 'efficiencyB') return [`${val}%`, `Config B Efficiency (${specB.name})`];
                    if (name === 'powerA') return [`${val} MWe`, 'Config A Power'];
                    if (name === 'powerB') return [`${val} MWe`, 'Config B Power'];
                    return [val, name];
                  }}
                  labelFormatter={(lbl) => `Flow Rate: ${lbl} of max velocity`}
                />
                <Line
                  type="monotone"
                  dataKey="efficiencyA"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={false}
                  name="efficiencyA"
                />
                <Line
                  type="monotone"
                  dataKey="efficiencyB"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={false}
                  name="efficiencyB"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {comparisonMetric === 'wall_lifespan' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wallLifespanData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis
                  dataKey="year"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Continuous High-Temperature Operation (Years)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit=" mm"
                  domain={[0, initialThicknessMm + 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1a',
                    borderColor: '#0284c7',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0'
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === 'wallThicknessMm') return [`${val} mm`, `Predicted ${selectedAlloy} Thickness`];
                    if (name === 'criticalThresholdMm') return [`${val} mm`, 'Critical Failure Threshold'];
                    return [val, name];
                  }}
                  labelFormatter={(yr) => `Operating Elapsed Time: ${yr} Years`}
                />
                <Line
                  type="monotone"
                  dataKey="wallThicknessMm"
                  stroke="#00B0FF"
                  strokeWidth={2.5}
                  dot={false}
                  name="wallThicknessMm"
                />
                <ReferenceLine
                  y={criticalFailureThicknessMm}
                  stroke="#FF1744"
                  strokeDasharray="4 3"
                  label={{
                    value: `Critical Failure Boundary (${criticalFailureThicknessMm}mm)`,
                    fill: '#FF1744',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
                {calculatedLifespanYears <= 60 && (
                  <ReferenceDot
                    x={calculatedLifespanYears}
                    y={criticalFailureThicknessMm}
                    r={6}
                    fill="#FF1744"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}

          {comparisonMetric === 'corrosion_wear' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={corrosionCurveData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis
                  dataKey="tempC"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit=" mm/yr"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1a',
                    borderColor: '#f59e0b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0'
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === 'inconelRate') return [`${val} mm/yr`, 'Inconel 718 Superalloy'];
                    if (name === 'sicRate') return [`${val} mm/yr`, 'Silicon Carbide (SiC/SiC)'];
                    if (name === 'hastelloyRate') return [`${val} mm/yr`, 'Hastelloy-N Matrix'];
                    return [val, name];
                  }}
                  labelFormatter={(temp) => `Core Fluid Temperature: ${temp}`}
                />
                <Line
                  type="monotone"
                  dataKey="inconelRate"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  name="inconelRate"
                />
                <Line
                  type="monotone"
                  dataKey="hastelloyRate"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={false}
                  name="hastelloyRate"
                />
                <Line
                  type="monotone"
                  dataKey="sicRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  name="sicRate"
                />
                <ReferenceLine
                  y={0.05}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Max Allowable Thinning (0.05 mm/yr)',
                    fill: '#ef4444',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {comparisonMetric === 'decay_wigner' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decayComparisonData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit=" MW"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1a',
                    borderColor: '#f59e0b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0'
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === 'decayHeatA') return [`${val} MWth`, 'Gas Core Loop Scram Cooling'];
                    if (name === 'decayHeatB') return [`${val} MWth`, 'Liquid Salt Vault Passive Drain'];
                    return [val, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="decayHeatA"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  name="decayHeatA"
                />
                <Line
                  type="monotone"
                  dataKey="decayHeatB"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  name="decayHeatB"
                />
                <ReferenceLine
                  y={decayComparisonData[0]?.safeConvectionLimit}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Passive Vault Dissipation Limit',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Physics Explainer Footer */}
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[11px] font-sans text-slate-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              {comparisonMetric === 'efficiency_curve' && (
                <>
                  <strong className="text-white">Direct Efficiency Comparison:</strong> Supersonic Helium-Xenon gas relies on high sonic kinetic velocity (u ≈ 950 m/s) with a broader efficiency curve across Mach regimes, whereas liquid actinide molten salts reach peak direct efficiency at low velocity (u ≈ 45 m/s) due to their three-fold higher electrical conductivity (1200 S/m vs 450 S/m).
                </>
              )}
              {comparisonMetric === 'wall_lifespan' && (
                <>
                  <strong className="text-white">Structural Failure Threshold Projection:</strong> Linear degradation model tracking remaining pipe wall thickness over continuous operating years. Lifespan = (Initial Wall Thickness - Critical Failure Threshold) / Arrhenius Corrosion Rate. Critical threshold crossing points trigger scheduled containment recertification.
                </>
              )}
              {comparisonMetric === 'corrosion_wear' && (
                <>
                  <strong className="text-white">Arrhenius Degradation Model:</strong> Wall corrosion rate R = A · exp(-Ea / (R_g · T)) · (1 + √u · 0.15). Hastelloy-N provides low nickel oxidation in molten fluorides, while Silicon Carbide (SiC/SiC) composite remains virtually corrosion-proof up to 1350°C.
                </>
              )}
              {comparisonMetric === 'decay_wigner' && (
                <>
                  <strong className="text-white">Wigner-Way Fission Decay Physics:</strong> Post-scram residual heat P(t) = P₀ × 0.066 × t^-0.2 drops fuel heat release to safe natural-convection vault levels in under 3 minutes with zero active AC electricity required.
                </>
              )}
            </span>
          </div>

          {comparisonMetric === 'corrosion_wear' && (
            <div className="shrink-0 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Pipe Wall Lifespan</div>
              <div className="text-xs font-bold text-amber-300">{calculatedLifespanYears} Years</div>
              <div className="text-[9px] text-slate-500">Until threshold limit</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
