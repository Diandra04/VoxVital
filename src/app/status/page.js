'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw, Bell, BellRing, MessageSquare, X } from 'lucide-react';
import { phoneStrings } from '@/lib/phoneStrings';
import { speak, speakInBrowser } from '@/lib/speech';
import Logo from '@/components/Logo';

const STORAGE_KEY = 'voxvital-patient-id';

function readSavedId() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function NotFound({ message }) {
  return (
    <div className="p-6 text-center space-y-4 max-w-md mx-auto my-12 bg-zinc-50 border border-zinc-300 rounded-2xl">
      <AlertTriangle className="w-12 h-12 text-black mx-auto" />
      <h2 className="text-xl font-black text-black">Check-in Not Found</h2>
      <p className="text-sm text-zinc-700">{message || 'Please speak to the triage desk nurse.'}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-black">
      <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-mono font-bold">Loading your queue status...</span>
    </div>
  );
}

function UpdateForm({ id, ui }) {
  const [text, setText] = useState('');
  const [pain, setPain] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/recheck/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, painScore: pain }),
      });
      if ((await res.json()).success) {
        setSent(true);
        setText('');
      }
    } catch {
      // keep text for retry
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-left">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {ui.sent}
        </span>
        <button onClick={() => setSent(false)} className="text-xs underline shrink-0">
          {ui.updateTitle}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-2xl bg-zinc-50 border-2 border-black space-y-3 text-left">
      <h3 className="text-base font-black text-black">{ui.updateTitle}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ui.updatePlaceholder}
        className="w-full min-h-[80px] bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black text-sm font-medium"
      />
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-zinc-700">
          <span>{ui.painNow}</span>
          <span className="text-black">{pain} / 10</span>
        </div>
        <div className="grid grid-cols-11 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPain(n)}
              className={`py-2 rounded-lg text-xs font-bold border ${
                pain === n ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="w-full py-3.5 rounded-xl bg-black text-white font-black text-base disabled:opacity-40"
      >
        {ui.send}
      </button>
    </div>
  );
}

function StatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  // /status with no id goes back to the saved check-in
  const savedId = id ? null : readSavedId();

  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rechecked, setRechecked] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [dismissedMessageAt, setDismissedMessageAt] = useState(null);
  const alertsOnRef = useRef(false);
  const lastSeen = useRef(null);

  useEffect(() => {
    if (id) {
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore
      }
    } else if (savedId) {
      router.replace(`/status?id=${savedId}`);
    }
  }, [id, savedId, router]);

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
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      } catch {
        setError('Network connection error');
      }
      setLoading(false);
    };

    // phones pause background tabs
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchStatus();
    };

    fetchStatus();
    const eventSource = new EventSource('/api/triage/stream?view=public');
    eventSource.addEventListener('triage_update', fetchStatus);
    const interval = setInterval(fetchStatus, 4000);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      eventSource.close();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [id]);

  const ui = phoneStrings(statusData?.languageCode);
  const languageCode = statusData?.languageCode || 'en';
  const status = statusData?.status;
  const isCalled = status === 'called' || status === 'seen';
  const isNurseRecheck = !!statusData?.recheckRequestedByNurse;
  const message = statusData?.phoneMessage;
  const messageText = message && ui.messages[message.key];

  // alert on call / message / re-check, but not on first load
  useEffect(() => {
    if (!status) return;
    const prev = lastSeen.current;
    lastSeen.current = { status, messageAt: message?.at, isNurseRecheck };
    if (!prev) return;

    let text = null;
    if (message?.at && message.at !== prev.messageAt) text = messageText;
    else if (isCalled && prev.status !== 'called' && prev.status !== 'seen') text = ui.calledBody;
    else if (isNurseRecheck && !prev.isNurseRecheck) text = ui.recheckBody;
    if (!text) return;

    navigator.vibrate?.([300, 100, 300, 100, 300]);
    if (alertsOnRef.current) speak(text, languageCode);
  }, [status, message?.at, messageText, isCalled, isNurseRecheck, ui, languageCode]);

  useEffect(() => {
    if (!statusData) return;
    document.title = isCalled ? `${ui.calledTitle} · VoxVital` : `${statusData.ahead} ${ui.ahead} · VoxVital`;
  }, [statusData, isCalled, ui]);

  // audio needs a user gesture first
  const enableAlerts = () => {
    alertsOnRef.current = true;
    setAlertsOn(true);
    speakInBrowser(ui.alertsOn, languageCode);
    navigator.vibrate?.(200);
  };

  const handleFeelingWorse = async () => {
    try {
      const res = await fetch(`/api/recheck/${id}`, { method: 'POST' });
      if ((await res.json()).success) setRechecked(true);
    } catch {
      // ignore
    }
  };

  if (!id) {
    return savedId ? <Loading /> : <NotFound message="Scan the QR code on your check-in screen to follow your place in line." />;
  }
  if (loading) return <Loading />;
  if (!statusData) return <NotFound message={error} />;

  const showMessage = messageText && message.at !== dismissedMessageAt;
  const showUpdateForm = !isCalled && (rechecked || isNurseRecheck);

  return (
    <div
      dir={languageCode === 'ar' ? 'rtl' : 'ltr'}
      className="flex flex-col items-center min-h-[85vh] p-4 text-center max-w-md mx-auto w-full bg-white text-black font-sans space-y-5"
    >
      <div className="space-y-3 pt-2 w-full">
        <div className="flex items-center justify-center">
          <Logo size="sm" />
        </div>
        <h1 className="text-2xl font-black text-black">{ui.title}</h1>
      </div>

      {showMessage && (
        <div className="w-full p-4 rounded-2xl bg-blue-600 text-white text-left flex items-start gap-3">
          <MessageSquare className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">{ui.messageFrom}</span>
            <p className="text-lg font-black leading-snug">{messageText}</p>
          </div>
          <button onClick={() => setDismissedMessageAt(message.at)} aria-label="Dismiss" className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="w-full">
        {isCalled ? (
          <div className="bg-red-600 border-4 border-red-700 text-white rounded-2xl p-8 space-y-4 animate-pulse text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">{ui.calledTitle}</h2>
            <div className="p-4 bg-white rounded-xl">
              <p className="text-2xl font-black text-red-600 tracking-tight">{ui.calledBody}</p>
            </div>
          </div>
        ) : isNurseRecheck ? (
          <div className="bg-amber-500 border-4 border-amber-600 text-white rounded-2xl p-6 space-y-3 text-center">
            <RefreshCw className="w-10 h-10 mx-auto" />
            <h2 className="text-2xl font-black tracking-tight uppercase">{ui.recheckTitle}</h2>
            <p className="text-base font-bold">{ui.recheckBody}</p>
          </div>
        ) : (
          <div className="bg-zinc-50 border-2 border-black rounded-2xl p-8 space-y-2">
            <span className="text-xs uppercase tracking-wider text-zinc-600 font-bold block">{ui.position}</span>
            <div className="text-6xl md:text-7xl font-black text-black tracking-tight my-2">{statusData.ahead}</div>
            <p className="text-lg font-black text-black">{ui.ahead}</p>
          </div>
        )}
      </div>

      {!isCalled && (
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50">
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">{ui.ticket}</span>
          <span className="text-2xl font-black text-black">{statusData.ticketNumber}</span>
        </div>
      )}

      {showUpdateForm && (
        <>
          <UpdateForm id={id} ui={ui} />
          <p className="text-xs text-zinc-700 font-semibold leading-relaxed text-left w-full">{ui.kioskSteps}</p>
        </>
      )}

      {!isCalled && !showUpdateForm && (
        <button
          onClick={handleFeelingWorse}
          className="w-full py-4 px-6 rounded-xl font-black text-base bg-black text-white hover:bg-zinc-800 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{ui.feelingWorse}</span>
        </button>
      )}

      <button
        onClick={enableAlerts}
        disabled={alertsOn}
        className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border ${
          alertsOn ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-black border-zinc-300'
        }`}
      >
        {alertsOn ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        <span>{alertsOn ? ui.alertsOn : ui.alertsOff}</span>
      </button>

      <p className="text-xs text-zinc-500 font-medium">{ui.live}</p>

      <p className="text-[11px] text-zinc-600 flex items-center justify-center gap-1 font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 text-black" />
        <span>Hospital ER Triage Support • Nurse confirmed</span>
      </p>
    </div>
  );
}

export default function MobileStatusPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col p-4 font-sans">
      <Suspense fallback={<Loading />}>
        <StatusContent />
      </Suspense>
    </div>
  );
}
