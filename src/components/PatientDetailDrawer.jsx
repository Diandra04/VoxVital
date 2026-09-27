'use client';

import { useState } from 'react';
import {
  X,
  Globe,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  UserCheck,
  Check,
  AlertCircle,
  Pill,
} from 'lucide-react';
import { CTAS_LEVELS, getPaediatricVitalsReferenceRange, capitalizeName } from '@/lib/triageEngine';
import { PHONE_STRINGS, phoneStrings } from '@/lib/phoneStrings';

export default function PatientDetailDrawer({ patient, onClose, onUpdateNurseAction }) {
  const [selectedLevel, setSelectedLevel] = useState(patient?.confirmedLevel || patient?.nurseOverrideLevel || patient?.suggestedLevel || 3);
  const [overrideReasonChoice, setOverrideReasonChoice] = useState(patient?.overrideReason || 'Clinical judgement');
  const [nurseNotes, setNurseNotes] = useState(patient?.nurseNotes || '');
  const [manualPulse, setManualPulse] = useState('');
  const [manualBreathing, setManualBreathing] = useState('');
  const [manualSpo2, setManualSpo2] = useState(patient?.spo2 ?? '');
  const [manualBpSys, setManualBpSys] = useState(patient?.bpSystolic ?? '');
  const [manualBpDia, setManualBpDia] = useState(patient?.bpDiastolic ?? '');
  const [manualTemp, setManualTemp] = useState(patient?.temperature ?? '');
  const [manualAvpu, setManualAvpu] = useState(patient?.avpu || '');
  const [manualBloodSugar, setManualBloodSugar] = useState(patient?.bloodSugar ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [noteError, setNoteError] = useState(false);
  const [vitalsSavedMsg, setVitalsSavedMsg] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(null);

  if (!patient) return null;

  const isOverriding = selectedLevel !== patient.suggestedLevel;
  const isNoteRequired = isOverriding && !nurseNotes.trim() && overrideReasonChoice === 'Other';
  const isNoScan = patient.vitalsSkipped || patient.pulse === null || patient.breathingRate === null;
  const isChild = patient.who === 'child' || (patient.ageMonths != null && patient.ageMonths < 144);
  const refRange = getPaediatricVitalsReferenceRange(patient.ageMonths);

  const isSuggested = !patient.confirmedLevel && !patient.nurseOverrideLevel;
  const currentLevel = patient.confirmedLevel || patient.nurseOverrideLevel || patient.suggestedLevel;
  const isEmergent = currentLevel <= 2;
  const isUrgent = currentLevel === 3;

  let circleClass = '';
  if (isEmergent) {
    circleClass = isSuggested
      ? 'border-2 border-red-600 text-red-600 bg-white font-extrabold'
      : 'bg-red-600 text-white font-extrabold';
  } else if (isUrgent) {
    circleClass = isSuggested
      ? 'border-2 border-amber-500 text-amber-600 bg-white font-extrabold'
      : 'bg-amber-500 text-white font-extrabold';
  } else {
    circleClass = isSuggested
      ? 'border-2 border-emerald-600 text-emerald-600 bg-white font-extrabold'
      : 'bg-emerald-600 text-white font-extrabold';
  }

  const getSourceBadge = (reasonText, source) => {
    if (reasonText?.toLowerCase().includes('chest pain')) {
      return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Patient said</span>;
    }
    switch (source) {
      case 'vitals':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">Camera</span>;
      case 'ai':
        return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px]">AI raised</span>;
      case 'patient':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Patient said</span>;
      case 'age':
      case 'symptom':
      default:
        return <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 font-bold text-[10px]">Rule</span>;
    }
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateNurseAction(patient.id, {
        pulse: manualPulse !== '' ? Number(manualPulse) : null,
        breathingRate: manualBreathing !== '' ? Number(manualBreathing) : null,
        bpSystolic: manualBpSys !== '' ? Number(manualBpSys) : null,
        bpDiastolic: manualBpDia !== '' ? Number(manualBpDia) : null,
        temperature: manualTemp !== '' ? Number(manualTemp) : null,
        spo2: manualSpo2 !== '' ? Number(manualSpo2) : null,
        avpu: manualAvpu,
        bloodSugar: manualBloodSugar !== '' ? Number(manualBloodSugar) : null,
        notes: nurseNotes,
      });
      setIsSaving(false);
      setVitalsSavedMsg(true);
      setTimeout(() => setVitalsSavedMsg(false), 3000);
    } catch {
      setIsSaving(false);
    }
  };

  const handleSaveNurseAction = async (newStatus = 'confirmed') => {
    const isLoweringPriority = selectedLevel > patient.suggestedLevel;
    if ((isOverriding && overrideReasonChoice === 'Other' && !nurseNotes.trim()) || (isLoweringPriority && !nurseNotes.trim())) {
      setNoteError(true);
      return;
    }
    setNoteError(false);

    const finalOverrideReason = isOverriding
      ? (overrideReasonChoice === 'Other' ? nurseNotes : `${overrideReasonChoice}${nurseNotes ? `: ${nurseNotes}` : ''}`)
      : null;

    try {
      setIsSaving(true);
      await onUpdateNurseAction(patient.id, {
        nurseLevel: selectedLevel,
        overrideReason: finalOverrideReason,
        notes: nurseNotes,
        pulse: manualPulse !== '' ? Number(manualPulse) : null,
        breathingRate: manualBreathing !== '' ? Number(manualBreathing) : null,
        bpSystolic: manualBpSys !== '' ? Number(manualBpSys) : null,
        bpDiastolic: manualBpDia !== '' ? Number(manualBpDia) : null,
        temperature: manualTemp !== '' ? Number(manualTemp) : null,
        spo2: manualSpo2 !== '' ? Number(manualSpo2) : null,
        avpu: manualAvpu,
        bloodSugar: manualBloodSugar !== '' ? Number(manualBloodSugar) : null,
        status: newStatus,
      });
      setIsSaving(false);
      onClose();
    } catch {
      setIsSaving(false);
    }
  };

  const handleSendToPhone = async (key) => {
    setSendingMessage(key);
    await onUpdateNurseAction(patient.id, { phoneMessage: key });
    setSendingMessage(null);
  };

  const formatHHMM = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  const ticketNumber = patient.ticketNumber || (patient.id ? `A-${patient.id.slice(-4).toUpperCase()}` : 'A-17');

  const reasonsList = patient.reasons && patient.reasons.length > 0 ? patient.reasons : [
    { text: patient.rationale || 'Standard CTAS evaluation', source: 'symptom', level: patient.suggestedLevel }
  ];

  const hasAiRaisedReason = reasonsList.some((r) => r.source === 'ai');

  const historyEntries = [];
  const checkinTime = formatHHMM(patient.timestamp);
  const originalSpeech = patient.originalTranscript || patient.chiefComplaint;

  const englishTranslation = patient.verbatimTranslation || (
    patient.language !== 'English' && patient.chiefComplaint !== originalSpeech ? patient.chiefComplaint : null
  );

  historyEntries.push({
    at: Date.parse(patient.timestamp),
    title: `Checked in at kiosk · ${checkinTime}`,
    text: `"${originalSpeech}"`,
    translation: englishTranslation,
  });

  for (const a of patient.auditLog || []) {
    if (a.who === 'kiosk' && a.what?.toLowerCase().includes('completed intake')) continue;
    historyEntries.push({
      at: a.at,
      title: `${a.who || 'Nurse'} · ${formatHHMM(a.at)}`,
      text: a.what,
    });
  }

  historyEntries.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));

  const vitalsTimeStr = formatHHMM(patient.vitals?.measuredAt || patient.timestamp);
  const vitalsSourceStr = patient.vitals?.source === 'nurse'
    ? 'Nurse'
    : patient.vitalsSource?.includes('Simulated') ? 'Camera (simulated)' : 'Camera';

  const NO_ANSWER = ['None reported', 'Skipped', 'Not answered', 'None', 'No'];
  const hasAllergies = !!patient.allergies && !NO_ANSWER.includes(patient.allergies);
  const hasMeds = !!patient.medications && !NO_ANSWER.includes(patient.medications);
  const isBloodThinner = hasMeds && /thin|warfarin|coumadin|aspirin|eliquis|plavix/i.test(patient.medications);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end font-sans">
      <div className="w-full max-w-2xl bg-white border-l border-zinc-300 h-full overflow-y-auto p-6 space-y-6 text-left text-black flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 font-bold">{ticketNumber}</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-black text-xs font-bold border border-zinc-300">
                  <Globe className="w-3 h-3 inline mr-1 text-black" />
                  {patient.language}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-black mt-1">
                {patient.name?.trim() && patient.name.trim() !== 'Walk-up Patient' && !patient.name.trim().startsWith('Ticket ') ? capitalizeName(patient.name.trim()) : ticketNumber} {patient.pronouns ? `(${patient.pronouns})` : ''} · {patient.age} {patient.sex}
              </h2>

              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {hasAllergies && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 text-xs font-extrabold">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    Allergy: {patient.allergies}
                  </span>
                )}

                {hasMeds && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isBloodThinner
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                  }`}>
                    <Pill className="w-3 h-3 text-amber-700 shrink-0" />
                    {isBloodThinner ? `Blood thinners: ${patient.medications}` : `Meds: ${patient.medications}`}
                  </span>
                )}

                {patient.needsInterpreter && (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold">
                    Needs interpreter
                  </span>
                )}
                {patient.callVisually && (
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold">
                    Call visually
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded bg-zinc-100 hover:bg-zinc-200 text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {patient.mismatchFlags?.includes('Readings higher than symptoms suggest') && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
              <div className="font-extrabold text-sm text-amber-950">
                Readings higher than symptoms suggest
              </div>
              <p className="text-xs font-medium leading-relaxed text-amber-900">
                Patient claims minimal pain or mild symptoms, but telemetry detects elevated physiological metrics ({patient.pulse ? `${patient.pulse} bpm` : 'elevated vitals'}).
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-500 font-bold block">Suggested level</span>
              <span className="text-lg font-bold text-black">
                Level {patient.suggestedLevel}: {CTAS_LEVELS[patient.suggestedLevel]}
              </span>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${circleClass}`}>
              {patient.suggestedLevel}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900">
              Why level {patient.suggestedLevel}
            </h3>
            
            <div className="space-y-2">
              {reasonsList.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-zinc-900 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-800 leading-snug">{r.text}</span>
                  </div>
                  {getSourceBadge(r.text, r.source)}
                </div>
              ))}
            </div>

            {hasAiRaisedReason && (
              <p className="text-[11px] text-zinc-500 font-medium pt-1">
                AI raised: added by AI. The nurse makes the final call.
              </p>
            )}
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900">
              Summary in English
            </h3>
            <p className="text-sm text-zinc-800 font-medium leading-relaxed">{patient.chiefComplaint}</p>
            
            {patient.symptoms?.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-zinc-200">
                <span className="text-[11px] text-zinc-500 block font-semibold">Patient&apos;s words:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {patient.symptoms.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-white text-black text-xs font-bold border border-zinc-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {patient.followUps?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-200 text-xs">
                <span className="text-[11px] text-zinc-500 block font-semibold">Kiosk follow-up (spoken in {patient.language}):</span>
                {patient.followUps.map((f, i) => (
                  <div key={i}>
                    <p className="font-bold text-zinc-900">{f.questionEnglish}</p>
                    <p className="text-zinc-800 font-medium">&quot;{f.answer}&quot;</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 font-medium block">Onset:</span>
                <span className="font-bold text-zinc-900">{patient.onset}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium block">Blood thinners:</span>
                <span className="font-bold text-zinc-900">{isBloodThinner ? `Yes (${patient.medications})` : (patient.immunocompromised || 'No')}</span>
              </div>
              {patient.isPregnant && (
                <div className="col-span-2">
                  <span className="text-zinc-500 font-medium block">Pregnancy status:</span>
                  <span className="font-bold text-zinc-900">{patient.isPregnant}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900">
              History
            </h3>

            <div className="space-y-3 relative pl-4 border-l-2 border-zinc-300 ml-1">
              {historyEntries.map((entry, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-white" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-black">
                      {entry.title}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-zinc-200 text-xs space-y-1">
                    <p className="text-zinc-800 font-medium">{entry.text}</p>
                    {entry.translation && (
                      <p className="text-zinc-600 font-medium italic pt-1 border-t border-zinc-100 text-[11px]">
                        Translation: &quot;{entry.translation}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">
                Vitals
              </h3>
              {patient.status !== 'seen' && (
                patient.recheckRequestedByNurse ? (
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-check requested {formatHHMM(patient.recheckRequestedAt)} · on their phone
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateNurseAction(patient.id, { requestRecheck: true })}
                    className="text-xs font-bold text-amber-900 bg-white hover:bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Request re-check
                  </button>
                )
              )}
            </div>

            {isNoScan ? (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs">
                <span className="font-bold block text-amber-950">Scan skipped · Nurse vitals needed</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-zinc-200">
                    <span className="text-xs text-zinc-500 font-medium block">Pulse</span>
                    <span className="text-xl font-bold text-black">
                      {patient.pulse}{' '}
                      <span className="text-xs font-normal text-zinc-500">bpm</span>
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-zinc-200">
                    <span className="text-xs text-zinc-500 font-medium block">Breathing rate</span>
                    <span className="text-xl font-bold text-black">
                      {patient.breathingRate}{' '}
                      <span className="text-xs font-normal text-zinc-500">breaths/min</span>
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 font-medium pl-1">
                  {vitalsSourceStr}, {vitalsTimeStr}
                </div>
              </div>
            )}

            <form id="nurse-vitals-form" onSubmit={handleSaveVitals} className={`space-y-4 bg-white p-4 rounded-xl border transition-all ${patient.vitalsSkipped ? 'border-amber-400' : 'border-zinc-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900">
                  Add nurse vitals
                </h4>
                {vitalsSavedMsg && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>

              {isChild && (
                <div className="p-2 rounded bg-zinc-100 text-[11px] font-bold text-zinc-800 border border-zinc-300">
                  Reference: {refRange}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-600 block">
                  Level of consciousness (AVPU)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'Alert', label: 'Alert' },
                    { id: 'Responds to voice', label: 'Responds to voice' },
                    { id: 'Responds to pain', label: 'Responds to pain' },
                    { id: 'Unresponsive', label: 'Unresponsive' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setManualAvpu(item.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                        manualAvpu === item.id
                          ? 'bg-black text-white border-black'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                    Blood pressure (mmHg)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="120"
                      value={manualBpSys}
                      onChange={(e) => setManualBpSys(e.target.value)}
                      className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                    />
                    <span className="text-zinc-400 font-bold">/</span>
                    <input
                      type="number"
                      placeholder="80"
                      value={manualBpDia}
                      onChange={(e) => setManualBpDia(e.target.value)}
                      className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 37.2"
                    value={manualTemp}
                    onChange={(e) => setManualTemp(e.target.value)}
                    className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 108"
                    value={manualPulse}
                    onChange={(e) => setManualPulse(e.target.value)}
                    className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                    Breathing rate (breaths/min)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={manualBreathing}
                    onChange={(e) => setManualBreathing(e.target.value)}
                    className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                    SpO₂ (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 98"
                    value={manualSpo2}
                    onChange={(e) => setManualSpo2(e.target.value)}
                    className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                    Blood sugar (mmol/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5.5"
                    value={manualBloodSugar}
                    onChange={(e) => setManualBloodSugar(e.target.value)}
                    className="w-full bg-zinc-50 text-black text-xs font-bold p-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-1.5 px-3.5 rounded-lg bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-colors shrink-0"
                >
                  Save nurse vitals
                </button>
              </div>
            </form>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-zinc-900">
              Message patient&apos;s phone
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">
              Shows on their status page in {patient.language} and is read aloud if they turned on alerts.
            </p>

            <div className="space-y-2 pt-1">
              {Object.entries(PHONE_STRINGS.en.messages).map(([key, english]) => {
                const wasSent = patient.phoneMessage?.key === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSendToPhone(key)}
                    disabled={!!sendingMessage}
                    className="w-full p-2.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-left text-xs font-medium transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <span className="font-bold block text-zinc-900">{english}</span>
                      {patient.languageCode !== 'en' && (
                        <span className="text-[11px] text-zinc-500">{phoneStrings(patient.languageCode).messages[key]}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-zinc-500 group-hover:text-black">
                      {wasSent && (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Sent {formatHHMM(patient.phoneMessage.at)}
                        </span>
                      )}
                      <Smartphone className="w-4 h-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 space-y-4 mt-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900 block">
              Your decision
            </label>

            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(lvl);
                    if (lvl <= patient.suggestedLevel) setNoteError(false);
                  }}
                  className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                    selectedLevel === lvl
                      ? 'bg-black text-white border-black font-extrabold'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  Level {lvl}
                </button>
              ))}
            </div>
          </div>

          {selectedLevel > patient.suggestedLevel && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
              <label className="text-xs font-bold text-amber-950 block">
                Triage Priority Lowered (Note Required) *
              </label>
              <p className="text-xs text-amber-900 font-medium">
                You are lowering triage priority from CTAS L{patient.suggestedLevel} to CTAS L{selectedLevel}. Please select a rationale and document clinical reasons in the notes box below.
              </p>

              <select
                value={overrideReasonChoice}
                onChange={(e) => setOverrideReasonChoice(e.target.value)}
                className="w-full bg-white text-black text-xs font-bold p-2.5 rounded-lg border border-zinc-300 focus:outline-none"
              >
                <option value="Clinical judgement">Clinical judgement</option>
                <option value="Vitals re-checked">Vitals re-checked</option>
                <option value="More history obtained">More history obtained</option>
                <option value="Other">Other (enter notes below)</option>
              </select>
            </div>
          )}

          <div>
            <textarea
              value={nurseNotes}
              onChange={(e) => {
                setNurseNotes(e.target.value);
                if (e.target.value.trim()) setNoteError(false);
              }}
              placeholder={
                selectedLevel > patient.suggestedLevel
                  ? 'Required: Document clinical rationale for lowering triage priority...'
                  : 'Notes (optional)'
              }
              className={`w-full bg-white text-black text-xs p-3 rounded-xl border focus:outline-none min-h-[55px] font-medium ${
                noteError
                  ? 'border-amber-500 bg-amber-50/50 focus:border-amber-600'
                  : 'border-zinc-300 focus:border-zinc-800'
              }`}
            />
            {noteError && (
              <p className="text-[11px] text-amber-700 font-bold mt-1">
                * Clinical note required when lowering triage priority from L{patient.suggestedLevel} to L{selectedLevel}.
              </p>
            )}
          </div>

          <div className="flex items-center">
            {patient.status === 'waiting' && (
              <button
                onClick={() => handleSaveNurseAction('confirmed')}
                disabled={isSaving || isNoteRequired}
                className={`w-full py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  isNoteRequired
                    ? 'bg-zinc-300 text-zinc-600 cursor-not-allowed border border-zinc-300'
                    : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Confirm level {selectedLevel}</span>
              </button>
            )}

            {patient.status === 'confirmed' && (
              <button
                onClick={() => handleSaveNurseAction('called')}
                disabled={isSaving || isNoteRequired}
                className="w-full py-3 px-3 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Call patient</span>
              </button>
            )}

            {patient.status === 'called' && (
              <button
                onClick={() => handleSaveNurseAction('seen')}
                disabled={isSaving}
                className="w-full py-3 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark seen</span>
              </button>
            )}

            {patient.status === 'seen' && (
              <div className="w-full py-3 px-3 rounded-xl bg-zinc-100 text-zinc-500 font-bold text-xs text-center border border-zinc-200">
                Patient marked as seen
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
