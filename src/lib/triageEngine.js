export const CTAS_LEVELS = {
  1: 'Resuscitation',
  2: 'Emergent',
  3: 'Urgent',
  4: 'Less Urgent',
  5: 'Non-urgent',
};

const RED_FLAG_SYMPTOMS = [
  // Resuscitation (CTAS 1)
  { term: 'unconscious', level: 1, reason: 'Imminent life threat: Unconscious / Unresponsive' },
  { term: 'anaphylaxis', level: 1, reason: 'Imminent airway threat: Severe anaphylaxis' },
  { term: 'cardiac arrest', level: 1, reason: 'Imminent life threat: Cardiac arrest' },
  { term: 'stopped breathing', level: 1, reason: 'Imminent life threat: Respiratory arrest' },

  // Cardiovascular / Respiratory (CTAS 2)
  { term: 'chest pain', level: 2, reason: 'High-risk cardiac symptom: Substernal chest pain' },
  { term: 'chest pressure', level: 2, reason: 'High-risk cardiac symptom: Chest tightness/pressure' },
  { term: 'trouble breathing', level: 2, reason: 'Severe respiratory distress: Dyspnea' },
  { term: 'shortness of breath', level: 2, reason: 'Severe respiratory distress: Shortness of breath' },
  { term: 'cant breathe', level: 2, reason: 'Severe respiratory distress' },

  // Neurological / Stroke (CTAS 2)
  { term: 'face droop', level: 2, reason: 'Neurological red flag: FAST Stroke protocol (Facial droop)' },
  { term: 'arm weakness', level: 2, reason: 'Neurological red flag: FAST Stroke protocol (Arm weakness)' },
  { term: 'slurred speech', level: 2, reason: 'Neurological red flag: FAST Stroke protocol (Slurred speech)' },
  { term: 'stroke', level: 2, reason: 'Acute stroke protocol' },
  { term: 'thunderclap', level: 2, reason: 'Neurological red flag: Sudden onset severe headache' },
  { term: 'worst headache', level: 2, reason: 'Neurological red flag: Thunderclap headache' },
  { term: 'seizure', level: 2, reason: 'Neurological red flag: Acute post-ictal / seizure' },

  // Hemorrhage / Syncope (CTAS 2)
  { term: 'severe bleeding', level: 2, reason: 'Acute hemorrhage risk' },
  { term: 'fainting', level: 2, reason: 'Syncope / Sudden loss of consciousness' },
  { term: 'passed out', level: 2, reason: 'Syncope / Loss of consciousness' },

  // Mental Health & Obstetrics (CTAS 2)
  { term: 'suicidal', level: 2, reason: 'Acute mental health crisis: Suicidal ideation' },
  { term: 'severe allergic reaction', level: 2, reason: 'Airway / allergic risk' },
  { term: 'pregnancy bleeding', level: 2, reason: 'Obstetric red flag: Antepartum hemorrhage' },

  // PaedCTAS Specific Red Flags (CTAS 2)
  { term: 'grunting', level: 2, paedOnly: true, reason: 'Respiratory grunting' },
  { term: 'stridor', level: 2, paedOnly: true, reason: 'Stridor / Croup risk' },
  { term: 'lethargic', level: 2, paedOnly: true, reason: 'Lethargy' },
  { term: 'sleepy', level: 2, paedOnly: true, reason: 'Unusually sleepy' },
  { term: 'refusing milk', level: 2, paedOnly: true, reason: 'Infant poor feeding' },
  { term: 'won\'t drink', level: 2, paedOnly: true, reason: 'Fluid refusal' },
];

