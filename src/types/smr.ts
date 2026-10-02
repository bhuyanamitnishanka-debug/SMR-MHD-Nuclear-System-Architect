export type CoolantType = 'he_xe_plasma' | 'acid_molten_salt' | 'liquid_lead_bismuth';

export interface CoolantProperty {
  id: CoolantType;
  name: string;
  chemicalFormula: string;
  phase: 'Plasma / Seeded Gas' | 'Liquid Acid-State Salt' | 'Liquid Metal Eutectic';
  operatingTempK: number;
  inletVelocityRange: [number, number];
  nominalConductivity: number; // S/m
  densityKgM3: number;
  viscosityPaS: number;
  colorHex: string;
  description: string;
}

export const COOLANT_SPECS: Record<CoolantType, CoolantProperty> = {
  he_xe_plasma: {
    id: 'he_xe_plasma',
    name: 'Supersonic Helium-Xenon (K-seeded)',
    chemicalFormula: '80% He + 20% Xe (0.5 mol% K Seed)',
    phase: 'Plasma / Seeded Gas',
    operatingTempK: 1950,
    inletVelocityRange: [400, 1400],
    nominalConductivity: 450,
    densityKgM3: 3.8,
    viscosityPaS: 0.000045,
    colorHex: '#38bdf8',
    description: 'High-temperature gas expanded through supersonic nozzle; potassium seeding provides free electron ionization for massive power density.'
  },
  acid_molten_salt: {
    id: 'acid_molten_salt',
    name: 'Liquid "Acid-State" Actinide Salt',
    chemicalFormula: 'UF4 - ThF4 - LiF - BeF2 (FLiBe base)',
    phase: 'Liquid Acid-State Salt',
    operatingTempK: 980,
    inletVelocityRange: [10, 80],
    nominalConductivity: 1200,
    densityKgM3: 3350,
    viscosityPaS: 0.0056,
    colorHex: '#10b981',
    description: 'Fluoride salt dissolving actinide fuel directly. Zero solid cladding damage. Passive freeze-plug drains into subcritical tanks via gravity if power drops.'
  },
  liquid_lead_bismuth: {
    id: 'liquid_lead_bismuth',
    name: 'Liquid Lead-Bismuth Eutectic (LBE)',
    chemicalFormula: '44.5% Pb - 55.5% Bi',
    phase: 'Liquid Metal Eutectic',
    operatingTempK: 780,
    inletVelocityRange: [5, 45],
    nominalConductivity: 9500,
    densityKgM3: 10300,
    viscosityPaS: 0.0018,
    colorHex: '#f59e0b',
    description: 'Dense liquid metal with extreme electrical conductivity, high thermal inertia, and robust natural circulation.'
  }
};

export interface ReactorParameters {
  thermalPowerMW: number;
  magneticFieldTesla: number;
  coolantId: CoolantType;
  inletVelocity: number; // m/s
  ionizationConductivity: number; // S/m
  loadFactor: number; // K = E / (u*B)
  isEmergencyDumpActive: boolean;
  dumpProgress: number; // 0 to 1
  cutawayView: boolean;
  showMagneticFlux: boolean;
  showStreamlines: boolean;
}

export interface ReactorTelemetry {
  mhdPowerMWe: number;
  thermalPowerMW: number;
  efficiencyPercent: number;
  lorentzForceDensityKN_m3: number;
  hartmannNumber: number;
  magneticReynoldsNumber: number;
  machNumber: number;
  pressureDropBar: number;
  flowRegime: 'Laminarized (Hartmann Dominated)' | 'Supersonic Shock Boundary' | 'Turbulent Transition' | 'Draining to Subcritical Tanks';
  fuelInventoryInCorePercent: number;
  dumpTankFillPercent: number;
}

export interface GraphicNovelPanel {
  id: string;
  order: number;
  speaker?: string;
  avatarRole?: 'architect' | 'physicist' | 'vanguard_ai' | 'narrator';
  narration: string;
  dialogue?: string;
  soundEffect?: string;
  sfxColor?: string;
  technicalNote?: string;
  cameraPreset?: 'overview' | 'channel' | 'nozzle' | 'dump_tank' | 'particles';
  interactiveAction?: {
    label: string;
    applyParams: Partial<ReactorParameters>;
    targetViewMode?: 'step' | 'full_comic' | 'timeline';
  };
}

export interface GraphicNovelChapter {
  id: number;
  title: string;
  subtitle: string;
  synopsis: string;
  panels: GraphicNovelPanel[];
}

export interface StudentMission {
  id: string;
  title: string;
  category: 'Electrodynamics' | 'Compressible Flow' | 'Safety Protocol';
  difficulty: 'High School AP Physics' | 'Undergraduate Engineering' | 'Advanced Nuclear';
  briefing: string;
  goalDescription: string;
  targetCriteria: {
    minPowerMWe?: number;
    targetLoadFactor?: number;
    requiredCoolant?: CoolantType;
    emergencyDumpTriggered?: boolean;
    minHartmann?: number;
  };
  hints: string[];
}

export interface EngineeringBlueprint {
  reactorDesignation: string;
  coreSpecs: {
    thermalPowerMWth: number;
    coreOutletTempKelvin: number;
    operatingPressureBar: number;
    fuelType: string;
    neutronFlux_n_cm2_s: string;
  };
  mhdGeneratorSpecs: {
    electricalOutputMWe: number;
    netEfficiencyPercent: number;
    magneticFieldTesla: number;
    channelDimensionsMeters: string;
    powerDensityMW_m3: number;
    electrodeCurrentDensityA_cm2: number;
    hallParameter: number;
  };
  coolantDynamics: {
    fluidMedium: string;
    inletMachNumber: string;
    hartmannNumber: number;
    turbulenceSuppression: string;
    lorentzPressureDropBar: number;
  };
  passiveSafetyEvaluation: {
    dumpTankType: string;
    freezePlugMeltTimeSeconds: number;
    gravityDrainFlowRateKgSec: number;
    timeToSafeColdSubcriticalMinutes: number;
    pumpsRequired: number;
    reliabilityAssessment: string;
  };
  materialsSelection: {
    channelDuct: string;
    electrodes: string;
    superconductingMagnet: string;
    conduitPiping: string;
  };
  architectSummary: string;
}
