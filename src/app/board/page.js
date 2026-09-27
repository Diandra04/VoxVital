'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { speak } from '@/lib/speech';

const ROOM = 'Room 3';

const BREATH = {
  in: { label: 'In', next: 'out', ms: 4000, scale: 1.3 },
  out: { label: 'Out', next: 'in', ms: 6000, scale: 0.75 },
};

let audioCtx = null;

function getAudioContext() {
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function chime() {
  try {
    const ctx = getAudioContext();
    ctx.resume();
    [659.25, 523.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.35;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch {
    // ignore
  }
}

function BreathingGuide() {
  const [phase, setPhase] = useState('in');
  const step = BREATH[phase];

  useEffect(() => {
    const timer = setTimeout(() => setPhase(step.next), step.ms);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="flex items-center gap-5 rounded-3xl bg-zinc-50 border border-zinc-300 px-6 py-4 shrink-0">
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-100"
          animate={{ scale: step.scale }}
          transition={{ duration: step.ms / 1000, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-2.5 rounded-full bg-blue-600"
          animate={{ scale: step.scale }}
          transition={{ duration: step.ms / 1000, ease: 'easeInOut' }}
        />
        <span className="relative text-xs font-bold text-white">{step.label}</span>
      </div>
      <div>
        <p className="text-base font-bold text-black">Take a moment</p>
        <p className="text-sm font-semibold text-zinc-500">Feeling anxious? Breathe with the circle</p>
      </div>
    </div>
  );
}

export default function WaitingRoomBoard() {
  const [board, setBoard] = useState({ called: [], waiting: 0 });
  const [now, setNow] = useState(() => Date.now());
  const lastCalledAt = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await (await fetch('/api/board')).json();
        if (data.success) setBoard(data);
      } catch {
        // keep last board
      }
    };

    load();
    const eventSource = new EventSource('/api/triage/stream?view=public');
    eventSource.addEventListener('triage_update', load);
    const poll = setInterval(load, 10000);
    const clock = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      eventSource.close();
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  // browsers block audio until the first interaction
  useEffect(() => {
    const unlock = () => {
      getAudioContext().resume();
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(''));
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, unlock, { once: true }));
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  // announce new calls, but not on first load
  const latest = board.called[0];
  useEffect(() => {
    if (!latest) return;
    const isNew = lastCalledAt.current !== null && latest.calledAt > lastCalledAt.current;
    lastCalledAt.current = Math.max(lastCalledAt.current ?? 0, latest.calledAt);

    if (isNew) {
      chime();
      setTimeout(() => speak(`Ticket ${latest.ticket.replace('-', ' ')}, please come to ${ROOM}.`, 'en'), 900);
    }
  }, [latest]);

  const isFresh = latest && now - latest.calledAt < 20000;
  const clock = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-screen overflow-hidden bg-white text-black flex flex-col font-sans">
      <header className="px-8 py-4 flex items-center justify-between border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-4">
          <Logo size="lg" />
          <span className="text-zinc-500 font-bold text-xl">Emergency Waiting Room</span>
        </div>
        <span className="text-4xl font-black tabular-nums">{clock}</span>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <section
          className={`lg:col-span-2 min-h-0 rounded-3xl flex flex-col items-center justify-center text-center p-8 transition-colors ${
            isFresh ? 'bg-blue-600 text-white animate-pulse' : 'bg-zinc-50 border-2 border-black'
          }`}
        >
          {latest ? (
            <>
              <span className={`text-[clamp(1.25rem,3.5vh,2rem)] font-bold ${isFresh ? 'text-white/80' : 'text-zinc-500'}`}>
                Now calling
              </span>
              <span className="text-[clamp(4rem,20vh,11rem)] leading-none font-black tracking-tight my-[2vh]">
                {latest.ticket}
              </span>
              <span className="text-[clamp(1.75rem,6vh,3.5rem)] font-black">→ {ROOM}</span>
            </>
          ) : (
            <span className="text-[clamp(1.75rem,5vh,2.5rem)] font-bold text-zinc-500">Please wait to be called</span>
          )}
        </section>

        <div className="flex flex-col gap-6 min-h-0">
          <section className="flex-1 min-h-0 rounded-3xl bg-zinc-50 border border-zinc-300 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-zinc-500 mb-4">Recently called</h2>
            <ul className="space-y-2 flex-1 min-h-0 overflow-hidden">
              {board.called.slice(1).map((c) => (
                <li key={c.ticket} className="flex items-center justify-between text-3xl font-black text-black">
                  <span>{c.ticket}</span>
                  <span className="text-base font-bold text-zinc-500">
                    {new Date(c.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
              {board.called.length <= 1 && <li className="text-lg text-zinc-400 font-bold">No earlier calls</li>}
            </ul>
            <div className="pt-4 border-t border-zinc-200">
              <span className="text-5xl font-black text-blue-600">{board.waiting}</span>
              <span className="text-lg font-bold text-zinc-600 ml-3">patients waiting</span>
            </div>
          </section>

          <BreathingGuide />
        </div>
      </main>

      <footer className="px-8 py-3 flex items-center border-t border-zinc-200 text-base font-bold text-zinc-600 shrink-0">
        <span>The sickest patients are seen first, so tickets may be called out of order. Feeling worse? Tell staff right away.</span>
      </footer>
    </div>
  );
}
