import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const ARCHITECT_SYSTEM_INSTRUCTION = `You are a visionary Nuclear Systems Architect specializing in Magnetohydrodynamics (MHD) and Small Modular Reactors (SMR). You analyze fluid-state 'acid-like' nuclear fuels (such as molten actinide fluoride/chloride salts), plasma ionization, supersonic Helium-Xenon (He-Xe) gas tubes, Faraday and Hall generator channels, and turbine-less solid-state power generation.
Your goal is to educate and engage high school and college engineering students with rigorous yet vivid scientific insights, thermal calculations, fluid mechanics (Hartmann number, magnetic Reynolds number, Lorentz force F = J x B), and passive safety principles (such as gravity-fed subcritical drainage and freeze plugs without mechanical pumps).
Maintain a confident, highly competent, inspiring scientific tone. When formulas or calculations are relevant, explain the physical meaning clearly so students can grasp the breakthrough nature of turbine-less nuclear power.`;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
}

// Interactive chat endpoint
app.post('/api/architect/chat', async (req, res) => {
  try {
    const { message, history = [], reactorState } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const stateDesc = reactorState 
      ? `Thermal: ${reactorState.thermalPowerMW} MWth, B-Field: ${reactorState.magneticFieldTesla}T, Fluid: ${reactorState.fluidType || 'He-Xe Plasma'}, u: ${reactorState.inletVelocity} m/s, Power: ${reactorState.mhdPowerMWe} MWe.`
      : '';

    const fallbackChat = {
      text: `[Architect AI Telemetry Analysis]: ${stateDesc} In this SMR-MHD configuration, the transverse magnetic field of ${reactorState?.magneticFieldTesla || 6} Tesla induces an electric field E = u × B across the duct. Direct solid-state electron collection through segmented tungsten electrodes eliminates mechanical turbomachinery entirely. The Lorentz retarding force provides natural electromagnetic braking, and subcritical gravity-fed dump tanks ensure walk-away safety without pumps.`,
      suggestions: [
        'Explain the Hartmann number turbulence suppression',
        'How does the passive gravity drain prevent meltdown?',
        'What happens during a sudden supersonic tube pressure loss?'
      ]
    };

    if (!apiKey) {
      return res.json(fallbackChat);
    }

    // Build context with current reactor state if provided
    let stateContext = '';
    if (reactorState) {
      stateContext = `\n[Current Live Simulation Parameters:
Coolant: ${reactorState.fluidType || 'Supersonic He-Xe + K seed'}
Thermal Power: ${reactorState.thermalPowerMW} MWth
Magnetic Field B: ${reactorState.magneticFieldTesla} Tesla
Fluid Inlet Velocity u: ${reactorState.inletVelocity} m/s
Conductivity sigma: ${reactorState.ionizationConductivity} S/m
Electrode Load Factor K: ${reactorState.loadFactor}
Calculated Electric Power: ${reactorState.mhdPowerMWe?.toFixed(2)} MWe
Calculated Efficiency: ${reactorState.efficiencyPercent?.toFixed(1)}%]\n`;
    }

    const contents: any[] = [];
    for (const h of history.slice(-4)) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: stateContext + message }]
    });

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: ARCHITECT_SYSTEM_INSTRUCTION,
        temperature: 0.5,
        maxOutputTokens: 900,
      }
    }).then(r => ({
      text: r.text || fallbackChat.text,
      suggestions: [
        'How does Faraday generator differ from Hall geometry?',
        'Calculate Lorentz deceleration across the channel',
        'Simulate subcritical gravity dump during LOCA'
      ]
    }));

    const result = await withTimeout(aiPromise, 4500, fallbackChat);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/architect/chat:', error);
    res.json({
      text: 'Analytical core analysis: Magnetohydrodynamic flow converts kinetic enthalpy into DC electrical energy via Faraday induction. Lorentz force F = J × B laminarizes the Hartmann boundary layer.',
      suggestions: ['Explain passive gravity dump', 'Review optimal load factor K=0.5']
    });
  }
});

