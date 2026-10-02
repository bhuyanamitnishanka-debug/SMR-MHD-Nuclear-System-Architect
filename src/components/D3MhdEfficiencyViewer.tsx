import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { COOLANT_SPECS, CoolantType, ReactorParameters } from '../types/smr';
import { Eye, EyeOff, Sparkles, Sliders, Info, Zap, Scale, Layers } from 'lucide-react';

interface D3MhdEfficiencyViewerProps {
  currentParams?: ReactorParameters;
  onApplyParams?: (params: Partial<ReactorParameters>) => void;
}

interface CoolantCurveDefinition {
  id: CoolantType;
  name: string;
  shortName: string;
  conductivity: number;
  viscosity: number;
  speedOfSound: number;
  color: string;
  operatingTempK: number;
  density: number;
  maxVelocity: number;
}

const COOLANT_CURVES: CoolantCurveDefinition[] = [
  {
    id: 'he_xe_plasma',
    name: 'Supersonic Helium-Xenon (K-seeded)',
    shortName: 'He-Xe Plasma',
    conductivity: 450,
    viscosity: 0.000045,
    speedOfSound: 680,
    color: '#38bdf8', // Cyan
    operatingTempK: 1950,
    density: 3.8,
    maxVelocity: 1400
  },
  {
    id: 'acid_molten_salt',
    name: 'Liquid "Acid-State" Actinide Salt',
    shortName: 'Acid Molten Salt',
    conductivity: 1200,
    viscosity: 0.0056,
    speedOfSound: 1250,
    color: '#10b981', // Emerald
    operatingTempK: 980,
    density: 3350,
    maxVelocity: 80
  },
  {
    id: 'liquid_lead_bismuth',
    name: 'Liquid Lead-Bismuth Eutectic (LBE)',
    shortName: 'Liquid Metal (LBE)',
    conductivity: 9500,
    viscosity: 0.0018,
    speedOfSound: 1780,
    color: '#f59e0b', // Amber
    operatingTempK: 780,
    density: 10300,
    maxVelocity: 45
  }
];

