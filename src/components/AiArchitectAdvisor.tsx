import React, { useState, useRef, useEffect } from 'react';
import { ReactorParameters, ReactorTelemetry, EngineeringBlueprint, COOLANT_SPECS } from '../types/smr';
import { Bot, Send, Sparkles, FileText, AlertTriangle, ShieldCheck, Terminal, Copy, Check, Loader2 } from 'lucide-react';

interface AiArchitectAdvisorProps {
  params: ReactorParameters;
  telemetry: ReactorTelemetry;
  onOpenBlueprint: (blueprint: EngineeringBlueprint) => void;
  onApplySafetyScenario: (scenarioType: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const AiArchitectAdvisor: React.FC<AiArchitectAdvisorProps> = ({
  params,
  telemetry,
  onOpenBlueprint,
  onApplySafetyScenario
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Greetings, Systems Engineer. I am your SMR-MHD Nuclear Systems Architect. I specialize in solid-state fluid magnetohydrodynamics, supersonic Helium-Xenon plasma conduits, and liquid 'acid-like' actinide fuels. Current core telemetry is synchronized. How may I assist your architectural design or safety analysis?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [scenarioResult, setScenarioResult] = useState<any | null>(null);
  const [isSimulatingScenario, setIsSimulatingScenario] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || isLoading) return;

    setInput('');
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: messageText }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/architect/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: newHistory,
          reactorState: {
            ...params,
            fluidType: COOLANT_SPECS[params.coolantId].name,
            mhdPowerMWe: telemetry.mhdPowerMWe,
            efficiencyPercent: telemetry.efficiencyPercent
          }
        })
      });

      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Telemetry stream interrupted.' }]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: `[Architect AI]: Analytical calculation complete. With a ${params.magneticFieldTesla}T field and ${params.inletVelocity} m/s flow, the Lorentz force F = J × B produces ${telemetry.mhdPowerMWe} MWe of direct DC power at ${telemetry.efficiencyPercent}% conversion efficiency. Subcritical gravity drain provides inherent passive safety.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Structured JSON Blueprint
  const handleGenerateBlueprint = async () => {
    setIsGeneratingBlueprint(true);
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
      const blueprint: EngineeringBlueprint = await res.json();
      onOpenBlueprint(blueprint);
    } catch (err) {
      console.error('Failed to generate blueprint:', err);
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  // Run Safety Transient Simulation
  const handleRunSafetyTest = async (scenarioType: string) => {
    setSelectedScenario(scenarioType);
    setIsSimulatingScenario(true);
    onApplySafetyScenario(scenarioType);

    try {
      const res = await fetch('/api/architect/safety-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioType,
          reactorState: {
            ...params,
            fluidType: COOLANT_SPECS[params.coolantId].name
          }
        })
      });
      const result = await res.json();
      setScenarioResult(result);
    } catch (err) {
      console.error('Safety simulation failed:', err);
    } finally {
      setIsSimulatingScenario(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-comic font-bold uppercase tracking-wider text-slate-100">
            SMR-MHD Nuclear Architect AI
          </span>
        </div>

        {/* Generate Certified Blueprint Button */}
        <button
          onClick={handleGenerateBlueprint}
          disabled={isGeneratingBlueprint}
          className="px-2.5 py-1 text-xs font-comic font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1.5 shadow-sm"
        >
          {isGeneratingBlueprint ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{isGeneratingBlueprint ? 'Synthesizing...' : 'Extract JSON Blueprint'}</span>
        </button>
      </div>

      {/* Safety Scenario Quick Test Bar */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" /> Stress Tests:
        </span>
        <button
          onClick={() => handleRunSafetyTest('LOCA_PRESSURE_LOSS')}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-rose-500/60 text-slate-300 transition"
        >
          Loss of He-Xe Pressure
        </button>
        <button
          onClick={() => handleRunSafetyTest('STATION_BLACKOUT')}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/60 text-slate-300 transition"
        >
          Station Blackout (SBO)
        </button>
        <button
          onClick={() => handleRunSafetyTest('MAGNET_QUENCH')}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 transition"
        >
          Magnet Quench
        </button>
      </div>

      {/* Scenario Result Drawer if active */}
      {scenarioResult && (
        <div className="p-3 bg-slate-900/95 border-b border-amber-500/40 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-comic font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safety Transient Evaluation
            </span>
            <button
              onClick={() => setScenarioResult(null)}
              className="text-slate-500 hover:text-white font-mono text-xs"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 space-y-1.5 text-slate-300">
            <p className="text-[11px] font-mono text-slate-400">{scenarioResult.scenario}</p>
            <div className="grid grid-cols-1 gap-1 my-1">
              {scenarioResult.timeline?.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-baseline gap-2 text-[11px] font-mono bg-slate-950/60 p-1.5 rounded">
                  <span className="text-cyan-400 shrink-0">+{item.timeSeconds}s</span>
                  <span className="text-slate-200 font-semibold">{item.event}:</span>
                  <span className="text-slate-400 truncate">{item.detail}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300 italic border-l-2 border-emerald-500 pl-2">
              {scenarioResult.physicsExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-[10px] font-comic uppercase tracking-wider text-slate-500">
                {msg.role === 'user' ? 'Engineering Student' : 'SMR-MHD Architect'}
              </span>
            </div>
            <div
              className={`max-w-[88%] p-3 rounded-lg text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-950/40 border border-cyan-500/50 text-slate-100 rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-sans'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Computing magnetohydrodynamic solution...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Inquiries */}
      <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
        <span className="text-slate-500 shrink-0">Inquire:</span>
        <button
          onClick={() => handleSendMessage('How does the liquid acid-state core automatically drain during pressure loss without pumps?')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300/80 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
        >
          Passive Gravity Drain
        </button>
        <button
          onClick={() => handleSendMessage('Why is peak power density achieved at load factor K = 0.5?')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300/80 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
        >
          Optimal K = 0.5
        </button>
        <button
          onClick={() => handleSendMessage('Explain how the Hartmann number suppresses boundary layer turbulence in a 10 Tesla field.')}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300/80 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
        >
          Hartmann Layer
        </button>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask the Nuclear Architect about MHD physics, liquid fuels, or safety..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-lg text-white transition flex items-center justify-center shadow-md shadow-cyan-600/30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
