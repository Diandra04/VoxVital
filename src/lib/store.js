// in-memory store, on globalThis so it survives hot reloads
import os from 'os';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { calculateTriage, hasTrueRedFlag, capitalizeName } from './triageEngine';
import { PHONE_STRINGS } from './phoneStrings';

const patientsMap = (globalThis.__triagePatientsMap ??= new Map());
const subscribers = (globalThis.__triageSubscribers ??= new Set());
const helpAlerts = (globalThis.__triageHelpAlerts ??= []);

const STATUS_ORDER = { waiting: 1, confirmed: 2, called: 3, seen: 4 };
const DEFAULT_NURSE = 'RN Didi';

// phones can't reach localhost, use the LAN address
function publicBase() {
  if (process.env.PUBLIC_BASE) return process.env.PUBLIC_BASE;
  const lan = Object.values(os.networkInterfaces()).flat().find((i) => i?.family === 'IPv4' && !i.internal);
  return `http://${lan?.address || 'localhost'}:${process.env.PORT || 3000}`;
}

function snapshot(type, payload) {
  return JSON.stringify({
    type,
    patients: getAllPatientsSorted(),
    helpAlerts: [...helpAlerts],
    payload,
    timestamp: new Date().toISOString(),
  });
}

function notifySubscribers(type = 'update', payload = null) {
  const data = snapshot(type, payload);
  for (const send of subscribers) {
    try {
      send(data);
    } catch {
      subscribers.delete(send);
    }
  }
}

export function subscribeToTriage(send) {
  subscribers.add(send);
  send(snapshot('init'));
  return () => subscribers.delete(send);
}

export function requestStaffHelp(location = 'Walk-up Kiosk 1') {
  const alert = {
    id: `HELP-${Date.now().toString(36).toUpperCase()}`,
    location,
    timestamp: new Date().toISOString(),
  };
  helpAlerts.unshift(alert);
  notifySubscribers('help', alert);
  return alert;
}

export function dismissStaffHelp(alertId) {
  const idx = helpAlerts.findIndex((a) => a.id === alertId);
  if (idx !== -1) {
    helpAlerts.splice(idx, 1);
    notifySubscribers('help_dismissed', alertId);
  }
}

const isAcuteRedFlag = (p) =>
  !!p.redFlags?.some((f) => /cardiac|chest|stroke|airway/i.test(f));

export function getAllPatientsSorted() {
  return Array.from(patientsMap.values()).sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] || 1) - (STATUS_ORDER[b.status] || 1);
    if (statusDiff !== 0) return statusDiff;

    const levelDiff = a.suggestedLevel - b.suggestedLevel;
    if (levelDiff !== 0) return levelDiff;

    const redDiff = isAcuteRedFlag(b) - isAcuteRedFlag(a);
    if (redDiff !== 0) return redDiff;

    const recheckDiff = !!b.recheckRequested - !!a.recheckRequested;
    if (recheckDiff !== 0) return recheckDiff;

    return new Date(a.timestamp) - new Date(b.timestamp);
  });
}

export function getPatient(id) {
  return patientsMap.get(id);
}

// "A-12", "a12" or "12"
export function findPatientByTicket(input) {
  const digits = String(input).toUpperCase().replace(/^A-?/, '');
  return Array.from(patientsMap.values()).find((p) => p.ticketNumber === `A-${digits}`);
}

export function calculateQueueRank(patientId) {
  const waiting = getAllPatientsSorted().filter((p) => p.status === 'waiting');
  const index = waiting.findIndex((p) => p.id === patientId);
  return index === -1 ? 0 : index;
}

function nextTicketNumber() {
  const taken = new Set(Array.from(patientsMap.values(), (p) => p.ticketNumber));
  for (let i = 0; i < 50; i++) {
    const ticket = `A-${Math.floor(10 + Math.random() * 90)}`;
    if (!taken.has(ticket)) return ticket;
  }
  return `A-${100 + patientsMap.size}`;
}

function isGenericName(name) {
  return (
    !name ||
    name === 'Walk-up Patient' ||
    name === 'Intake Completed' ||
    name.startsWith('Patient ') ||
    name.startsWith('Ticket ')
  );
}

