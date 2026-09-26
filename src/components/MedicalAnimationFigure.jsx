'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Heart, Wind, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MedicalAnimationFigure() {
  const [pulseVal, setPulseVal] = useState(108);
  const [breathVal, setBreathVal] = useState(25);
  const [scanStep, setScanStep] = useState('scanning');

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseVal((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.max(104, Math.min(112, Math.round(prev + delta)));
      });
      setBreathVal((prev) => {
        const delta = (Math.random() - 0.5) * 0.8;
        return Math.max(23, Math.min(27, Math.round(prev + delta)));
      });
    }, 1200);

    let resetTimer;
    const scanCycle = setInterval(() => {
      setScanStep('done');
      resetTimer = setTimeout(() => setScanStep('scanning'), 4000);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(scanCycle);
      clearTimeout(resetTimer);
    };
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center font-sans">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-blue-200 border-dashed opacity-60"
      />
      <motion.div
        animate={{ scale: [1, 1.04, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-6 rounded-full border border-blue-300 bg-blue-50/30"
      />

      <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl bg-white border border-zinc-200 p-6 overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-blue-600 rounded-tl-xs" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-blue-600 rounded-tr-xs" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-blue-600 rounded-bl-xs" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-blue-600 rounded-br-xs" />

        <div className="flex items-center justify-between text-xs border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2 font-mono text-zinc-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Camera scan</span>
          </div>

          <span className="text-[11px] font-bold text-zinc-400 font-mono">
            30s live rPPG
          </span>
        </div>

        <div className="relative my-auto flex items-center justify-center h-32">
          <motion.div
            animate={{ y: [-48, 48, -48] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-44 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(37,99,235,0.8)] z-10"
          />

          <svg className="w-36 h-36 text-blue-400" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="36" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <path d="M 18 84 C 18 64, 32 56, 50 56 C 68 56, 82 64, 82 84" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="50" cy="36" r="3" fill="#2563eb" opacity="0.4" />
          </svg>

          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-2 top-2 bg-white border border-red-200 shadow-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-red-600"
          >
            <Heart className="w-4 h-4 text-red-600 fill-red-600 shrink-0 animate-pulse" />
            <span className="font-black text-red-600">{pulseVal} bpm</span>
          </motion.div>

          <motion.div
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-2 bottom-2 bg-white border border-zinc-200 shadow-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-zinc-900"
          >
            <Wind className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{breathVal} breaths/min</span>
          </motion.div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={scanStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="w-full flex items-center justify-between"
            >
              {scanStep === 'done' ? (
                <div className="w-full py-1.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Suggested level 2 · sent to nurse</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </div>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2 w-full">
                    <Activity className="w-4 h-4 text-red-600 shrink-0" />
                    <svg className="w-full h-5 text-red-600" viewBox="0 0 160 20" fill="none">
                      <motion.path
                        d="M 0 10 L 30 10 L 35 3 L 40 17 L 45 1 L 50 15 L 55 10 L 105 10 L 110 3 L 115 17 L 120 1 L 125 15 L 130 10 L 160 10"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ strokeDasharray: '160', strokeDashoffset: '160' }}
                        animate={{ strokeDashoffset: [160, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                      />
                    </svg>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