export const D3MhdEfficiencyViewer: React.FC<D3MhdEfficiencyViewerProps> = ({
  currentParams,
  onApplyParams
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Coolants Toggled
  const [activeCoolants, setActiveCoolants] = useState<Record<CoolantType, boolean>>({
    he_xe_plasma: true,
    acid_molten_salt: true,
    liquid_lead_bismuth: true
  });

  // Controls
  const [magneticFieldB, setMagneticFieldB] = useState<number>(currentParams?.magneticFieldTesla || 7.0);
  const [loadFactorK, setLoadFactorK] = useState<number>(currentParams?.loadFactor || 0.5);
  const [thermalPowerMW, setThermalPowerMW] = useState<number>(currentParams?.thermalPowerMW || 150);

  // Axis and metric options
  const [xAxisMode, setXAxisMode] = useState<'normalized_velocity' | 'actual_velocity' | 'load_factor'>('normalized_velocity');
  const [yAxisMetric, setYAxisMetric] = useState<'efficiency' | 'power_density' | 'hartmann'>('efficiency');

  // Hover state for HUD
  const [hoverData, setHoverData] = useState<{
    xVal: number;
    points: {
      coolant: CoolantCurveDefinition;
      value: number;
      rawPowerMW: number;
      actualVelocity: number;
    }[];
  } | null>(null);

  const toggleCoolant = (id: CoolantType) => {
    setActiveCoolants(prev => {
      const next = { ...prev, [id]: !prev[id] };
      // Keep at least one active
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  const channelVolumeM3 = 0.43;

  // D3 Chart Dimensions
  const margin = { top: 30, right: 35, bottom: 45, left: 60 };
  const width = 760;
  const height = 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Generate curve dataset based on selected X and Y modes
  const dataset = useMemo(() => {
    const activeDefs = COOLANT_CURVES.filter(c => activeCoolants[c.id]);

    const numPoints = 60;
    const series = activeDefs.map(coolant => {
      const points: { x: number; y: number; actualU: number; powerMW: number }[] = [];

      for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;
        let x = 0;
        let u = 0;
        let k = loadFactorK;

        if (xAxisMode === 'normalized_velocity') {
          x = fraction * 100; // 0 to 100%
          u = fraction * coolant.maxVelocity;
        } else if (xAxisMode === 'actual_velocity') {
          // Absolute velocity from 0 to 1500 m/s
          const maxScaleU = 1500;
          x = fraction * maxScaleU;
          u = x;
        } else {
          // Load Factor K (0.1 to 0.9)
          x = 0.1 + fraction * 0.8;
          k = x;
          u = coolant.id === 'he_xe_plasma' ? 950 : 35;
        }

        // Power density formula: P = sigma * u^2 * B^2 * K(1 - K) / 1e6 [MW/m^3]
        const pDensityMWm3 = (coolant.conductivity * Math.pow(u, 2) * Math.pow(magneticFieldB, 2) * k * (1 - k)) / 1e6;
        const channelPowerMW = Math.min(thermalPowerMW * 0.62, pDensityMWm3 * channelVolumeM3);
        const effPercent = thermalPowerMW > 0 ? (channelPowerMW / thermalPowerMW) * 100 : 0;
        const hartmann = Math.round(magneticFieldB * 0.25 * Math.sqrt(coolant.conductivity / coolant.viscosity));

        let y = 0;
        if (yAxisMetric === 'efficiency') {
          y = effPercent;
        } else if (yAxisMetric === 'power_density') {
          y = pDensityMWm3;
        } else {
          y = hartmann;
        }

        // If actual velocity exceeds fluid limit in actual velocity mode, taper smoothly
        if (xAxisMode === 'actual_velocity' && u > coolant.maxVelocity) {
          y = 0;
        }

        points.push({
          x,
          y: Math.max(0, y),
          actualU: u,
          powerMW: Number(channelPowerMW.toFixed(2))
        });
      }

      return {
        coolant,
        points
      };
    });

    return series;
  }, [activeCoolants, magneticFieldB, loadFactorK, thermalPowerMW, xAxisMode, yAxisMetric]);

  // Main D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous frame

    // Main Chart Group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X-Scale Domain setup
    let xDomain = [0, 100];
    if (xAxisMode === 'normalized_velocity') xDomain = [0, 100];
    if (xAxisMode === 'actual_velocity') xDomain = [0, 1500];
    if (xAxisMode === 'load_factor') xDomain = [0.1, 0.9];

    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);

    // Y-Scale Domain setup
    let maxY = 0;
    dataset.forEach(s => {
      const seriesMax = d3.max(s.points, d => d.y) || 0;
      if (seriesMax > maxY) maxY = seriesMax;
    });

    if (yAxisMetric === 'efficiency') {
      maxY = Math.max(maxY * 1.15, 65);
    } else {
      maxY = Math.max(maxY * 1.2, 10);
    }

    const yScale = d3.scaleLinear().domain([0, maxY]).range([innerHeight, 0]).nice();

    // Defs: Linear Gradients under curves
    const defs = svg.append('defs');
    dataset.forEach(s => {
      const gradId = `gradient-${s.coolant.id}`;
      const grad = defs
        .append('linearGradient')
        .attr('id', gradId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', s.coolant.color)
        .attr('stop-opacity', 0.25);

      grad
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', s.coolant.color)
        .attr('stop-opacity', 0.0);
    });

    // Grid Lines: Horizontal
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.7);

    // Grid Lines: Vertical
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.7);

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => {
        if (xAxisMode === 'normalized_velocity') return `${d}%`;
        if (xAxisMode === 'actual_velocity') return `${d} m/s`;
        return `${Number(d).toFixed(2)}`;
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => {
      if (yAxisMetric === 'efficiency') return `${d}%`;
      if (yAxisMetric === 'power_density') return `${d} MW/m³`;
      return `${d}`;
    });

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Remove bounding box domain paths
    g.selectAll('.domain').attr('stroke', '#334155');

    // D3 Line & Area Generators
    const lineGen = d3
      .line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y0(innerHeight)
      .y1(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Draw shaded area and curve lines for each series
    dataset.forEach(s => {
      // Area Fill
      g.append('path')
        .datum(s.points)
        .attr('fill', `url(#gradient-${s.coolant.id})`)
        .attr('d', areaGen);

      // Line Path with animated dash transition
      const path = g
        .append('path')
        .datum(s.points)
        .attr('fill', 'none')
        .attr('stroke', s.coolant.color)
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGen);

      // Simple entry transition animation
      const totalLength = (path.node() as SVGPathElement)?.getTotalLength?.() || 1000;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    });

    // Reference Line for Betz / Theoretical Carnot-MHD Limit if efficiency metric is chosen
    if (yAxisMetric === 'efficiency') {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(62.0))
        .attr('y2', yScale(62.0))
        .attr('stroke', '#ef4444')
        .attr('stroke-dasharray', '4 3')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.8);

      g.append('text')
        .attr('x', innerWidth - 5)
        .attr('y', yScale(62.0) - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#ef4444')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text('Carnot-Brayton Limit (62%)');
    }

    // Interactive Hover Tracking Group
    const hoverGroup = g.append('g').style('display', 'none');

    const verticalGuideLine = hoverGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.6);

    // Indicator circles for each active curve
    const markerCircles = dataset.map(s => {
      return hoverGroup
        .append('circle')
        .attr('r', 5)
        .attr('fill', s.coolant.color)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
    });

    // Overlay Rect to Capture Mouse Events
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mouseenter', () => {
        hoverGroup.style('display', null);
      })
      .on('mouseleave', () => {
        hoverGroup.style('display', 'none');
        setHoverData(null);
      })
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const xVal = xScale.invert(mx);

        verticalGuideLine.attr('x1', mx).attr('x2', mx);

        const currentPoints = dataset.map((s, idx) => {
          // Find closest point by x
          const bisect = d3.bisector<{ x: number }, number>(d => d.x).center;
          const index = Math.min(s.points.length - 1, Math.max(0, bisect(s.points, xVal)));
          const pt = s.points[index];

          markerCircles[idx]
            .attr('cx', xScale(pt.x))
            .attr('cy', yScale(pt.y));

          return {
            coolant: s.coolant,
            value: Number(pt.y.toFixed(2)),
            rawPowerMW: pt.powerMW,
            actualVelocity: Math.round(pt.actualU)
          };
        });

        setHoverData({
          xVal: Number(xVal.toFixed(1)),
          points: currentPoints
        });
      });
  }, [dataset, xAxisMode, yAxisMetric, innerWidth, innerHeight]);

  return (
    <div className="space-y-4">
      {/* Top Banner and D3 Interactive Toggle Bar */}
      <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <h3 className="font-comic font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                <span>D3.js Vectorized MHD Efficiency & Power Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono">
                  D3 Engine
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Interactive dynamic vector plotting of multi-phase plasma and liquid metal conversion curves with real-time crosshair inspection.
              </p>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setYAxisMetric('efficiency')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition ${
                yAxisMetric === 'efficiency' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Efficiency (η %)
            </button>
            <button
              onClick={() => setYAxisMetric('power_density')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition ${
                yAxisMetric === 'power_density' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Power Density (MW/m³)
            </button>
            <button
              onClick={() => setYAxisMetric('hartmann')}
              className={`px-2.5 py-1 text-[11px] font-comic rounded transition ${
                yAxisMetric === 'hartmann' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hartmann (Ha)
            </button>
          </div>
        </div>

        {/* Coolant Toggles Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-500">Toggle Datasets:</span>
            {COOLANT_CURVES.map(c => {
              const isActive = activeCoolants[c.id];
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCoolant(c.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-comic flex items-center gap-1.5 transition border ${
                    isActive
                      ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 line-through'
                  }`}
                  style={{ borderColor: isActive ? c.color : undefined }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: isActive ? c.color : '#475569' }}
                  />
                  <span>{c.shortName}</span>
                  {isActive ? <Eye className="w-3 h-3 text-slate-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                </button>
              );
            })}
          </div>

          {/* Domain Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 text-[10px] uppercase">X-Domain:</span>
            <button
              onClick={() => setXAxisMode('normalized_velocity')}
              className={`px-1.5 py-0.5 rounded transition ${
                xAxisMode === 'normalized_velocity' ? 'bg-cyan-900 text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              0-100% Rel Flow
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setXAxisMode('actual_velocity')}
              className={`px-1.5 py-0.5 rounded transition ${
                xAxisMode === 'actual_velocity' ? 'bg-cyan-900 text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              m/s Absolute
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setXAxisMode('load_factor')}
              className={`px-1.5 py-0.5 rounded transition ${
                xAxisMode === 'load_factor' ? 'bg-cyan-900 text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Load Factor K
            </button>
          </div>
        </div>
      </div>

      {/* Physics Sliders Sub-Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs font-mono">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Stator Magnetic Field (B)</span>
            <span className="text-cyan-300 font-bold">{magneticFieldB.toFixed(1)} Tesla</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="12.0"
            step="0.5"
            value={magneticFieldB}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setMagneticFieldB(val);
              onApplyParams?.({ magneticFieldTesla: val });
            }}
            className="w-full accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Generator Load Factor (K)</span>
            <span className="text-amber-300 font-bold">{loadFactorK.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={loadFactorK}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setLoadFactorK(val);
              onApplyParams?.({ loadFactor: val });
            }}
            className="w-full accent-amber-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Core Thermal Power (P0)</span>
            <span className="text-emerald-300 font-bold">{thermalPowerMW} MWth</span>
          </div>
          <input
            type="range"
            min="50"
            max="250"
            step="10"
            value={thermalPowerMW}
            onChange={e => {
              const val = parseInt(e.target.value);
              setThermalPowerMW(val);
              onApplyParams?.({ thermalPowerMW: val });
            }}
            className="w-full accent-emerald-400"
          />
        </div>
      </div>

      {/* D3 Vector Chart Container */}
      <div className="comic-box p-3 rounded-xl border border-slate-800 relative bg-[#070b14]" ref={containerRef}>
        <div className="w-full overflow-hidden flex justify-center">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[340px] select-none"
          />
        </div>

        {/* Dynamic Crosshair Telemetry HUD */}
        {hoverData && (
          <div className="absolute top-5 right-5 pointer-events-none bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 p-2.5 rounded-lg shadow-2xl space-y-1.5 font-mono text-[11px] min-w-[200px] z-10">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              Crosshair: {xAxisMode === 'normalized_velocity' ? `${hoverData.xVal}% Flow` : xAxisMode === 'actual_velocity' ? `${hoverData.xVal} m/s` : `K = ${hoverData.xVal}`}
            </div>

            {hoverData.points.map(pt => (
              <div key={pt.coolant.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5" style={{ color: pt.coolant.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pt.coolant.color }} />
                  {pt.coolant.shortName}:
                </span>
                <span className="font-bold text-white">
                  {pt.value} {yAxisMetric === 'efficiency' ? '%' : yAxisMetric === 'power_density' ? 'MW/m³' : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Scientific Explainer Footnote */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-sans text-slate-300">
          <div className="flex items-start gap-1.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">D3 Physics Insight:</strong> Drag sliders or hover the chart crosshair to inspect how high-field magnetic compression (B²) boosts direct induction. Helium-Xenon peaks through sonic velocity, whereas dense liquid metal relies on extreme conductivity (σ = 9500 S/m) to maximize power density at moderate speeds.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[10px]">
            <span className="text-slate-500">Peak Load Factor:</span>
            <span className="text-amber-400 font-bold">K = 0.50</span>
          </div>
        </div>
      </div>
    </div>
  );
};