export async function addOrUpdatePatient(data) {
  const id = data.id || `PAT-${randomBytes(5).toString('hex').toUpperCase()}`;
  const existing = patientsMap.get(id);

  const who = data.who || existing?.who || 'self';
  const ageMonths = data.ageMonths != null ? Number(data.ageMonths) : (existing?.ageMonths ?? null);
  const vitalsSkipped = data.vitalsSkipped !== undefined ? Boolean(data.vitalsSkipped) : (existing?.vitalsSkipped ?? false);
  const recheckRequested = data.recheckRequested !== undefined ? Boolean(data.recheckRequested) : (existing?.recheckRequested ?? false);

  const pulse = vitalsSkipped ? null : (Number(data.pulse) || 75);
  const breathingRate = vitalsSkipped ? null : (Number(data.breathingRate) || 16);
  const painScore = Number(data.painScore) || 0;
  const transcript = data.transcript || '';
  const symptoms = data.symptoms || [];

  const triage = calculateTriage({
    pulse,
    breathingRate,
    painScore,
    transcript,
    symptoms,
    llmSuggestedLevel: data.llmSuggestedLevel || 5,
    meta: { ageMonths, age: data.age, vitalsSkipped, recheckRequested },
  });

  const statusUrl = `${data.publicBase || publicBase()}/status?id=${id}`;
  let qrCodeDataUrl = existing?.qrCodeDataUrl || '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(statusUrl);
  } catch (e) {
    console.error('QR code generation failed:', e);
  }

  const isTrueAlert = hasTrueRedFlag({
    chiefComplaint: data.chiefComplaint,
    symptoms,
    redFlags: triage.redFlags,
  });

  const ticketNumber = existing?.ticketNumber || data.ticketNumber || nextTicketNumber();
  const name = data.name?.trim() || existing?.name;

  let age = data.age;
  if (!age && ageMonths != null) {
    age = ageMonths < 24 ? `${ageMonths} mo` : `${Math.floor(ageMonths / 12)}`;
  }

  const record = {
    id,
    ticketNumber,
    name: isGenericName(name) ? ticketNumber : capitalizeName(name),
    sex: data.sex || existing?.sex || 'M',
    age: age || existing?.age || '45',
    who,
    ageMonths,
    pronouns: data.pronouns || existing?.pronouns || null,
    needsInterpreter: data.needsInterpreter !== undefined ? Boolean(data.needsInterpreter) : (existing?.needsInterpreter ?? false),
    callVisually: data.callVisually !== undefined ? Boolean(data.callVisually) : (existing?.callVisually ?? false),
    vitalsSkipped,
    recheckRequested,
    // kiosk rescan clears the nurse's request
    recheckRequestedByNurse: data.recheckRequestedByNurse ?? false,
    recheckRequestedAt: data.recheckRequestedByNurse ? existing?.recheckRequestedAt : null,
    phoneMessage: existing?.phoneMessage ?? null,
    rescanTimestamp: existing ? new Date().toISOString() : null,
    previousPulse: existing?.pulse ?? null,
    language: data.language || 'English',
    languageCode: data.languageCode || 'en',
    chiefComplaint: data.chiefComplaint || transcript.trim() || 'Patient reported discomfort',
    symptoms,
    onset: data.onset || existing?.onset || 'Skipped',
    allergies: data.allergies || existing?.allergies || 'Skipped',
    medications: data.medications || existing?.medications || 'Skipped',
    isPregnant: data.isPregnant || existing?.isPregnant || null,
    immunocompromised: data.immunocompromised || existing?.immunocompromised || 'Skipped',
    avpu: data.avpu || existing?.avpu || '',
    bpSystolic: data.bpSystolic || existing?.bpSystolic || null,
    bpDiastolic: data.bpDiastolic || existing?.bpDiastolic || null,
    temperature: data.temperature || existing?.temperature || null,
    spo2: existing?.spo2 ?? null,
    bloodSugar: data.bloodSugar || existing?.bloodSugar || null,
    painScore,
    pulse,
    breathingRate,
    vitals: vitalsSkipped ? null : {
      pulse,
      breathing: breathingRate,
      pulseConf: data.vitalsConfidence ? data.vitalsConfidence / 100 : 0.94,
      breathConf: 0.92,
      source: data.vitalsSource?.includes('Nurse') ? 'nurse' : 'camera',
      measuredAt: data.vitalsMeasuredAt || existing?.vitals?.measuredAt || (data.timestamp ? new Date(data.timestamp).getTime() : Date.now()),
    },
    vitalsSource: vitalsSkipped ? 'Skipped / Nurse Vitals Required' : (data.vitalsSource || 'Presage Optical Camera SDK'),
    originalTranscript: data.originalTranscript ?? transcript,
    verbatimTranslation: data.verbatimTranslation || existing?.verbatimTranslation || null,
    followUp: data.followUp || existing?.followUp || null,
    suggestedLevel: triage.suggestedLevel,
    confirmedLevel: existing?.confirmedLevel ?? null,
    confirmedBy: existing?.confirmedBy ?? null,
    confirmedAt: existing?.confirmedAt ?? null,
    overrideReason: existing?.overrideReason ?? null,
    redFlags: triage.redFlags,
    mismatchFlags: triage.mismatchFlags,
    reasons: triage.reasons,
    rationale: triage.rationale,
    alert: isTrueAlert ? (existing?.alert || { raisedAt: Date.now() }) : null,
    auditLog: existing?.auditLog || [
      { at: Date.now(), who: 'kiosk', what: `Completed intake (suggested L${triage.suggestedLevel})` },
    ],
    status: existing?.status || 'waiting',
    calledAt: existing?.calledAt ?? null,
    nurseOverrideLevel: existing?.nurseOverrideLevel ?? null,
    nurseNotes: existing?.nurseNotes || '',
    qrCodeDataUrl,
    timestamp: data.timestamp || existing?.timestamp || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  patientsMap.set(id, record);
  notifySubscribers(existing ? 'rescan' : 'new_patient', record);
  return record;
}

