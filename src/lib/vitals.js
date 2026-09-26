import { EventEmitter } from 'events';

export const vitalsEmitter = new EventEmitter();

let isStarted = false;
// The simulator wanders around these; the kiosk demo menu moves them
let basePulse = 74;
let baseBreathing = 16;
let currentReading = {
  pulse: 74,
  breathing: 16,
  pulseConf: 0.94,
  breathConf: 0.91,
  simulated: true,
  timestamp: new Date().toISOString(),
};

export function getLatestVitals() {
  return currentReading;
}

export async function startVitals() {
  if (isStarted) return;
  isStarted = true;

  const isSimulated = process.env.SIMULATED_VITALS === '1' || !process.env.PRESAGE_API_KEY;

  if (isSimulated) {
    runSimulationLoop();
    return;
  }

  try {
    // Optional dependency; kept out of the bundle so the app runs without it.
    const sdkName = '@smartspectra/node-sdk';
    const { SmartSpectraSDK, breathingMetrics, cardioMetrics, decodeMetrics } = await import(/* webpackIgnore: true */ sdkName);

    const sdk = new SmartSpectraSDK({
      apiKey: process.env.PRESAGE_API_KEY,
      requestedMetrics: [...breathingMetrics, ...cardioMetrics],
    });

    sdk.on('metrics', (buf) => {
      try {
        const decoded = decodeMetrics(buf);
        const pulseVal = decoded.cardio?.pulse_rate || decoded.pulse_rate || 75;
        const breathVal = decoded.breathing?.breathing_rate || decoded.breathing_rate || 16;
        const pConf = decoded.cardio?.confidence || 0.9;
        const bConf = decoded.breathing?.confidence || 0.85;

        currentReading = {
          pulse: Math.round(pulseVal),
          breathing: Math.round(breathVal),
          pulseConf: Number(pConf.toFixed(2)),
          breathConf: Number(bConf.toFixed(2)),
          simulated: false,
          timestamp: new Date().toISOString(),
        };

        vitalsEmitter.emit('reading', currentReading);
      } catch (err) {
        console.error('Presage buffer error:', err);
      }
    });

    sdk.useCamera();
    sdk.start();
  } catch {
    runSimulationLoop();
  }
}

function runSimulationLoop() {
  setInterval(() => {
    const pulseDelta = (Math.random() - 0.5) * 2;
    const breathDelta = (Math.random() - 0.5) * 0.8;

    currentReading = {
      pulse: Math.max(45, Math.min(130, Math.round(basePulse + pulseDelta))),
      breathing: Math.max(6, Math.min(32, Math.round(baseBreathing + breathDelta))),
      pulseConf: Number((0.92 + Math.random() * 0.07).toFixed(2)),
      breathConf: Number((0.88 + Math.random() * 0.09).toFixed(2)),
      simulated: true,
      timestamp: new Date().toISOString(),
    };

    vitalsEmitter.emit('reading', currentReading);
  }, 1000);
}

export function setSimulatedVitalsTarget({ pulse, breathing }) {
  if (pulse !== undefined) {
    basePulse = Number(pulse);
    currentReading.pulse = basePulse;
  }
  if (breathing !== undefined) {
    baseBreathing = Number(breathing);
    currentReading.breathing = baseBreathing;
  }
  currentReading.timestamp = new Date().toISOString();
  vitalsEmitter.emit('reading', currentReading);
  return currentReading;
}
