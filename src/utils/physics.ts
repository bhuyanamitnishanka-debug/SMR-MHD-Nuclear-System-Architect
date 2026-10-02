import { ReactorParameters, ReactorTelemetry, COOLANT_SPECS } from '../types/smr';

export const CHANNEL_DIMENSIONS = {
  width: 0.32,   // meters (magnetic gap)
  height: 0.28,  // meters (electrode distance)
  length: 4.8,   // meters (active length)
};

export const CHANNEL_VOLUME = CHANNEL_DIMENSIONS.width * CHANNEL_DIMENSIONS.height * CHANNEL_DIMENSIONS.length; // ~0.43 m^3

export function calculateReactorTelemetry(params: ReactorParameters): ReactorTelemetry {
  const coolant = COOLANT_SPECS[params.coolantId];
  const B = params.magneticFieldTesla;
  const u = params.inletVelocity;
  const sigma = params.ionizationConductivity;
  const K = params.loadFactor; // 0 to 1

  // 1. Power Density in W/m^3: P_d = sigma * u^2 * B^2 * K * (1 - K)
  // Note: K*(1-K) maxes out at K=0.5 where K*(1-K) = 0.25
  const powerDensity_W_m3 = sigma * Math.pow(u, 2) * Math.pow(B, 2) * K * (1 - K);
  
  // Total raw MHD electric power in Watts
  let rawPowerMWe = (powerDensity_W_m3 * CHANNEL_VOLUME) / 1e6;

  // Enthalpy extraction limit based on thermal power (First and Second Law)
  // Maximum theoretical Carnot / Brayton conversion for this fluid
  const maxCarnot = 0.65;
  const maxAllowableMWe = params.thermalPowerMW * maxCarnot;
  const mhdPowerMWe = Math.min(rawPowerMWe, maxAllowableMWe);

  // 2. Efficiency
  const efficiencyPercent = params.thermalPowerMW > 0 
    ? (mhdPowerMWe / params.thermalPowerMW) * 100 
    : 0;

  // 3. Lorentz Force Density in kN/m^3: F = J x B = sigma * (u*B - E) * B = sigma * u * B^2 * (1 - K)
  const lorentzForceDensityKN_m3 = (sigma * u * Math.pow(B, 2) * (1 - K)) / 1000;

  // 4. Pressure Drop across the active channel in Bar (1 bar = 100,000 Pa)
  const deltaP_Pa = (lorentzForceDensityKN_m3 * 1000) * CHANNEL_DIMENSIONS.length;
  const pressureDropBar = deltaP_Pa / 100000;

  // 5. Hartmann Number: Ha = B * L * sqrt(sigma / mu)
  const charLength = (CHANNEL_DIMENSIONS.width * CHANNEL_DIMENSIONS.height) / (CHANNEL_DIMENSIONS.width + CHANNEL_DIMENSIONS.height);
  const hartmannNumber = Math.round(B * charLength * Math.sqrt(Math.max(1, sigma) / coolant.viscosityPaS));

  // 6. Magnetic Reynolds Number: Rm = mu_0 * sigma * u * L
  const mu_0 = 4 * Math.PI * 1e-7;
  const magneticReynoldsNumber = Number((mu_0 * sigma * u * charLength).toFixed(3));

  // 7. Mach Number (for He-Xe gas)
  let machNumber = 0.15;
  if (params.coolantId === 'he_xe_plasma') {
    // Speed of sound in He-Xe at 1950 K is ~680 m/s
    const soundSpeed = 680;
    machNumber = Number((u / soundSpeed).toFixed(2));
  } else {
    // Liquid salt sound speed is ~2800 m/s
    machNumber = Number((u / 2800).toFixed(2));
  }

  // 8. Flow Regime
  let flowRegime: ReactorTelemetry['flowRegime'] = 'Laminarized (Hartmann Dominated)';
  if (params.isEmergencyDumpActive) {
    flowRegime = 'Draining to Subcritical Tanks';
  } else if (params.coolantId === 'he_xe_plasma' && machNumber > 1.0) {
    flowRegime = 'Supersonic Shock Boundary';
  } else if (hartmannNumber < 150) {
    flowRegime = 'Turbulent Transition';
  }

  // 9. Dump progress & inventory
  const dumpProgress = params.dumpProgress;
  const fuelInventoryInCorePercent = params.isEmergencyDumpActive 
    ? Math.max(0, 100 - dumpProgress * 100) 
    : 100;
  const dumpTankFillPercent = params.isEmergencyDumpActive 
    ? Math.min(100, dumpProgress * 100) 
    : 0;

  return {
    mhdPowerMWe: Number(mhdPowerMWe.toFixed(2)),
    thermalPowerMW: params.thermalPowerMW,
    efficiencyPercent: Number(efficiencyPercent.toFixed(1)),
    lorentzForceDensityKN_m3: Number(lorentzForceDensityKN_m3.toFixed(1)),
    hartmannNumber,
    magneticReynoldsNumber,
    machNumber,
    pressureDropBar: Number(pressureDropBar.toFixed(2)),
    flowRegime,
    fuelInventoryInCorePercent: Math.round(fuelInventoryInCorePercent),
    dumpTankFillPercent: Math.round(dumpTankFillPercent),
  };
}