export function requestPatientRecheck(id) {
  const patient = patientsMap.get(id);
  if (!patient) return null;

  const flag = 'Patient reported condition worsening';
  patient.recheckRequested = true;
  if (!patient.mismatchFlags?.includes(flag)) {
    patient.mismatchFlags = [...(patient.mismatchFlags || []), flag];
  }
  patient.auditLog = patient.auditLog || [];
  patient.auditLog.push({ at: Date.now(), who: 'patient', what: 'Requested re-check while waiting (condition worsening)' });
  patient.updatedAt = new Date().toISOString();

  notifySubscribers('recheck_worse', patient);
  return patient;
}

const isBlank = (v) => v === undefined || v === null || v === '';

export function updateNurseAction(id, {
  nurseLevel,
  notes,
  status,
  pulse,
  breathingRate,
  bpSystolic,
  bpDiastolic,
  temperature,
  spo2,
  avpu,
  bloodSugar,
  nurseName = DEFAULT_NURSE,
  overrideReason,
  ackAlert,
  requestRecheck,
  phoneMessage,
}) {
  const patient = patientsMap.get(id);
  if (!patient) return null;

  patient.auditLog = patient.auditLog || [];
  const log = (what) => patient.auditLog.push({ at: Date.now(), who: nurseName, what });

  if (ackAlert && patient.alert) {
    patient.alert.ackBy = nurseName;
    patient.alert.ackAt = Date.now();
    log('Acknowledged red flag alert');
  }

  if (nurseLevel !== undefined && nurseLevel !== null) {
    const level = Number(nurseLevel);
    patient.confirmedLevel = level;
    patient.confirmedBy = nurseName;
    patient.confirmedAt = Date.now();
    patient.nurseOverrideLevel = level;

    if (level !== patient.suggestedLevel) {
      patient.overrideReason = overrideReason || notes || 'Clinical judgement';
      log(`Overrode level to L${level} (suggested L${patient.suggestedLevel}) · Reason: ${patient.overrideReason}`);
    } else {
      log(`Confirmed CTAS Level ${level}`);
    }
  }

  if (notes !== undefined) {
    patient.nurseNotes = notes;
  }

  if (avpu !== undefined && avpu !== null) {
    patient.avpu = avpu;
  }

  // blank fields = not measured
  const entered = { bpSystolic, bpDiastolic, temperature, spo2, bloodSugar };
  const hasAnyVitals = [pulse, breathingRate, ...Object.values(entered)].some((v) => !isBlank(v));

  if (hasAnyVitals) {
    const newPulse = isBlank(pulse) ? patient.pulse : Number(pulse);
    const newBreathing = isBlank(breathingRate) ? patient.breathingRate : Number(breathingRate);

    patient.pulse = newPulse;
    patient.breathingRate = newBreathing;
    for (const [key, value] of Object.entries(entered)) {
      if (!isBlank(value)) patient[key] = Number(value);
    }

    patient.vitalsSkipped = false;
    patient.vitals = {
      pulse: newPulse,
      breathing: newBreathing,
      bpSystolic: patient.bpSystolic,
      bpDiastolic: patient.bpDiastolic,
      temperature: patient.temperature,
      spo2: patient.spo2,
      bloodSugar: patient.bloodSugar,
      avpu: patient.avpu || 'Alert',
      pulseConf: 1,
      breathConf: 1,
      source: 'nurse',
      measuredAt: Date.now(),
    };
    patient.vitalsSource = `Nurse Entered (${nurseName})`;
    patient.vitalsConfidence = 100;

    const bp = patient.bpSystolic && patient.bpDiastolic ? `, BP ${patient.bpSystolic}/${patient.bpDiastolic}` : '';
    const temp = patient.temperature ? `, Temp ${patient.temperature}°C` : '';
    const sat = patient.spo2 ? `, SpO₂ ${patient.spo2}%` : '';
    log(`Entered manual nurse vitals: Pulse ${newPulse || '--'} bpm, Breathing rate ${newBreathing || '--'} breaths/min${bp}${temp}${sat}`);
  }

  if (status !== undefined && status !== patient.status) {
    const prevStatus = patient.status;
    patient.status = status;
    if (status === 'called') {
      patient.calledAt = Date.now();
    }
    if (status === 'seen') {
      patient.recheckRequested = false;
    }
    log(`Moved status from ${prevStatus} to ${status}`);
  }

  if (requestRecheck) {
    patient.recheckRequestedByNurse = true;
    patient.recheckRequestedAt = Date.now();
    log(`Re-check requested by ${nurseName}`);
  }

  if (PHONE_STRINGS.en.messages[phoneMessage]) {
    patient.phoneMessage = { key: phoneMessage, at: Date.now() };
    log(`Sent to patient's phone: "${PHONE_STRINGS.en.messages[phoneMessage]}"`);
  }

  patient.updatedAt = new Date().toISOString();
  notifySubscribers('nurse_action', patient);
  return patient;
}

