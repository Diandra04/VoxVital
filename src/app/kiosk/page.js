'use client';

import { useState, useEffect, useCallback } from 'react';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import KioskStartScreen, { LANGUAGES, TRANSLATIONS } from '@/components/KioskStartScreen';
import KioskVitalsScan from '@/components/KioskVitalsScan';
import KioskVoiceIntake from '@/components/KioskVoiceIntake';
import KioskDoneScreen from '@/components/KioskDoneScreen';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function KioskPage() {
  const [step, setStep] = useState('start');
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [checkinMeta, setCheckinMeta] = useState({ who: 'self', ageMonths: null, vitalsSkipped: false });
  const [liveVitals, setLiveVitals] = useState({ pulse: 76, breathingRate: 16, confidence: 0.94 });
  const [scannedVitals, setScannedVitals] = useState(null);
  const [patientResult, setPatientResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [helpBannerText, setHelpBannerText] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/triage/stream');
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
    setHelpBannerText('Staff member notified — someone is coming to assist you.');
    try {
      await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'Walk-up Kiosk 1' }),
      });
    } catch {
      // banner is already showing; staff can still be flagged down in person
    }
  };

  // Stable callbacks: live vitals re-render this page every second, which would
  // otherwise restart the timers in the scan and done screens
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
        alert('Intake error: ' + (data.error || 'Please proceed to triage desk'));
      }
    } catch {
      setIsAnalyzing(false);
      alert('Network error. Please see the triage desk.');
    }
  };

  // Unknown tickets still get a fresh scan; they just become a new check-in
  const handleReCheckByTicket = async (ticketInput) => {
    try {
      const res = await fetch('/api/triage');
      const data = await res.json();

      const input = ticketInput.trim().toUpperCase();
      const found = data.patients?.find(
        (p) => p.ticketNumber?.toUpperCase() === input ||
               p.ticketNumber?.toUpperCase() === `A-${input}` ||
               p.id?.toUpperCase() === input
      );

      if (found) {
        setPatientResult(found);
        setCheckinMeta({
          who: found.who || 'self',
          ageMonths: found.ageMonths,
          sex: found.sex,
          pronouns: found.pronouns,
          vitalsSkipped: false,
        });
      }
    } catch {
      // fall through to a fresh scan
    }
    setStep('scan');
  };

  const handleReset = useCallback(() => {
    setStep('start');
    setCheckinMeta({ who: 'self', ageMonths: null, vitalsSkipped: false });
    setPatientResult(null);
    setScannedVitals(null);
    setHelpBannerText(null);
  }, []);

  const isRtl = selectedLang.code === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-black flex flex-col justify-between font-sans transition-all">
      {helpBannerText && (
        <div className="bg-black text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
          <span>{helpBannerText}</span>
          <button onClick={() => setHelpBannerText(null)} className="underline text-white ml-2">Dismiss</button>
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

          <span className="font-extrabold text-xl tracking-tight text-black">
            Vox<span className="text-blue-600">Vital</span>
          </span>
        </div>

        <button
          onClick={handleRequestHelp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black text-xs font-bold transition-colors shadow-2xs"
        >
          <HelpCircle className="w-4 h-4 text-black" />
          <span>{TRANSLATIONS[selectedLang.code]?.askStaff || 'Ask staff'}</span>
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
            currentVitals={liveVitals}
            onScanComplete={handleScanComplete}
          />
        )}

        {step === 'talk' && (
          <KioskVoiceIntake
            selectedLang={selectedLang}
            scannedVitals={scannedVitals || liveVitals}
            onSubmitIntake={handleSubmitIntake}
            isAnalyzing={isAnalyzing}
            preferTyping={checkinMeta.preferTyping}
            checkinMeta={checkinMeta}
          />
        )}

        {step === 'done' && (
          <KioskDoneScreen patientData={patientResult} onReset={handleReset} />
        )}
      </main>

      <DisclaimerBanner />
    </div>
  );
}
