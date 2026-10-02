import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { Shield, Flame, AlertTriangle, Send, CheckCircle2, Info, ArrowUpRight, Activity, Zap } from 'lucide-react';
import { ReactorParameters } from '../types/smr';

interface CorrosionDynamicsPanelProps {
  currentParams?: ReactorParameters;
}

export type AlloyType = 'Nickel-Chromium Superalloy' | 'Silicon Carbide Composite' | 'Hastelloy-N Matrix';

interface AlloyProperties {
  name: AlloyType;
  commonName: string;
  preFactorA: number;
  activationEnergyEa: number; // J/mol
  maxServiceTempC: number;
  yieldStrengthMPa: number;
  chemicalAffinity: string;
  description: string;
  colorHex: string;
}

export const ALLOY_REGISTRY: Record<AlloyType, AlloyProperties> = {
  'Nickel-Chromium Superalloy': {
    name: 'Nickel-Chromium Superalloy',
    commonName: 'Inconel 718 Superalloy',
    preFactorA: 0.08,
    activationEnergyEa: 45000,
    maxServiceTempC: 950,
    yieldStrengthMPa: 1100,
    chemicalAffinity: 'High oxidation resistance, moderate liquid fluoride dissolution at >900°C',
    description: 'Precipitation-hardened nickel-chromium matrix designed for extreme thermomechanical stresses.',
    colorHex: '#38bdf8'
  },
  'Silicon Carbide Composite': {
    name: 'Silicon Carbide Composite',
    commonName: 'SiC/SiC Ceramic Composite',
    preFactorA: 0.01,
    activationEnergyEa: 60000,
    maxServiceTempC: 1350,
    yieldStrengthMPa: 450,
    chemicalAffinity: 'Virtually inert to molten fluoride salts, zero nickel leach, high radiation tolerance',
    description: 'Continuous silicon-carbide fiber reinforced ceramic matrix with near-zero chemical corrosion.',
    colorHex: '#10b981'
  },
  'Hastelloy-N Matrix': {
    name: 'Hastelloy-N Matrix',
    commonName: 'Hastelloy-N (MSRE Standard)',
    preFactorA: 0.04,
    activationEnergyEa: 38000,
    maxServiceTempC: 1100,
    yieldStrengthMPa: 720,
    chemicalAffinity: 'Formulated for molten FLiBe and UF4 salts; resistant to tellurium intergranular cracking',
    description: 'Oak Ridge National Laboratory benchmark superalloy formulated for high-temperature actinide salts.',
    colorHex: '#f59e0b'
  }
};

const GAS_CONSTANT_R = 8.314; // J/(mol·K)

