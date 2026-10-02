import React, { useState } from 'react';
import { EngineeringBlueprint } from '../types/smr';
import { X, Copy, Check, Download, FileCode, Cpu, Shield, Layers } from 'lucide-react';

interface BlueprintModalProps {
  blueprint: EngineeringBlueprint | null;
  onClose: () => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ blueprint, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'json' | 'python'>('blueprint');

  if (!blueprint) return null;

  const jsonString = JSON.stringify(blueprint, null, 2);

  const pythonScript = `"""
SMR-MHD Reactor Architecture Export
Reactor Designation: ${blueprint.reactorDesignation}
Generated: October 2026 via Google GenAI SDK
"""
import os
from google import genai
from google.genai import types

def run_smr_mhd_simulation():
    client = genai.Client()
    system_instruction = (
        "You are an SMR-MHD Nuclear Systems Architect analyzing direct magnetohydrodynamic "
        "energy conversion from liquid-state actinide salts and supersonic He-Xe gas."
    )
    prompt = (
        "Evaluate reactor ${blueprint.reactorDesignation}: "
        "Thermal Power: ${blueprint.coreSpecs.thermalPowerMWth} MWth, "
        "MHD Electrical Output: ${blueprint.mhdGeneratorSpecs.electricalOutputMWe} MWe, "
        "Magnetic Field: ${blueprint.mhdGeneratorSpecs.magneticFieldTesla} T, "
        "Hartmann Number: ${blueprint.coolantDynamics.hartmannNumber}. "
        "Verify subcritical gravity dump timeline during severe loss-of-flow accidents."
    )
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.3
        )
    )
    print(response.text)

if __name__ == '__main__':
    run_smr_mhd_simulation()
`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.reactorDesignation}-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#070b14] border-2 border-cyan-500/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
                Certified SMR-MHD Blueprint
              </div>
              <h2 className="text-base font-comic font-bold text-white uppercase">
                {blueprint.reactorDesignation}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('blueprint')}
                className={`px-3 py-1 text-xs font-comic rounded-md transition ${
                  activeTab === 'blueprint' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Engineering Dossier
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition ${
                  activeTab === 'json' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Schema
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition ${
                  activeTab === 'python' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python SDK
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'blueprint' && (
            <div className="space-y-6 text-xs">
              {/* Executive Summary Banner */}
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-xl leading-relaxed text-cyan-200">
                <span className="font-comic font-bold text-cyan-300 block mb-1 text-sm uppercase tracking-wide">
                  Architectural Synthesis
                </span>
                {blueprint.architectSummary}
              </div>

              {/* Grid: Core & Generator Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Core Specs Card */}
                <div className="comic-box p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 font-comic font-bold text-sm text-amber-400 uppercase">
                    <Layers className="w-4 h-4" /> Reactor Core Specifications
                  </div>
                  <div className="space-y-2 font-mono text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Thermal Output:</span>
                      <span className="text-white font-bold">{blueprint.coreSpecs.thermalPowerMWth} MWth</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Core Outlet Temp:</span>
                      <span className="text-amber-300">{blueprint.coreSpecs.coreOutletTempKelvin} K</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Operating Pressure:</span>
                      <span className="text-slate-200">{blueprint.coreSpecs.operatingPressureBar} Bar</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Fuel & Coolant Matrix:</span>
                      <span className="text-emerald-300 truncate max-w-[180px]">{blueprint.coreSpecs.fuelType}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Thermal Neutron Flux:</span>
                      <span className="text-cyan-300">{blueprint.coreSpecs.neutronFlux_n_cm2_s} n/cm²·s</span>
                    </div>
                  </div>
                </div>

                {/* MHD Generator Specs Card */}
                <div className="comic-box p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 font-comic font-bold text-sm text-cyan-400 uppercase">
                    <Cpu className="w-4 h-4" /> Magnetohydrodynamic Channel
                  </div>
                  <div className="space-y-2 font-mono text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Electrical Output (DC):</span>
                      <span className="text-cyan-300 font-bold text-sm">{blueprint.mhdGeneratorSpecs.electricalOutputMWe} MWe</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Direct Conversion Efficiency:</span>
                      <span className="text-emerald-400 font-bold">{blueprint.mhdGeneratorSpecs.netEfficiencyPercent}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Transverse Magnetic Field:</span>
                      <span className="text-cyan-300">{blueprint.mhdGeneratorSpecs.magneticFieldTesla} Tesla</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Channel Dimensions:</span>
                      <span className="text-slate-200">{blueprint.mhdGeneratorSpecs.channelDimensionsMeters}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Power Density:</span>
                      <span className="text-amber-300">{blueprint.mhdGeneratorSpecs.powerDensityMW_m3} MW/m³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passive Safety & Materials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passive Safety Evaluation */}
                <div className="comic-box p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 font-comic font-bold text-sm text-emerald-400 uppercase">
                    <Shield className="w-4 h-4" /> Passive Walk-Away Safety
                  </div>
                  <div className="space-y-2 font-mono text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Dump Vault Type:</span>
                      <span className="text-slate-200">{blueprint.passiveSafetyEvaluation.dumpTankType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Freeze-Plug Melt Time:</span>
                      <span className="text-emerald-300 font-bold">{blueprint.passiveSafetyEvaluation.freezePlugMeltTimeSeconds} seconds</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Gravity Drain Rate:</span>
                      <span className="text-slate-200">{blueprint.passiveSafetyEvaluation.gravityDrainFlowRateKgSec} kg/s</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Active Pumps Required:</span>
                      <span className="text-emerald-400 font-bold">0 (Pure Gravity / Physical Law)</span>
                    </div>
                  </div>
                </div>

                {/* Materials Selection */}
                <div className="comic-box p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800 font-comic font-bold text-sm text-sky-400 uppercase">
                    <FileCode className="w-4 h-4" /> Materials Science & Fabrication
                  </div>
                  <div className="space-y-2 font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Channel Duct Liner:</span>
                      <span className="text-slate-200">{blueprint.materialsSelection.channelDuct}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Electrodes:</span>
                      <span className="text-slate-200">{blueprint.materialsSelection.electrodes}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Superconducting Stator:</span>
                      <span className="text-cyan-300">{blueprint.materialsSelection.superconductingMagnet}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-[500px]">
                {jsonString}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-amber-200 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-[500px]">
                {pythonScript}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-500">
            Validated by SMR-MHD Nuclear Architect AI
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCopy(activeTab === 'python' ? pythonScript : jsonString)}
              className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-4 py-1.5 text-xs font-comic font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow-md shadow-cyan-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