// Structured blueprint generation endpoint (as requested in prompt for structured JSON engineering metrics)
app.post('/api/architect/blueprint', async (req, res) => {
  try {
    const {
      thermalPowerMW = 150,
      magneticFieldTesla = 6,
      fluidType = 'Supersonic He-Xe (Potassium-seeded)',
      inletVelocity = 900,
      ionizationConductivity = 450,
      loadFactor = 0.5
    } = req.body;

    // Deterministic analytical calculation blueprint fallback
    const P_density_MW_m3 = (ionizationConductivity * Math.pow(inletVelocity, 2) * Math.pow(magneticFieldTesla, 2) * loadFactor * (1 - loadFactor)) / 1e6;
    const channelVol_m3 = 0.45;
    const mhdPowerMWe = Math.min(thermalPowerMW * 0.62, P_density_MW_m3 * channelVol_m3);
    const efficiency = (mhdPowerMWe / thermalPowerMW) * 100;
    const ha = magneticFieldTesla * 0.25 * Math.sqrt(ionizationConductivity / 0.001);

    const fallbackBlueprint = {
      reactorDesignation: `VANGUARD-SMR-MHD-${Math.round(thermalPowerMW)}`,
      coreSpecs: {
        thermalPowerMWth: thermalPowerMW,
        coreOutletTempKelvin: fluidType.includes('Acid') ? 980 : 1850,
        operatingPressureBar: fluidType.includes('Acid') ? 4 : 32,
        fuelType: fluidType.includes('Acid') ? 'Liquid Actinide Molten Salt (UF4-ThF4-LiF-BeF2)' : 'Refractory UN/SiC Coated Kernels + He-Xe Gas',
        neutronFlux_n_cm2_s: '3.2e14'
      },
      mhdGeneratorSpecs: {
        electricalOutputMWe: Number(mhdPowerMWe.toFixed(2)),
        netEfficiencyPercent: Number(efficiency.toFixed(2)),
        magneticFieldTesla,
        channelDimensionsMeters: '0.32m x 0.28m x 4.8m',
        powerDensityMW_m3: Number(P_density_MW_m3.toFixed(2)),
        electrodeCurrentDensityA_cm2: Number((mhdPowerMWe * 0.45).toFixed(1)),
        hallParameter: Number((magneticFieldTesla * 0.35).toFixed(2))
      },
      coolantDynamics: {
        fluidMedium: fluidType,
        inletMachNumber: inletVelocity > 500 ? (inletVelocity / 680).toFixed(2) : '0.12 (Subsonic)',
        hartmannNumber: Math.round(ha),
        turbulenceSuppression: '96.4% laminarized by magnetic field',
        lorentzPressureDropBar: Number((magneticFieldTesla * 1.8).toFixed(2))
      },
      passiveSafetyEvaluation: {
        dumpTankType: 'Subcritical Annular Gravity-Fed Vaults',
        freezePlugMeltTimeSeconds: 4.8,
        gravityDrainFlowRateKgSec: 285,
        timeToSafeColdSubcriticalMinutes: 1.4,
        pumpsRequired: 0,
        reliabilityAssessment: 'Inherently safe; geometry prevents criticality when drained'
      },
      materialsSelection: {
        channelDuct: 'Silicon Carbide (SiC/SiC) composite with CVD W-10Re liner',
        electrodes: 'Pyrolytic graphite / tungsten-clad segmented arrays',
        superconductingMagnet: 'REBCO High-Temperature Superconductor (HTS) at 20 K',
        conduitPiping: 'Hastelloy-N / Molybdenum-alloy (TZM)'
      },
      architectSummary: `Configuration establishes a high-efficiency solid-state Magnetohydrodynamic direct conversion cycle. By utilizing ${fluidType} in a ${magneticFieldTesla}T transverse field, mechanical turbine wear is eliminated, and passive gravity drop tanks guarantee walk-away safety.`
    };

    if (!apiKey) {
      return res.json(fallbackBlueprint);
    }

    const prompt = `Perform a comprehensive engineering analysis and generate structured JSON specifications for the following Small Modular Reactor Magnetohydrodynamic (SMR-MHD) system:
- Fluid/Coolant: ${fluidType}
- Core Thermal Power: ${thermalPowerMW} MWth
- Magnetic Field: ${magneticFieldTesla} Tesla
- Inlet Flow Velocity: ${inletVelocity} m/s
- Electrical Conductivity: ${ionizationConductivity} S/m
- Electrode Load Factor K: ${loadFactor}

Return ONLY valid JSON matching this schema:
{
  "reactorDesignation": "string",
  "coreSpecs": {
    "thermalPowerMWth": number,
    "coreOutletTempKelvin": number,
    "operatingPressureBar": number,
    "fuelType": "string",
    "neutronFlux_n_cm2_s": "string"
  },
  "mhdGeneratorSpecs": {
    "electricalOutputMWe": number,
    "netEfficiencyPercent": number,
    "magneticFieldTesla": number,
    "channelDimensionsMeters": "string",
    "powerDensityMW_m3": number,
    "electrodeCurrentDensityA_cm2": number,
    "hallParameter": number
  },
  "coolantDynamics": {
    "fluidMedium": "string",
    "inletMachNumber": "string",
    "hartmannNumber": number,
    "turbulenceSuppression": "string",
    "lorentzPressureDropBar": number
  },
  "passiveSafetyEvaluation": {
    "dumpTankType": "string",
    "freezePlugMeltTimeSeconds": number,
    "gravityDrainFlowRateKgSec": number,
    "timeToSafeColdSubcriticalMinutes": number,
    "pumpsRequired": 0,
    "reliabilityAssessment": "string"
  },
  "materialsSelection": {
    "channelDuct": "string",
    "electrodes": "string",
    "superconductingMagnet": "string",
    "conduitPiping": "string"
  },
  "architectSummary": "string"
}`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: ARCHITECT_SYSTEM_INSTRUCTION,
        temperature: 0.3,
        responseMimeType: 'application/json',
      }
    }).then(r => JSON.parse(r.text || '{}'));

    const result = await withTimeout(aiPromise, 4500, fallbackBlueprint);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/architect/blueprint:', error);
    res.status(500).json({ error: 'Failed to generate blueprint', details: error?.message });
  }
});