export const CorrosionDynamicsPanel: React.FC<CorrosionDynamicsPanelProps> = ({ currentParams }) => {
  const [selectedAlloy, setSelectedAlloy] = useState<AlloyType>('Hastelloy-N Matrix');
  const [tempMinC, setTempMinC] = useState<number>(500);
  const [tempMaxC, setTempMaxC] = useState<number>(1400);
  const [targetTempC, setTargetTempC] = useState<number>(950);
  const [flowVelocityMps, setFlowVelocityMps] = useState<number>(3.0);
  const [initialThicknessMm, setInitialThicknessMm] = useState<number>(25.0);
  const [criticalFailureThicknessMm, setCriticalFailureThicknessMm] = useState<number>(8.0);
  const [viewMode, setViewMode] = useState<'rate_vs_temp' | 'wall_lifespan'>('rate_vs_temp');
  const [alertSent, setAlertSent] = useState<boolean>(false);

  const activeAlloy = ALLOY_REGISTRY[selectedAlloy];

  // Arrhenius rate calculation function: R = A * exp(-Ea / (R*T)) * (1 + sqrt(u) * 0.15)
  const calcRate = (alloy: AlloyProperties, tempC: number, velocity: number) => {
    const tempK = tempC + 273.15;
    const velocityMultiplier = 1.0 + Math.sqrt(Math.max(0.1, velocity)) * 0.15;
    const rate = alloy.preFactorA * Math.exp(-alloy.activationEnergyEa / (GAS_CONSTANT_R * tempK)) * velocityMultiplier * 1000;
    return Math.max(0.0001, rate);
  };

  // Live evaluated metrics for the current target operating state
  const currentWearRateMmYr = useMemo(() => {
    return Number(calcRate(activeAlloy, targetTempC, flowVelocityMps).toFixed(4));
  }, [activeAlloy, targetTempC, flowVelocityMps]);

  const allocableWearMarginMm = useMemo(() => {
    return Number(Math.max(0.1, initialThicknessMm - criticalFailureThicknessMm).toFixed(1));
  }, [initialThicknessMm, criticalFailureThicknessMm]);

  const projectedLifespanYears = useMemo(() => {
    return Number((allocableWearMarginMm / currentWearRateMmYr).toFixed(2));
  }, [allocableWearMarginMm, currentWearRateMmYr]);

  const isCriticalLifespan = projectedLifespanYears < 5.0;

  // Multi-point temperature range dataset for Arrhenius curve
  const arrheniusRateData = useMemo(() => {
    const points = [];
    const step = 50;
    for (let t = tempMinC; t <= tempMaxC; t += step) {
      const rateInconel = calcRate(ALLOY_REGISTRY['Nickel-Chromium Superalloy'], t, flowVelocityMps);
      const rateSiC = calcRate(ALLOY_REGISTRY['Silicon Carbide Composite'], t, flowVelocityMps);
      const rateHastelloy = calcRate(ALLOY_REGISTRY['Hastelloy-N Matrix'], t, flowVelocityMps);

      points.push({
        tempC: `${t}°C`,
        tempNum: t,
        inconelRate: Number(rateInconel.toFixed(4)),
        sicRate: Number(rateSiC.toFixed(4)),
        hastelloyRate: Number(rateHastelloy.toFixed(4)),
        activeRate: Number(calcRate(activeAlloy, t, flowVelocityMps).toFixed(4)),
        allowableMax: 0.05
      });
    }
    return points;
  }, [tempMinC, tempMaxC, flowVelocityMps, activeAlloy]);

  // Wall degradation time series array
  const lifespanTimelineData = useMemo(() => {
    const maxYears = Math.min(60, Math.max(10, Math.ceil(projectedLifespanYears * 1.35)));
    const step = maxYears <= 20 ? 1 : 2;
    const points = [];

    for (let yr = 0; yr <= maxYears; yr += step) {
      const thickness = Math.max(0, initialThicknessMm - (currentWearRateMmYr * yr));
      points.push({
        year: yr,
        yearLabel: `${yr} yrs`,
        wallThicknessMm: Number(thickness.toFixed(2)),
        criticalThresholdMm: criticalFailureThicknessMm
      });
    }
    return points;
  }, [projectedLifespanYears, initialThicknessMm, currentWearRateMmYr, criticalFailureThicknessMm]);

  const handleDispatchEmergencyAlert = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Arrhenius Formulation */}
      <div className="p-3.5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border border-slate-800 rounded-xl space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h3 className="font-comic font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                <span>Material Corrosion Dynamics & Arrhenius Modeling</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-mono">
                  ASME Sec III Safety
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Predict high-temperature acid molten-salt and liquid-metal wall degradation using kinetic activation barriers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('rate_vs_temp')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition ${
                viewMode === 'rate_vs_temp' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Arrhenius Rates (mm/yr)
            </button>
            <button
              onClick={() => setViewMode('wall_lifespan')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition ${
                viewMode === 'wall_lifespan' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⏳ Wall Lifespan Timeline
            </button>
          </div>
        </div>

        {/* Mathematical Equation Display Strip */}
        <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono">
          <div className="text-cyan-300 flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">Arrhenius Equation:</span>
            <span>R = A · exp[-E_a / (R_g · T)] · (1 + √u · 0.15)</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Active: <span className="text-amber-300">{activeAlloy.commonName}</span> | Ea = <span className="text-rose-300">{activeAlloy.activationEnergyEa / 1000} kJ/mol</span> | A = <span className="text-cyan-300">{activeAlloy.preFactorA}</span>
          </div>
        </div>
      </div>

      {/* Control Sliders and Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Column 1: Alloy Selection & Properties */}
        <div className="comic-box p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-comic font-bold uppercase text-slate-200">
              Containment Core Alloy
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
              Max {activeAlloy.maxServiceTempC}°C
            </span>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Select Structural Material</label>
            <select
              value={selectedAlloy}
              onChange={e => setSelectedAlloy(e.target.value as AlloyType)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono"
            >
              <option value="Hastelloy-N Matrix">Hastelloy-N Matrix (Oak Ridge MSRE Benchmark)</option>
              <option value="Nickel-Chromium Superalloy">Inconel 718 Nickel-Chromium Superalloy</option>
              <option value="Silicon Carbide Composite">Silicon Carbide (SiC/SiC) Ceramic Composite</option>
            </select>
          </div>

          <div className="p-2 bg-slate-950 rounded text-[11px] font-sans text-slate-300 space-y-1">
            <p className="text-slate-400 leading-snug">{activeAlloy.description}</p>
            <div className="text-[10px] font-mono text-cyan-400 pt-1 border-t border-slate-800/80">
              Chemical Affinity: {activeAlloy.chemicalAffinity}
            </div>
          </div>
        </div>

        {/* Column 2: Temperature Range & Operating Points */}
        <div className="comic-box p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-comic font-bold uppercase text-slate-200">
              Temperature Dynamics
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">
              {targetTempC}°C ({targetTempC + 273}K)
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Target Core Temperature</span>
              <span className="text-amber-300 font-bold">{targetTempC}°C</span>
            </div>
            <input
              type="range"
              min="500"
              max="1500"
              step="25"
              value={targetTempC}
              onChange={e => setTargetTempC(parseInt(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Range Min</span>
                <span className="text-slate-300">{tempMinC}°C</span>
              </div>
              <input
                type="range"
                min="400"
                max="800"
                step="50"
                value={tempMinC}
                onChange={e => setTempMinC(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Range Max</span>
                <span className="text-slate-300">{tempMaxC}°C</span>
              </div>
              <input
                type="range"
                min="1000"
                max="1600"
                step="50"
                value={tempMaxC}
                onChange={e => setTempMaxC(parseInt(e.target.value))}
                className="w-full accent-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Wall Thickness & Flow Velocity */}
        <div className="comic-box p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-comic font-bold uppercase text-slate-200">
              Conduit Dimensions & Flow
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              {flowVelocityMps} m/s
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Acid/Liquid Flow Velocity</span>
              <span className="text-cyan-300 font-bold">{flowVelocityMps.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15.0"
              step="0.5"
              value={flowVelocityMps}
              onChange={e => setFlowVelocityMps(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Initial Wall</span>
                <span className="text-cyan-300 font-bold">{initialThicknessMm.toFixed(1)}mm</span>
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
                <span>Failure Limit</span>
                <span className="text-rose-400 font-bold">{criticalFailureThicknessMm.toFixed(1)}mm</span>
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
        </div>
      </div>

      {/* Real-time Structural Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl font-mono text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Estimated Material Loss Rate</div>
          <div className="text-lg font-bold text-amber-300">{currentWearRateMmYr} mm / Year</div>
          <div className="text-[10px] text-slate-500">at {targetTempC}°C & {flowVelocityMps} m/s</div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl font-mono text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Wear Margin Allowance</div>
          <div className="text-lg font-bold text-cyan-300">{allocableWearMarginMm} mm</div>
          <div className="text-[10px] text-slate-500">{initialThicknessMm}mm initial - {criticalFailureThicknessMm}mm limit</div>
        </div>

        <div className={`p-3 border rounded-xl font-mono text-center transition ${
          isCriticalLifespan ? 'bg-rose-950/40 border-rose-500/60' : 'bg-emerald-950/30 border-emerald-500/40'
        }`}>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Projected Conduit Lifespan</div>
          <div className={`text-lg font-bold flex items-center justify-center gap-1.5 ${
            isCriticalLifespan ? 'text-rose-400' : 'text-emerald-300'
          }`}>
            <span>{projectedLifespanYears} Years</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-semibold ${
              isCriticalLifespan ? 'bg-rose-900/80 text-white' : 'bg-emerald-900/80 text-emerald-200'
            }`}>
              {isCriticalLifespan ? 'Critical Risk' : 'Safe Horizon'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isCriticalLifespan ? 'Containment integrity breach predicted < 5 yrs' : 'Exceeds standard 5-year overhaul interval'}
          </div>
        </div>
      </div>

      {/* Emergency Alert Banner (Triggered when lifespan < 5.0 years) */}
      {isCriticalLifespan && (
        <div className="p-3 bg-rose-950/60 border border-rose-500 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-comic font-bold text-rose-200 uppercase tracking-wider block">
                🚨 CRITICAL WARNING: Projected Wall Lifespan Has Dropped to {projectedLifespanYears} Years!
              </span>
              <span className="text-slate-300 font-sans">
                Operating temperature ({targetTempC}°C) exceeds safe continuous corrosion boundaries for {activeAlloy.commonName}.
              </span>
            </div>
          </div>

          <button
            onClick={handleDispatchEmergencyAlert}
            disabled={alertSent}
            className={`px-3 py-1.5 font-comic text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 ${
              alertSent ? 'bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
            }`}
          >
            {alertSent ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Alert Dispatched
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Dispatch Out-of-Band Plant Alert
              </>
            )}
          </button>
        </div>
      )}

      {/* Recharts Graphical Canvas */}
      <div className="comic-box p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
              {viewMode === 'rate_vs_temp'
                ? `Arrhenius Corrosion Rate vs Core Temperature (${tempMinC}°C to ${tempMaxC}°C)`
                : `Conduit Wall Thickness Degradation Over Continuous Operational Years`}
            </h4>
          </div>

          {viewMode === 'rate_vs_temp' && (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Inconel 718
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Hastelloy-N
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> SiC/SiC
              </span>
            </div>
          )}
        </div>

        <div className="h-[260px] w-full pt-1">
          {viewMode === 'rate_vs_temp' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arrheniusRateData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis
                  dataKey="tempC"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Primary Fluid Temperature (°C)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit=" mm/yr"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1a',
                    borderColor: '#f43f5e',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0'
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === 'inconelRate') return [`${val} mm/yr`, 'Inconel 718'];
                    if (name === 'hastelloyRate') return [`${val} mm/yr`, 'Hastelloy-N Matrix'];
                    if (name === 'sicRate') return [`${val} mm/yr`, 'Silicon Carbide (SiC)'];
                    return [val, name];
                  }}
                  labelFormatter={(lbl) => `Operating Temp: ${lbl}`}
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
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lifespanTimelineData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
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
                    if (name === 'wallThicknessMm') return [`${val} mm`, `Predicted ${activeAlloy.commonName} Thickness`];
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
                {projectedLifespanYears <= 60 && (
                  <ReferenceDot
                    x={projectedLifespanYears}
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
        </div>

        {/* Detailed Material Science Insight Footer */}
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[11px] font-sans text-slate-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            {viewMode === 'rate_vs_temp' ? (
              <>
                <strong className="text-white">Alloy Kinetics Comparison:</strong> At temperatures above 950°C, exponential Arrhenius acceleration causes Nickel-Chromium superalloys to degrade up to 8× faster than Silicon Carbide composites. Ceramic matrix SiC/SiC maintains an activation barrier of 60 kJ/mol, suppressing fluoride chemical exchange even at 1300°C.
              </>
            ) : (
              <>
                <strong className="text-white">Structural Maintenance Horizon:</strong> Wall thickness reduces linearly as wear rate R acts on initial pipe thickness. When the remaining conduit wall breaches the {criticalFailureThicknessMm} mm safety limit (at year {projectedLifespanYears}), containment margins are exhausted and core channel replacement or operational temperature derating must occur.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