// Acute red flags only (cardiac, stroke, airway), not every CTAS modifier.
export function hasTrueRedFlag(patient) {
  if (!patient) return false;
  const trueKeywords = [
    'chest pain',
    'chest pressure',
    'cardiac',
    'stroke',
    'cant breathe',
    'can\'t breathe',
    'shortness of breath',
    'anaphylaxis',
    'unconscious',
    'seizure',
    'severe bleeding',
    'substernal',
    'airway',
  ];

  const redFlagsStr = patient.redFlags?.join(' ').toLowerCase() || '';
  const complaintStr = `${patient.chiefComplaint || ''} ${patient.symptoms?.join(' ') || ''}`.toLowerCase();

  return trueKeywords.some((kw) => redFlagsStr.includes(kw) || complaintStr.includes(kw));
}

export function topReason(patient) {
  if (!patient?.reasons?.length) return 'No red flags · routine';
  const [top] = [...patient.reasons].sort((a, b) => a.level - b.level);
  return top.text || 'No red flags · routine';
}

export function getPaediatricVitalsReferenceRange(ageMonths) {
  if (ageMonths == null || ageMonths >= 144) {
    return 'Adult Normal (≥12y): Pulse 60–100 bpm, Breathing rate 12–20 breaths/min';
  }
  if (ageMonths < 12) {
    return 'PaedCTAS Infant (<12m) Normal: Pulse 100–160 bpm, Breathing rate 30–50 breaths/min';
  }
  if (ageMonths < 60) {
    return 'PaedCTAS Toddler (1–5y) Normal: Pulse 80–130 bpm, Breathing rate 20–30 breaths/min';
  }
  return 'PaedCTAS Child (6–11y) Normal: Pulse 70–110 bpm, Breathing rate 16–24 breaths/min';
}

