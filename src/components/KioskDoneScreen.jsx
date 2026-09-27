'use client';

import Image from 'next/image';
import { CheckCircle2, ArrowRight, Ticket, ShieldAlert } from 'lucide-react';

export default function KioskDoneScreen({ t, patientData, onReset }) {
  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-8rem)] p-4 max-w-xl mx-auto w-full text-center bg-white text-black font-sans space-y-6">
      <div className="space-y-2 pt-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
          {t.checkedIn}
        </h2>

        <p className="text-zinc-700 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-semibold">
          {t.inQueue}
        </p>
      </div>

      <div className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-start">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-500 font-extrabold text-xs uppercase tracking-wider">
            <Ticket className="w-4 h-4 text-black" />
            <span>{t.yourTicket}</span>
          </div>
          <div className="text-5xl font-black text-black tracking-tight">{patientData?.ticketNumber}</div>
          <p className="text-xs text-zinc-600 font-medium leading-relaxed">
            {t.boardNote}
          </p>
        </div>

        {patientData?.qrCodeDataUrl && (
          <div className="flex flex-col items-center gap-2 border-t sm:border-t-0 sm:border-s border-zinc-200 pt-4 sm:pt-0 sm:ps-6 shrink-0 text-center">
            <div className="p-2.5 bg-white rounded-2xl border-2 border-zinc-200">
              <Image src={patientData.qrCodeDataUrl} alt="QR code" width={144} height={144} unoptimized />
            </div>
            <span className="text-xs font-black text-black max-w-[160px] leading-tight">
              {t.scanQr}
            </span>
          </div>
        )}
      </div>

      {patientData?.originalTranscript && (
        <div className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-start space-y-2">
          <div className="border-b border-zinc-200 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">{t.summary}</span>
            <span className="text-xs font-bold text-black">{patientData.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-0.5">
            <div>
              <span className="text-zinc-500 block font-bold">{t.symptomsLabel}</span>
              <span className="text-black font-semibold truncate block">
                {patientData.originalTranscript}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block font-bold">{t.vitalsLabel}</span>
              <span className="text-black font-semibold">
                {patientData.vitalsSkipped
                  ? t.nurseVitals
                  : `${t.pulse} ${patientData.pulse} bpm • ${t.breathing} ${patientData.breathingRate} ${t.breathsPerMin}`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full space-y-4 pt-1">
        <p className="text-xs font-extrabold text-amber-950 bg-amber-50 border border-amber-200/70 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t.feelWorse}</span>
        </p>

        <button
          onClick={onReset}
          className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          <span>{t.done}</span>
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </button>

        <p className="text-[11px] text-zinc-500 font-medium">
          {t.tapDone}
        </p>
      </div>
    </div>
  );
}
