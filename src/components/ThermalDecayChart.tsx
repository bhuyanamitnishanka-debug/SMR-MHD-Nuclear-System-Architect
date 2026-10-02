import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { ReactorParameters, ReactorTelemetry, COOLANT_SPECS } from '../types/smr';
import { Activity, Flame, Zap, TrendingUp, Sliders, ShieldCheck } from 'lucide-react';

interface ThermalDecayChartProps {
  params: ReactorParameters;
  telemetry: ReactorTelemetry;
}

export const ThermalDecayChart: React.FC<ThermalDecayChartProps> = ({ params, telemetry }) => {
  const [activeChartMode, setActiveChartMode] = useState<'mhd_power' | 'thermal_decay' | 'load_factor'>('mhd_power');

  const coolant = COOLANT_SPECS[params.coolantId];
  const B = params.magneticFieldTesla;
  const currentU = params.inletVelocity;
  const sigma = params.ionizationConductivity;
  const K = params.loadFactor;
  const P_th = params.thermalPowerMW;

  // 1. Generate Power vs Velocity Curve Data
  const mhdPowerData = useMemo(() => {
    const isGas = params.coolantId === 'he_xe_plasma';
    const minVel = isGas ? 200 : 5;
    const maxVel = isGas ? 1600 : 100;
    const step = isGas ? 50 : 2.5;

    const data = [];
    const channelVol = 0.43; // m^3

    for (let u = minVel; u <= maxVel; u += step) {
      // Calculate power for current B, 4T baseline, and 10T REBCO benchmark
      const pCurrent = Math.min(
        P_th * 0.62,
        ((sigma * Math.pow(u, 2) * Math.pow(B, 2) * K * (1 - K)) / 1e6) * channelVol
      );
      const pBaseline = Math.min(
        P_th * 0.62,
        ((sigma * Math.pow(u, 2) * Math.pow(4.0, 2) * K * (1 - K)) / 1e6) * channelVol
      );
      const pHighField = Math.min(
        P_th * 0.62,
        ((sigma * Math.pow(u, 2) * Math.pow(10.0, 2) * K * (1 - K)) / 1e6) * channelVol
      );

      data.push({
        velocity: Math.round(u),
        currentPower: Number(pCurrent.toFixed(2)),
        baselinePower: Number(pBaseline.toFixed(2)),
        highFieldPower: Number(pHighField.toFixed(2))
      });
    }
    return data;
  }, [B, currentU, sigma, K, P_th, params.coolantId]);

  // 2. Generate Nuclear Thermal Decay Heat Curve (Way-Wigner formula)
  // P_decay(t) = P_0 * 0.066 * [ t^(-0.2) - (t + T_0)^(-0.2) ]
  const thermalDecayData = useMemo(() => {
    const timePoints = [
      0.1, 0.5, 1, 2, 5, 10, 20, 30, 45, 60, 90, 120, 180, 300, 600, 1200, 1800, 3600
    ];

    const passiveSafeLimit = Number((P_th * 0.045).toFixed(2)); // Safe natural convection vault cooling limit (~4.5% of nominal)

    return timePoints.map(tSec => {
      // Way-Wigner decay fraction
      const fraction = 0.066 * (Math.pow(tSec, -0.2) - Math.pow(tSec + 1e7, -0.2));
      const decayHeatMW = Number((P_th * Math.min(1.0, fraction * 1.6)).toFixed(2));

      // Core Temperature in Kelvin (decaying towards vault ambient equilibrium)
      const baseTemp = coolant.operatingTempK;
      const decayRatio = decayHeatMW / P_th;
      const tempK = Math.round(550 + (baseTemp - 550) * Math.pow(decayRatio / 0.08, 0.4));

      return {
        timeSeconds: tSec,
        timeLabel: tSec < 60 ? `${tSec}s` : `${Math.round(tSec / 60)}m`,
        decayHeatMW,
        coreTempK: Math.max(550, tempK),
        passiveVaultCapacity: passiveSafeLimit
      };
    });
  }, [P_th, coolant.operatingTempK]);

  // 3. Generate Load Factor (K) Curve Data: K vs Output & Efficiency
  const loadFactorData = useMemo(() => {
    const data = [];
    const channelVol = 0.43;

    for (let kVal = 0.05; kVal <= 0.95; kVal += 0.05) {
      const kRounded = Number(kVal.toFixed(2));
      const pMWe = Math.min(
        P_th * 0.62,
        ((sigma * Math.pow(currentU, 2) * Math.pow(B, 2) * kRounded * (1 - kRounded)) / 1e6) * channelVol
      );
      const eff = P_th > 0 ? (pMWe / P_th) * 100 : 0;

      data.push({
        k: kRounded,
        mhdPower: Number(pMWe.toFixed(2)),
        efficiency: Number(eff.toFixed(1))
      });
    }
    return data;
  }, [P_th, currentU, B, sigma]);

  return (
    <div className="comic-box p-4 rounded-xl border border-slate-800 space-y-3">
      {/* Header with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
            Real-Time Electrodynamics & Thermal Decay Lab
          </h4>
        </div>

        {/* Mode Segmented Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveChartMode('mhd_power')}
            className={`px-2.5 py-1 text-[11px] font-comic rounded transition flex items-center gap-1 ${
              activeChartMode === 'mhd_power'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-cyan-300" />
            <span>u vs Power Output</span>
          </button>

          <button
            onClick={() => setActiveChartMode('thermal_decay')}
            className={`px-2.5 py-1 text-[11px] font-comic rounded transition flex items-center gap-1 ${
              activeChartMode === 'thermal_decay'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Thermal Decay</span>
          </button>

          <button
            onClick={() => setActiveChartMode('load_factor')}
            className={`px-2.5 py-1 text-[11px] font-comic rounded transition flex items-center gap-1 ${
              activeChartMode === 'load_factor'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3 text-violet-400" />
            <span>K MPPT Curve</span>
          </button>
        </div>
      </div>

      {/* Chart Display Container */}
      <div className="h-[220px] w-full pt-1">
        {activeChartMode === 'mhd_power' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mhdPowerData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="velocity"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                unit=" m/s"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                unit=" MWe"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090e1a',
                  borderColor: '#0284c7',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'currentPower') return [`${val} MWe`, `Current (${B}T)`];
                  if (name === 'baselinePower') return [`${val} MWe`, 'Baseline (4.0T)'];
                  if (name === 'highFieldPower') return [`${val} MWe`, 'High-Field (10.0T)'];
                  return [val, name];
                }}
                labelFormatter={(label) => `Inlet Flow Velocity: ${label} m/s`}
              />
              <Line
                type="monotone"
                dataKey="baselinePower"
                stroke="#475569"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="baselinePower"
              />
              <Line
                type="monotone"
                dataKey="highFieldPower"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="highFieldPower"
              />
              <Line
                type="monotone"
                dataKey="currentPower"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                name="currentPower"
              />
              {/* Highlight current operating point */}
              <ReferenceDot
                x={currentU}
                y={telemetry.mhdPowerMWe}
                r={6}
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChartMode === 'thermal_decay' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={thermalDecayData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="decayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                  borderColor: '#f43f5e',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#e2e8f0'
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'decayHeatMW') return [`${val} MWth`, 'Decay Heat'];
                  if (name === 'passiveVaultCapacity') return [`${val} MWth`, 'Passive Vault Limit'];
                  return [val, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="decayHeatMW"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#decayGrad)"
                name="decayHeatMW"
              />
              <ReferenceLine
                y={thermalDecayData[0]?.passiveVaultCapacity}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: 'Vault Passive Dissipation',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeChartMode === 'load_factor' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loadFactorData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="k"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                unit=" K"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                unit=" MWe"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090e1a',
                  borderColor: '#8b5cf6',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#e2e8f0'
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'mhdPower') return [`${val} MWe`, 'Output Power'];
                  if (name === 'efficiency') return [`${val}%`, 'Efficiency'];
                  return [val, name];
                }}
                labelFormatter={(k) => `Load Factor K = ${k}`}
              />
              <Line
                type="monotone"
                dataKey="mhdPower"
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={false}
                name="mhdPower"
              />
              {/* Highlight K = 0.50 theoretical maximum */}
              <ReferenceLine
                x={0.50}
                stroke="#38bdf8"
                strokeDasharray="3 3"
                label={{
                  value: 'MPPT (K = 0.50)',
                  fill: '#38bdf8',
                  fontSize: 10,
                  position: 'insideTop'
                }}
              />
              <ReferenceDot
                x={Number(K.toFixed(2))}
                y={telemetry.mhdPowerMWe}
                r={6}
                fill="#8b5cf6"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Telemetry Footer Callout */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          {activeChartMode === 'mhd_power' && (
            <>
              <span className="text-cyan-400 font-bold">● Current: {B}T @ {currentU} m/s</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400">--- 10.0T REBCO</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">-- 4.0T Baseline</span>
            </>
          )}
          {activeChartMode === 'thermal_decay' && (
            <>
              <span className="text-rose-400 font-semibold">● Way-Wigner Decay Heat</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-semibold">--- Safe Annular Vault Convection</span>
            </>
          )}
          {activeChartMode === 'load_factor' && (
            <>
              <span className="text-violet-400 font-semibold">● Active K: {K.toFixed(2)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">Apex Maximum: K = 0.50</span>
            </>
          )}
        </div>

        <div className="text-slate-300 font-bold">
          {activeChartMode === 'mhd_power' && `${telemetry.mhdPowerMWe} MWe Generated`}
          {activeChartMode === 'thermal_decay' && `T_0 = ${P_th} MWth`}
          {activeChartMode === 'load_factor' && `${telemetry.efficiencyPercent}% Efficiency`}
        </div>
      </div>
    </div>
  );
};