export function calculateTriage({
  pulse = 75,
  breathingRate = 16,
  painScore = 0,
  transcript = '',
  symptoms = [],
  llmSuggestedLevel = 5,
  meta = {},
}) {
  const redFlags = [];
  const mismatchFlags = [];
  const rulesTriggered = [];
  const reasons = [];

  let deterministicLevel = 5;

  let ageMonths = meta.ageMonths != null ? Number(meta.ageMonths) : null;
  if (ageMonths === null && meta.age) {
    const ageNum = parseInt(meta.age, 10);
    if (!isNaN(ageNum)) {
      ageMonths = meta.age.toLowerCase().includes('m') ? ageNum : ageNum * 12;
    }
  }

  const vitalsSkipped = !!meta.vitalsSkipped;
  const isInfant = ageMonths !== null && ageMonths < 12;
  const isChild = ageMonths !== null && ageMonths < 144;
  const ageYears = ageMonths !== null ? Math.floor(ageMonths / 12) : null;

  if (vitalsSkipped) {
    if (isChild) {
      rulesTriggered.push('Camera scan skipped for child under 12. Manual nurse vitals required');
      reasons.push({ text: 'Manual vitals required for child', source: 'age', level: 3 });
    } else {
      rulesTriggered.push('Optical vitals skipped or failed: manual nurse vitals required');
      reasons.push({ text: 'Camera vitals skipped · manual nurse vitals required', source: 'vitals', level: 4 });
    }
  }

  if (isInfant) {
    redFlags.push('Infant under 12 months');
    deterministicLevel = Math.min(deterministicLevel, 2);
    rulesTriggered.push('Infant under 12 months → Minimum CTAS Level 2 Emergent');
    reasons.push({ text: 'Infant under 12 months', source: 'age', level: 2 });
  }

  const textToSearch = `${transcript} ${symptoms.join(' ')}`.toLowerCase();
  const hasFever = textToSearch.includes('fever') || textToSearch.includes('fièvre') || textToSearch.includes('fiebre');
  if (ageMonths !== null && ageMonths < 3 && hasFever) {
    redFlags.push('Fever in infant < 3 months');
    deterministicLevel = Math.min(deterministicLevel, 2);
    rulesTriggered.push('High fever in infant under 3 months → Forces CTAS Level 2 Emergent');
    reasons.push({ text: 'High fever in infant under 3 months', source: 'age', level: 2 });
  }

  if (meta.recheckRequested) {
    mismatchFlags.push('Patient reported condition worsening');
    rulesTriggered.push('Patient initiated re-check while waiting: condition reported worsening');
    reasons.push({ text: 'Patient reported condition worsening while waiting', source: 'patient', level: 2 });
    deterministicLevel = Math.min(deterministicLevel, 2);
  }

  for (const flag of RED_FLAG_SYMPTOMS) {
    if (flag.paedOnly && !isChild) continue;
    if (textToSearch.includes(flag.term)) {
      redFlags.push(flag.reason);
      deterministicLevel = Math.min(deterministicLevel, flag.level);
      rulesTriggered.push(`CTAS Red Flag Modifier: "${flag.term}" → Minimum CTAS Level ${flag.level}`);

      if (flag.term.includes('chest') && (ageYears === null || ageYears >= 40)) {
        reasons.push({
          text: `Chest pain / pressure in adult (${ageYears ? `${ageYears}y` : '≥40y'})`,
          source: 'vitals',
          level: 2,
        });
      } else {
        reasons.push({
          text: flag.reason,
          source: 'symptom',
          level: flag.level,
        });
      }
    }
  }

  // Age-adjusted vital sign thresholds
  if (!vitalsSkipped && (pulse !== null || breathingRate !== null)) {
    const numericPulse = Number(pulse);
    const numericBreathing = Number(breathingRate);

    let highPulse = 105, lowPulse = 50;
    let highBreathing = 24, lowBreathing = 8;

    if (isInfant) {
      highPulse = 165; lowPulse = 90;
      highBreathing = 55; lowBreathing = 20;
    } else if (ageMonths !== null && ageMonths < 60) {
      highPulse = 135; lowPulse = 75;
      highBreathing = 35; lowBreathing = 14;
    } else if (ageMonths !== null && ageMonths < 144) {
      highPulse = 115; lowPulse = 65;
      highBreathing = 28; lowBreathing = 12;
    }

    if (numericBreathing && numericBreathing <= lowBreathing) {
      deterministicLevel = Math.min(deterministicLevel, 1);
      rulesTriggered.push(`Critical respiratory depression (${numericBreathing} breaths/min) → CTAS Level 1 Resuscitation`);
      reasons.push({ text: `Critical bradypnea (${numericBreathing} breaths/min)`, source: 'vitals', level: 1 });
    } else if (numericBreathing && numericBreathing >= highBreathing) {
      deterministicLevel = Math.min(deterministicLevel, 2);
      rulesTriggered.push(`Elevated respiratory rate (${numericBreathing} breaths/min) → Minimum CTAS Level 2 Emergent`);
      reasons.push({ text: `Elevated breathing rate (${numericBreathing} breaths/min)`, source: 'vitals', level: 2 });
    }

    if (numericPulse && numericPulse >= highPulse) {
      deterministicLevel = Math.min(deterministicLevel, 2);
      rulesTriggered.push(`Elevated heart rate (${numericPulse} bpm) → Minimum CTAS Level 2 Emergent`);
      reasons.push({ text: `Elevated pulse rate (${numericPulse} bpm)`, source: 'vitals', level: 2 });
    } else if (numericPulse && numericPulse <= lowPulse) {
      deterministicLevel = Math.min(deterministicLevel, 2);
      rulesTriggered.push(`Low heart rate (${numericPulse} bpm) → Minimum CTAS Level 2 Emergent`);
      reasons.push({ text: `Low pulse rate (${numericPulse} bpm)`, source: 'vitals', level: 2 });
    }
  }

  const numericPain = Number(painScore) || 0;
  if (numericPain >= 8) {
    deterministicLevel = Math.min(deterministicLevel, 2);
    rulesTriggered.push(`Severe acute pain (${numericPain}/10) → Minimum CTAS Level 2 Emergent`);
    reasons.push({ text: `Pain rated ${numericPain}/10 by patient`, source: 'patient', level: 2 });
  } else if (numericPain >= 4) {
    deterministicLevel = Math.min(deterministicLevel, 3);
    rulesTriggered.push(`Moderate pain rating (${numericPain}/10) → Minimum CTAS Level 3 Urgent`);
    reasons.push({ text: `Pain rated ${numericPain}/10 by patient`, source: 'patient', level: 3 });
  } else if (numericPain >= 1) {
    deterministicLevel = Math.min(deterministicLevel, 4);
    rulesTriggered.push(`Mild pain rating (${numericPain}/10) → Minimum CTAS Level 4 Less Urgent`);
    reasons.push({ text: `Pain rated ${numericPain}/10 by patient`, source: 'patient', level: 4 });
  }

  // Flag answers that don't match what the camera measured
  if (!vitalsSkipped) {
    const numericPulse = Number(pulse) || 75;
    const numericBreathing = Number(breathingRate) || 16;
    const isVitalsCalm = numericPulse >= 60 && numericPulse <= 88 && numericBreathing >= 12 && numericBreathing <= 18;
    const isVitalsAbnormal = numericPulse >= 102 || numericBreathing >= 24;

    if (numericPain >= 9 && isVitalsCalm) {
      mismatchFlags.push('Verify: symptoms/vitals mismatch');
      rulesTriggered.push(`High pain rating (${numericPain}/10) alongside calm resting vitals (Pulse ${numericPulse}, Resp ${numericBreathing})`);
      reasons.push({ text: 'High pain reported alongside calm resting vitals', source: 'patient', level: 3 });
    }

    const lowClaimWords = ['fine', 'okay', 'good', 'nothing', 'minor', 'alright', 'bien', 'ca va', 'pas grave'];
    const hasLowClaim = lowClaimWords.some((w) => textToSearch.includes(w)) || (numericPain <= 2 && transcript.length < 50);

    if (hasLowClaim && isVitalsAbnormal) {
      mismatchFlags.push('Readings higher than symptoms suggest');
      rulesTriggered.push(`Patient reports minimal distress, but physiological scan indicates elevated metrics (Pulse ${numericPulse}, Resp ${numericBreathing})`);
      reasons.push({ text: `Says he feels fine · camera scan detects elevated pulse (${numericPulse} bpm)`, source: 'vitals', level: 2 });
    }
  }

  // The LLM can only raise priority, never lower it.
  let finalSuggestedLevel = deterministicLevel;
  const llmLevel = Number(llmSuggestedLevel);
  if (llmLevel >= 1 && llmLevel <= 5 && llmLevel < deterministicLevel) {
    finalSuggestedLevel = llmLevel;
    rulesTriggered.push(`Gemini AI clinical reasoning escalated priority from CTAS ${deterministicLevel} to CTAS ${llmLevel}`);
    reasons.push({ text: `AI clinical reasoning escalated priority to CTAS Level ${llmLevel}`, source: 'ai', level: llmLevel });
  }

  const uniqueReasons = reasons.filter((r, idx, self) => idx === self.findIndex((o) => o.text === r.text));

  if (uniqueReasons.length === 0) {
    if (finalSuggestedLevel === 5) {
      uniqueReasons.push({ text: 'No red flags · routine', source: 'symptom', level: 5 });
    } else if (finalSuggestedLevel === 4) {
      uniqueReasons.push({ text: 'Minor localized symptoms · non-progressive', source: 'patient', level: 4 });
    } else {
      uniqueReasons.push({ text: `Standard CTAS evaluation Level ${finalSuggestedLevel}`, source: 'symptom', level: finalSuggestedLevel });
    }
  }

  const rationale = rulesTriggered.length > 0
    ? rulesTriggered.join('. ') + '.'
    : `Standard evaluation based on reported pain (${numericPain}/10).`;

  return {
    suggestedLevel: finalSuggestedLevel,
    redFlags,
    mismatchFlags,
    reasons: uniqueReasons,
    rationale,
  };
}

export function capitalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-')
    )
    .join(' ');
}