async function seedDemoPatients() {
  patientsMap.clear();

  const now = Date.now();
  const minsAgo = (m) => now - m * 60000;

  const seedData = [
    {
      id: 'PAT-8091',
      ticketNumber: 'A-12',
      name: 'Jean-Luc Tremblay',
      age: '58',
      sex: 'M',
      who: 'self',
      language: 'French',
      languageCode: 'fr',
      chiefComplaint: 'Substernal chest pressure radiating to left arm',
      symptoms: ['Chest pain (from: "douleur à la poitrine")', 'Tightness radiating to arm (from: "descend dans le bras gauche")'],
      painScore: 8,
      pulse: 108,
      breathingRate: 25,
      vitalsConfidence: 96,
      vitalsMeasuredAt: minsAgo(12),
      vitalsSource: 'Presage Optical Camera SDK',
      transcript: "J'ai une forte douleur à la poitrine depuis 20 minutes, ça me serre fort et ça descend dans le bras gauche.",
      verbatimTranslation: "I have strong chest pain for 20 minutes, it's squeezing hard and going down my left arm.",
      allergies: 'Penicillin',
      medications: 'Aspirin 81mg daily',
      onset: '20 min before check-in',
      immunocompromised: 'Yes (Aspirin 81mg daily)',
      llmSuggestedLevel: 2,
      timestamp: new Date(minsAgo(12)).toISOString(),
    },
    {
      id: 'PAT-7742',
      ticketNumber: 'A-28',
      name: 'Baby Liam',
      age: '8 mo',
      sex: 'M',
      who: 'child',
      ageMonths: 8,
      vitalsSkipped: true,
      language: 'English',
      languageCode: 'en',
      chiefComplaint: 'High fever (39.5°C), refusing milk, and unusual sleepiness',
      symptoms: ['Fever 39.5°C (from: "39.5 fever")', 'Refusing milk (from: "won\'t drink milk")', 'Unusual sleepiness (from: "unusually sleepy")'],
      painScore: 7,
      transcript: "My baby has a 39.5 fever, won't drink milk, and is unusually sleepy.",
      llmSuggestedLevel: 2,
      timestamp: new Date(minsAgo(28)).toISOString(),
    },
    {
      id: 'PAT-6510',
      ticketNumber: 'A-45',
      name: 'Gurpreet Singh',
      age: '42',
      sex: 'M',
      who: 'self',
      language: 'Punjabi',
      languageCode: 'pa',
      chiefComplaint: 'Slight dizziness, says he feels fine otherwise',
      symptoms: ['Slight dizziness (from: "ਥੋੜ੍ਹਾ ਜਿਹਾ ਚੱਕਰ")', 'Says he feels fine (from: "ਮੈਂ ਬਿਲਕੁਲ ਠੀਕ ਹਾਂ")'],
      painScore: 2,
      pulse: 106,
      breathingRate: 24,
      vitalsConfidence: 91,
      vitalsMeasuredAt: minsAgo(45),
      vitalsSource: 'Presage Optical Camera SDK',
      transcript: 'ਮੈਂ ਬਿਲਕੁਲ ਠੀਕ ਹਾਂ, ਬੱਸ ਥੋੜ੍ਹਾ ਜਿਹਾ ਚੱਕਰ ਆ ਰਿਹਾ ਸੀ।',
      llmSuggestedLevel: 3,
      timestamp: new Date(minsAgo(45)).toISOString(),
    },
    {
      id: 'PAT-2105',
      ticketNumber: 'A-75',
      name: 'Mateo Garcia',
      age: '29',
      sex: 'M',
      who: 'self',
      language: 'Spanish',
      languageCode: 'es',
      chiefComplaint: 'Right ankle inversion strain after soccer match',
      symptoms: ['Right ankle pain (from: "doblé el tobillo derecho")', 'Pain on weight bearing (from: "puedo caminar pero me duele")'],
      painScore: 5,
      pulse: 76,
      breathingRate: 15,
      vitalsConfidence: 97,
      vitalsMeasuredAt: minsAgo(75),
      vitalsSource: 'Presage Optical Camera SDK',
      transcript: 'Me doblé el tobillo derecho jugando al fútbol, puedo caminar pero me duele.',
      llmSuggestedLevel: 4,
      timestamp: new Date(minsAgo(75)).toISOString(),
    },
    {
      id: 'PAT-1033',
      ticketNumber: 'A-90',
      name: 'Chen Wei',
      age: '35',
      sex: 'M',
      who: 'self',
      language: 'Mandarin',
      languageCode: 'zh',
      chiefComplaint: 'Routine tetanus booster request & return-to-work medical note',
      symptoms: ['Tetanus booster request (from: "破伤风疫苗")', 'Medical certificate (from: "复诊证明")'],
      painScore: 0,
      pulse: 72,
      breathingRate: 14,
      vitalsConfidence: 99,
      vitalsMeasuredAt: minsAgo(110),
      vitalsSource: 'Presage Optical Camera SDK',
      transcript: '我需要开一份常规的破伤风疫苗补打和复诊证明。',
      llmSuggestedLevel: 5,
      timestamp: new Date(minsAgo(110)).toISOString(),
    },
  ];

  await Promise.all(seedData.map(addOrUpdatePatient));

  const patients = getAllPatientsSorted();
  notifySubscribers('seed', patients);
  return patients;
}

export async function resetStore() {
  helpAlerts.length = 0;
  return seedDemoPatients();
}

// every route bundle imports this, only seed once
if (!globalThis.__triageSeeded) {
  globalThis.__triageSeeded = true;
  seedDemoPatients();
}
