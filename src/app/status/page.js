'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, RefreshCw, MessageSquare, X } from 'lucide-react';
import { phoneStrings } from '@/lib/phoneStrings';
import Logo from '@/components/Logo';

const ID_KEY = 'voxvital-patient-id';
const LANG_KEY = 'voxvital-language';

function readSaved(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // private browsing, the tab still works
  }
}

function NotFound({ ui, message }) {
  return (
    <div className="p-6 text-center space-y-4 max-w-md mx-auto my-12 bg-zinc-50 border border-zinc-300 rounded-2xl">
      <AlertTriangle className="w-12 h-12 text-black mx-auto" />
      <h2 className="text-xl font-black text-black">{ui.notFoundTitle}</h2>
      <p className="text-sm text-zinc-700">{message}</p>
    </div>
  );
}

function Loading({ ui }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-black">
      <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-bold">{ui.loading}</span>
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
  const savedId = id ? null : readSaved(ID_KEY);
  // the QR link carries the language so even the loading screen is translated
  const langHint = searchParams.get('lang') || readSaved(LANG_KEY);

  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rechecked, setRechecked] = useState(false);
  const [dismissedMessageAt, setDismissedMessageAt] = useState(null);

  useEffect(() => {
    if (id) {
      save(ID_KEY, id);
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
          save(LANG_KEY, data.languageCode);
          if (data.recheckRequested) setRechecked(true);
        } else {
          setError('notFound');
          save(ID_KEY, null);
        }
      } catch {
        setError('network');
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

  const ui = phoneStrings(statusData?.languageCode || langHint);
  const languageCode = statusData?.languageCode || langHint || 'en';
  const status = statusData?.status;
  const isCalled = status === 'called' || status === 'seen';
  const isNurseRecheck = !!statusData?.recheckRequestedByNurse;
  const message = statusData?.phoneMessage;
  const messageText = message && ui.messages[message.key];

  useEffect(() => {
    if (!statusData) return;
    document.title = isCalled ? `${ui.calledTitle} · VoxVital` : `${statusData.ahead} ${ui.ahead} · VoxVital`;
  }, [statusData, isCalled, ui]);

  const handleFeelingWorse = async () => {
    try {
      const res = await fetch(`/api/recheck/${id}`, { method: 'POST' });
      if ((await res.json()).success) setRechecked(true);
    } catch {
      // ignore
    }
  };

  if (!id) {
    return savedId ? <Loading ui={ui} /> : <NotFound ui={ui} message={ui.scanQrHint} />;
  }
  if (loading) return <Loading ui={ui} />;
  if (!statusData) return <NotFound ui={ui} message={error === 'network' ? ui.networkError : ui.notFoundBody} />;

  const showMessage = messageText && message.at !== dismissedMessageAt;
  const showUpdateForm = !isCalled && (rechecked || isNurseRecheck);

  return (
    <div
      dir={languageCode === 'ar' ? 'rtl' : 'ltr'}
      className="flex flex-col min-h-[85vh] max-w-md mx-auto w-full bg-white text-black font-sans gap-5"
    >
      <header className="flex items-center justify-center pt-1">
        <Logo size="sm" />
      </header>

      {isCalled ? (
        <div className="bg-red-600 text-white rounded-3xl p-8 space-y-4 text-center">
          <CheckCircle2 className="w-14 h-14 mx-auto" />
          <h1 className="text-2xl font-black uppercase tracking-tight">{ui.calledTitle}</h1>
          <p className="text-3xl font-black">{ui.calledBody}</p>
          <p className="text-sm font-bold opacity-80">{ui.ticket} {statusData.ticketNumber}</p>
        </div>
      ) : isNurseRecheck ? (
        <div className="bg-amber-500 text-white rounded-3xl p-6 space-y-2 text-center">
          <RefreshCw className="w-9 h-9 mx-auto" />
          <h1 className="text-xl font-black uppercase tracking-tight">{ui.recheckTitle}</h1>
          <p className="text-base font-bold">{ui.recheckBody}</p>
          <p className="text-sm font-bold opacity-90">{ui.ticket} {statusData.ticketNumber}</p>
        </div>
      ) : (
        <div className="bg-zinc-50 border-2 border-black rounded-3xl p-8 text-center">
          <h1 className="text-lg font-bold text-zinc-600">{ui.title}</h1>
          <div className="text-7xl font-black tracking-tight mt-4">{statusData.ahead}</div>
          <p className="text-lg font-black">{ui.ahead}</p>
          <p className="mt-5 pt-4 border-t border-zinc-200 text-sm font-bold text-zinc-600">
            {ui.ticket} <span className="text-black text-lg font-black">{statusData.ticketNumber}</span>
          </p>
        </div>
      )}

      {showMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-start flex items-start gap-3">
          <MessageSquare className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
          <div className="flex-1">
            <span className="text-xs font-semibold text-blue-700 block">{ui.messageFrom}</span>
            <p className="text-base font-bold leading-snug">{messageText}</p>
          </div>
          <button onClick={() => setDismissedMessageAt(message.at)} aria-label={ui.dismiss} className="p-1 text-blue-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showUpdateForm && (
        <>
          <UpdateForm id={id} ui={ui} />
          <p className="text-xs text-zinc-600 font-semibold leading-relaxed text-start">{ui.kioskSteps}</p>
        </>
      )}

      {!isCalled && !showUpdateForm && (
        <button
          onClick={handleFeelingWorse}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-white text-black border-2 border-black hover:bg-zinc-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{ui.feelingWorse}</span>
        </button>
      )}

      <p className="text-xs text-zinc-500 font-medium text-center mt-auto">{ui.live}</p>
    </div>
  );
}

export default function MobileStatusPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col p-4 font-sans">
      <Suspense fallback={null}>
        <StatusContent />
      </Suspense>
    </div>
  );
}
