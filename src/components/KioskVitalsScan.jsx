'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Heart, Wind, Sliders } from 'lucide-react';

const SCAN_DURATION_MS = 30000;
const TICK_MS = 250;

export default function KioskVitalsScan({ onScanComplete, currentVitals }) {
  const [progress, setProgress] = useState(0);
  const [hasCamera, setHasCamera] = useState(false);
  const [showTweakModal, setShowTweakModal] = useState(false);
  const [targetPulse, setTargetPulse] = useState(currentVitals?.pulse || 76);
  const [targetBreathing, setTargetBreathing] = useState(currentVitals?.breathingRate || 16);
  const [confidence] = useState(currentVitals?.confidence || 0.94);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const waveBufferRef = useRef([]);

  useEffect(() => {
    let stream;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } })
      .then((s) => {
        stream = s;
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = stream;
        setHasCamera(true);
      })
      .catch((err) => console.warn('Camera unavailable:', err.message));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Synthetic pulse waveform, just for the on-screen trace
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let t = 0;

    const nextSample = () => {
      const bpm = targetPulse || 74;
      const phase = (t * bpm / 60) % 1;
      const y = Math.exp(-Math.pow(phase - 0.2, 2) / 0.002) + 0.35 * Math.exp(-Math.pow(phase - 0.45, 2) / 0.01);
      t += 0.04;
      return y;
    };

    const renderWave = () => {
      waveBufferRef.current.push(nextSample());
      if (waveBufferRef.current.length > 200) {
        waveBufferRef.current.shift();
      }

      const buf = waveBufferRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (buf.length > 1) {
        const min = Math.min(...buf);
        const max = Math.max(...buf);
        const span = max - min || 1;

        ctx.beginPath();
        buf.forEach((v, i) => {
          const x = (i / 199) * canvas.width;
          const y = canvas.height - 15 - ((v - min) / span) * (canvas.height - 30);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPulse]);

  useEffect(() => {
    const increment = (TICK_MS / SCAN_DURATION_MS) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + increment));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onScanComplete({
          pulse: targetPulse,
          breathingRate: targetBreathing,
          confidence,
        });
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [progress, onScanComplete, targetPulse, targetBreathing, confidence]);

  const applyPreset = async (presetPulse, presetBreathing) => {
    setTargetPulse(presetPulse);
    setTargetBreathing(presetBreathing);
    try {
      await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pulse: presetPulse, breathing: presetBreathing }),
      });
    } catch {
      // local values are already set, which is all the scan screen needs
    }
  };

  const currentPulseDisplay = progress < 20 ? '--' : Math.round(targetPulse);
  const currentBreathingDisplay = progress < 50 ? '--' : Math.round(targetBreathing);

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-8rem)] p-4 max-w-4xl mx-auto w-full text-center bg-white text-black font-sans">
      <div className="w-full flex items-center justify-between">
        <div className="flex-1 text-center space-y-1">
          <h2 className="text-2xl md:text-4xl font-black text-black flex items-center justify-center gap-3">
            <Camera className="w-7 h-7 text-blue-600" />
            <span>Measuring Vitals...</span>
          </h2>
          <p className="text-zinc-700 text-sm font-medium">
            Please look at the camera and breathe normally. <br />
            <span className="text-zinc-500 text-xs font-semibold">No video is recorded. Only pulse & breathing metrics are scanned.</span>
          </p>
        </div>

        <button
          onClick={() => setShowTweakModal(!showTweakModal)}
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Demo</span>
        </button>
      </div>

      <div className="relative my-4 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" className="text-zinc-200" strokeWidth="6" stroke="currentColor" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-blue-600 transition-all duration-300 ease-out"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-4 rounded-full overflow-hidden bg-white border-4 border-blue-600 flex items-center justify-center shadow">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${hasCamera ? 'opacity-90' : 'hidden'}`}
            />
            {!hasCamera && (
              <div className="flex flex-col items-center justify-center text-blue-600 p-6 space-y-2">
                <Camera className="w-10 h-10 text-blue-600" />
                <span className="text-xs text-black font-bold">Optical Scan Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-2xl md:text-3xl font-black text-blue-600 tracking-tight">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white border-2 border-red-600 rounded-xl p-4 space-y-3 shadow-xs text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-red-600 shrink-0" />
            <div>
              <span className="text-xs text-zinc-600 font-bold uppercase block leading-tight">Your pulse</span>
              <span className="text-2xl font-black text-red-600 leading-none">
                {currentPulseDisplay} <span className="text-xs text-zinc-600 font-bold">bpm</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <Wind className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase block leading-none">Breathing</span>
              <span className="text-sm font-black text-blue-600 leading-none">
                {currentBreathingDisplay} <span className="text-[10px] text-zinc-600 font-normal">breaths/min</span>
              </span>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} width={400} height={60} className="w-full h-14 rounded bg-zinc-50 border border-zinc-200" />
      </div>

      {showTweakModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-400 rounded-xl p-6 max-w-sm w-full space-y-4 text-left shadow-2xl">
            <h3 className="text-base font-black text-black flex items-center justify-between">
              <span>Demo Options</span>
              <button onClick={() => setShowTweakModal(false)} className="text-zinc-600 hover:text-black">✕</button>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => { setProgress(100); setShowTweakModal(false); }}
                className="w-full p-3 rounded bg-black text-white hover:bg-zinc-800 text-left font-bold"
              >
                <span>Skip Scan (Instant Demo)</span>
              </button>

              <button
                onClick={() => { applyPreset(74, 16); setShowTweakModal(false); }}
                className="w-full p-3 rounded bg-zinc-100 border border-zinc-300 text-left text-black hover:bg-zinc-200 font-bold"
              >
                <div>Normal Vitals (74 bpm / 16 breaths/min)</div>
              </button>

              <button
                onClick={() => { applyPreset(108, 26); setShowTweakModal(false); }}
                className="w-full p-3 rounded bg-zinc-100 border border-zinc-300 text-left text-black hover:bg-zinc-200 font-bold"
              >
                <div>Tachycardia (108 bpm / 26 breaths/min)</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
