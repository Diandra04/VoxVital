'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle2, ArrowRight, Ticket, ShieldAlert } from 'lucide-react';

export default function KioskDoneScreen({ patientData, onReset }) {
  const [countdown, setCountdown] = useState(20);

  // Clear the screen after 20s so the next person can't see this patient's details
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReset]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-8rem)] p-4 max-w-xl mx-auto w-full text-center bg-white text-black font-sans space-y-6">
      <div className="space-y-2 pt-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
          You&apos;re Checked In
        </h2>

        <p className="text-zinc-700 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-semibold">
          You&apos;re in the queue. The sickest patients are seen first, so your wait may change.
        </p>
      </div>

      <div className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs text-left">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-500 font-extrabold text-xs uppercase tracking-wider">
            <Ticket className="w-4 h-4 text-black" />
            <span>Your Ticket Number</span>
          </div>
          <div className="text-5xl font-black text-black tracking-tight">{patientData?.ticketNumber}</div>
          <p className="text-xs text-zinc-600 font-medium leading-relaxed">
            Waiting room screen shows called ticket numbers.
          </p>
        </div>

        {patientData?.qrCodeDataUrl && (
          <div className="flex flex-col items-center gap-2 border-t sm:border-t-0 sm:border-l border-zinc-200 pt-4 sm:pt-0 sm:pl-6 shrink-0 text-center">
            <div className="p-2.5 bg-white rounded-2xl border-2 border-zinc-200 shadow-2xs">
              <Image src={patientData.qrCodeDataUrl} alt="QR code" width={144} height={144} unoptimized />
            </div>
            <span className="text-xs font-black text-black max-w-[160px] leading-tight">
              Scan to follow your place on your phone
            </span>
          </div>
        )}
      </div>

      {patientData?.chiefComplaint && (
        <div className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-left space-y-2 shadow-2xs">
          <div className="border-b border-zinc-200 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">CONFIRMATION RECORD</span>
            <span className="text-xs font-bold text-black">{patientData.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-0.5">
            <div>
              <span className="text-zinc-500 block font-bold">Symptoms:</span>
              <span className="text-black font-semibold truncate block">
                {patientData.chiefComplaint}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block font-bold">Vitals:</span>
              <span className="text-black font-semibold">
                {patientData.vitalsSkipped ? 'Nurse vitals required' : `Pulse ${patientData.pulse} bpm • Resp ${patientData.breathingRate} breaths/min`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full space-y-4 pt-1">
        <p className="text-xs font-extrabold text-amber-950 bg-amber-50 border border-amber-200/70 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>If you feel much worse, tell staff right away.</span>
        </p>

        <button
          onClick={onReset}
          className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-md"
        >
          <span>Done</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-[11px] text-zinc-500 font-medium">
          Screen clears automatically in <strong className="text-black">{countdown}s</strong> for your privacy
        </p>
      </div>
    </div>
  );
}