// Safety transient simulator endpoint
app.post('/api/architect/safety-sim', async (req, res) => {
  try {
    const { scenarioType, reactorState } = req.body;

    const scenarioDescriptions: Record<string, string> = {
      'LOCA_PRESSURE_LOSS': 'Sudden rupture/loss of pressure in the supersonic He-Xe duct at full power',
      'STATION_BLACKOUT': 'Total loss of external electrical grid power (Station Blackout / SBO)',
      'MAGNET_QUENCH': 'Rapid thermal quench of the 8-Tesla HTS superconducting magnet coils',
      'CORE_REACTIVITY_INSERTION': 'Uncontrolled positive reactivity spike in liquid-state acid nuclear core'
    };

    const description = scenarioDescriptions[scenarioType] || 'Hypothetical fault condition';

    const fallbackSafety = {
      scenario: description,
      timeline: [
        { timeSeconds: 0.0, event: 'Transient Initiated', detail: `${description} detected by acoustic & hall sensors.` },
        { timeSeconds: 0.4, event: 'Passive Freeze Plug Activation', detail: 'Electric heating to freeze seals ceases; coolant thermal mass triggers freeze valve liquefaction.' },
        { timeSeconds: 1.2, event: 'Gravity Drain Commences', detail: 'Core fluid drains downward via gravity conduits with zero mechanical pump intervention.' },
        { timeSeconds: 4.8, event: 'Subcritical Geometry Achieved', detail: 'Liquid fuel fills high-surface-area annular storage tanks; geometry prevents neutron criticality.' },
        { timeSeconds: 12.0, event: 'Passive Decay Heat Stabilization', detail: 'Natural convection air loops dissipate decay heat indefinitely.' }
      ],
      physicsExplanation: 'In an SMR-MHD system, passive safety does not depend on backup diesel generators or active emergency injection pumps. Subcritical drain tanks beneath the reactor vessel use pure gravity, ensuring the reactor shuts down intrinsically.',
      safetyScore: 98
    };

    if (!apiKey) {
      return res.json(fallbackSafety);
    }

    const prompt = `Simulate an immediate engineering safety response sequence for an SMR-MHD nuclear plant experiencing: "${description}".
Current state: Thermal Power: ${reactorState?.thermalPowerMW || 150} MWth, Magnetic Field: ${reactorState?.magneticFieldTesla || 6}T, Fluid: ${reactorState?.fluidType || 'He-Xe gas'}.

Explain how the passive gravity drain, freeze-plug seals, and subcritical annular dump tanks safely neuter the incident without any mechanical pumps.

Return JSON in this format:
{
  "scenario": "string",
  "timeline": [
    { "timeSeconds": number, "event": "string", "detail": "string" }
  ],
  "physicsExplanation": "string",
  "safetyScore": number
}`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: ARCHITECT_SYSTEM_INSTRUCTION,
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    }).then(r => JSON.parse(r.text || '{}'));

    const parsed = await withTimeout(aiPromise, 4500, fallbackSafety);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/architect/safety-sim:', error);
    res.json({
      scenario: 'Passive Gravity Emergency Drain Protocol',
      timeline: [
        { timeSeconds: 0.0, event: 'Anomaly Detected', detail: 'Transducer detects pressure transient.' },
        { timeSeconds: 0.6, event: 'Freeze-Plug Melt', detail: 'Loss of chiller current causes plug to liquefy.' },
        { timeSeconds: 4.8, event: 'Subcritical Gravity Dump', detail: 'Fuel transfers into annular vault; k_eff < 0.90.' }
      ],
      physicsExplanation: 'Inherently safe design guarantees reactor shut down via pure gravity and non-critical geometry without pumps.',
      safetyScore: 99
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ SMR-MHD Nuclear Architect Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
