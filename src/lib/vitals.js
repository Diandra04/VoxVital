import { EventEmitter } from 'events';

// Simulated camera vitals. The kiosk's demo menu can move the baseline.
export const vitalsEmitter = new EventEmitter();

let isStarted = false;
let basePulse = 74;
let baseBreathing = 16;
let currentReading = {
  pulse: 74,
  breathing: 16,
  pulseConf: 0.94,
  breathConf: 0.91,
  timestamp: new Date().toISOString(),
};

export function getLatestVitals() {
  return currentReading;
}

export function startVitals() {
  if (isStarted) return;
  isStarted = true;

  setInterval(() => {
    const pulseDelta = (Math.random() - 0.5) * 2;
    const breathDelta = (Math.random() - 0.5) * 0.8;

    currentReading = {
      pulse: Math.max(45, Math.min(130, Math.round(basePulse + pulseDelta))),
      breathing: Math.max(6, Math.min(32, Math.round(baseBreathing + breathDelta))),
      pulseConf: Number((0.92 + Math.random() * 0.07).toFixed(2)),
      breathConf: Number((0.88 + Math.random() * 0.09).toFixed(2)),
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
