'use client';

import { useState, useEffect, useCallback } from 'react';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import Logo from '@/components/Logo';
import KioskStartScreen from '@/components/KioskStartScreen';
import KioskVitalsScan from '@/components/KioskVitalsScan';
import KioskVoiceIntake from '@/components/KioskVoiceIntake';
import KioskDoneScreen from '@/components/KioskDoneScreen';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { LANGUAGES, kioskStrings } from '@/lib/kioskStrings';

export default function KioskPage() {
  const [step, setStep] = useState('start');
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [checkinMeta, setCheckinMeta] = useState({ who: 'self', ageMonths: null, vitalsSkipped: false });
  const [liveVitals, setLiveVitals] = useState({ pulse: 76, breathingRate: 16, confidence: 0.94 });
  const [scannedVitals, setScannedVitals] = useState(null);
  const [patientResult, setPatientResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const t = kioskStrings(selectedLang.code);

  useEffect(() => {
    const eventSource = new EventSource('/api/triage/stream?view=public');
    eventSource.addEventListener('vitals', (e) => {
      const data = JSON.parse(e.data);
      setLiveVitals({
        pulse: data.pulse || 76,
        breathingRate: data.breathing || 16,
        confidence: data.pulseConf || 0.94,
      });
    });

    return () => eventSource.close();
  }, []);

  const handleStartCheckin = (meta) => {
    setCheckinMeta(meta);
    setStep(meta.vitalsSkipped ? 'talk' : 'scan');
  };

  const handleRequestHelp = async () => {
    setHelpRequested(true);
    try {
      await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'Walk-up Kiosk 1' }),
      });
    } catch {
      // ignore
    }
  };

  // stable refs, live vitals rerender this page every second
  const handleScanComplete = useCallback((vitalsData) => {
    setScannedVitals(vitalsData);
    setStep('talk');
  }, []);

  const handleSubmitIntake = async (intakeData) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: patientResult?.id,
          name: patientResult?.name || checkinMeta.name || null,
          who: checkinMeta.who,
          ageMonths: checkinMeta.ageMonths,
          sex: checkinMeta.sex,
          pronouns: checkinMeta.pronouns,
          needsInterpreter: checkinMeta.needsInterpreter,
          callVisually: checkinMeta.callVisually,
          vitalsSkipped: checkinMeta.vitalsSkipped,
          transcript: intakeData.transcript,
          followUp: intakeData.followUp,
          painScore: intakeData.painScore,
          pulse: checkinMeta.vitalsSkipped ? null : intakeData.pulse,
          breathingRate: checkinMeta.vitalsSkipped ? null : intakeData.breathingRate,
          language: selectedLang.name,
          languageCode: selectedLang.code,
          allergies: intakeData.allergies,
          medications: intakeData.medications,
          onset: intakeData.onset,
          isPregnant: intakeData.isPregnant,
        }),
      });

      const data = await res.json();
      setIsAnalyzing(false);

      if (data.success) {
        setPatientResult(data.patient);
        setStep('done');
      } else {
        alert(t.intakeError);
      }
    } catch {
      setIsAnalyzing(false);
      alert(t.networkError);
    }
  };

  // unknown ticket -> treat as new check-in
  const handleReCheckByTicket = async (ticketInput) => {
    try {
      const res = await fetch(`/api/status/${encodeURIComponent(ticketInput.trim())}`);
      const data = await res.json();
      if (data.success) {
        setPatientResult({ id: data.patientId });
        setCheckinMeta({ vitalsSkipped: false });
      }
    } catch {
      // ignore
    }
    setStep('scan');
  };

  const handleReset = useCallback(() => {
    setStep('start');
    setCheckinMeta({ who: 'self', ageMonths: null, vitalsSkipped: false });
    setPatientResult(null);
    setScannedVitals(null);
    setHelpRequested(false);
  }, []);

  const isRtl = selectedLang.code === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-black flex flex-col justify-between font-sans transition-all">
      {helpRequested && (
        <div className="bg-black text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
          <span>{t.staffNotified}</span>
          <button onClick={() => setHelpRequested(false)} className="underline text-white ml-2">{t.dismiss}</button>
        </div>
      )}

      <header className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between text-black">
        <div className="flex items-center gap-3">
          {step !== 'start' && (
            <button
              onClick={handleReset}
              className="p-2 rounded bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 transition-colors"
            >
              <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          )}

          <Logo size="sm" />
        </div>

        <button
          onClick={handleRequestHelp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black text-xs font-bold transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-black" />
          <span>{t.askStaff}</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-white text-black">
        {step === 'start' && (
          <KioskStartScreen
            selectedLang={selectedLang}
            onSelectLang={setSelectedLang}
            onStartCheckin={handleStartCheckin}
            onReCheckByTicket={handleReCheckByTicket}
          />
        )}

        {step === 'scan' && (
          <KioskVitalsScan
            t={t}
            currentVitals={liveVitals}
            onScanComplete={handleScanComplete}
          />
        )}

        {step === 'talk' && (
          <KioskVoiceIntake
            t={t}
            selectedLang={selectedLang}
            scannedVitals={scannedVitals || liveVitals}
            onSubmitIntake={handleSubmitIntake}
            isAnalyzing={isAnalyzing}
            checkinMeta={checkinMeta}
          />
        )}

        {step === 'done' && (
          <KioskDoneScreen t={t} patientData={patientResult} onReset={handleReset} />
        )}
      </main>

      <DisclaimerBanner />
    </div>
  );
}
