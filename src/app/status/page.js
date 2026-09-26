'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HeartPulse, AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

function NotFound({ message }) {
  return (
    <div className="p-6 text-center space-y-4 max-w-md mx-auto my-12 bg-zinc-50 border border-zinc-300 rounded-2xl">
      <AlertTriangle className="w-12 h-12 text-black mx-auto" />
      <h2 className="text-xl font-black text-black">Check-in Not Found</h2>
      <p className="text-sm text-zinc-700">{message || 'Please speak to the triage desk nurse.'}</p>
    </div>
  );
}

function StatusContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechecked, setRechecked] = useState(false);
  const [error, setError] = useState(null);
  const playedRecheckAudio = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();
        if (data.success) {
          setStatusData(data);
          setError(null);
          if (data.recheckRequested) setRechecked(true);
        } else {
          setError(data.error || 'Patient not found');
        }
      } catch {
        setError('Network connection error');
      }
      setLoading(false);
    };

    fetchStatus();

    const eventSource = new EventSource('/api/triage/stream');
    eventSource.addEventListener('triage_update', fetchStatus);
    const interval = setInterval(fetchStatus, 4000);

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, [id]);

  const isNurseRecheck = !!statusData?.recheckRequestedByNurse;
  const languageCode = statusData?.languageCode || 'en';

  // Buzz and speak once when the nurse asks the patient to come back
  useEffect(() => {
    if (!isNurseRecheck || playedRecheckAudio.current) return;
    playedRecheckAudio.current = true;

    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }

    const text = languageCode === 'fr'
      ? 'Veuillez retourner au guichet pour une vérification rapide.'
      : 'Please go back to the kiosk for a quick re-check.';

    const speakInBrowser = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      window.speechSynthesis?.speak(utterance);
    };

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, langCode: languageCode }),
    })
      .then(async (res) => {
        if (!res.headers.get('Content-Type')?.includes('audio')) return speakInBrowser();
        await new Audio(URL.createObjectURL(await res.blob())).play();
      })
      .catch(speakInBrowser);
  }, [isNurseRecheck, languageCode]);

  const handleFeelingWorse = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/recheck/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) setRechecked(true);
    } catch {
      // stays enabled so they can tap again
    }
  };

  if (!id) {
    return <NotFound message="No patient ID provided in URL" />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-black">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono font-bold">Loading your queue status...</span>
      </div>
    );
  }

  // Keep showing the last good status through a brief network hiccup
  if (!statusData) {
    return <NotFound message={error} />;
  }

  const { ahead, status, ui } = statusData;
  const isCalled = status === 'called' || status === 'seen';

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] p-4 text-center max-w-md mx-auto w-full bg-white text-black font-sans">
      <div className="space-y-3 pt-2 w-full">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 bg-black rounded-lg text-white font-bold">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-black tracking-tight">
            Vox<span className="text-blue-600">Vital</span> Mobile
          </span>
        </div>

        <h1 className="text-2xl font-black text-black">{ui.title}</h1>
      </div>

      <div className="my-6 w-full">
        {isNurseRecheck ? (
          <div className="bg-amber-500 border-4 border-amber-600 text-white rounded-2xl p-8 space-y-4 animate-pulse shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-white text-amber-600 flex items-center justify-center mx-auto shadow-md">
              <RefreshCw className="w-10 h-10 text-amber-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              RE-CHECK REQUESTED
            </h2>
            <div className="p-4 bg-white text-black rounded-xl border border-amber-200">
              <p className="text-lg font-black text-amber-900 tracking-tight">
                Please go back to the kiosk for a quick re-check.
              </p>
            </div>
            <p className="text-xs text-white/90 font-bold">
              RN Didi requested updated vital signs.
            </p>
          </div>
        ) : !isCalled ? (
          <div className="bg-zinc-50 border-2 border-black rounded-2xl p-8 space-y-2 shadow-2xs">
            <span className="text-xs uppercase tracking-wider text-zinc-600 font-bold block">CURRENT POSITION</span>
            <div className="text-6xl md:text-7xl font-black text-black tracking-tight my-2">
              {ahead}
            </div>
            <p className="text-lg font-black text-black">{ui.ahead}</p>
            <p className="text-xs text-zinc-600 pt-2 border-t border-zinc-200 font-medium">
              Updates in real-time as patients are triaged.
            </p>
          </div>
        ) : (
          <div className="bg-red-600 border-4 border-red-700 text-white rounded-2xl p-8 space-y-4 animate-pulse shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-white text-red-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              YOU ARE BEING CALLED
            </h2>
            <div className="p-4 bg-white text-black rounded-xl border border-red-200">
              <p className="text-2xl font-black text-red-600 uppercase tracking-tight">
                Please come to room 3
              </p>
            </div>
            <p className="text-xs text-white/90 font-bold">
              A triage nurse is ready to assess you at Room 3.
            </p>
          </div>
        )}
      </div>

      {!isCalled && (
        <div className="w-full space-y-4">
          <button
            onClick={handleFeelingWorse}
            disabled={rechecked}
            className={`w-full py-4 px-6 rounded font-black text-base transition-all flex items-center justify-center gap-2 ${
              rechecked
                ? 'bg-zinc-200 text-black border border-zinc-400 cursor-default'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            <RefreshCw className="w-5 h-5 text-white" />
            <span>{rechecked ? ui.notified : ui.feelingWorse}</span>
          </button>

          <p className="text-[11px] text-zinc-600 flex items-center justify-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>Hospital ER Triage Support • Nurse confirmed</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function MobileStatusPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-4 font-sans">
      <Suspense fallback={<div className="text-center p-8 text-black font-bold">Loading mobile status...</div>}>
        <StatusContent />
      </Suspense>
    </div>
  );
}
