'use client';

import { useState } from 'react';
import { Globe, ArrowRight, User, Baby, Users, AlertCircle, Check, RefreshCw, X } from 'lucide-react';
import { LANGUAGES, kioskStrings } from '@/lib/kioskStrings';

const ABOUT_YOU_STEPS = ['step_age', 'step_sex', 'step_pronouns', 'step_name'];

export default function KioskStartScreen({ selectedLang, onSelectLang, onStartCheckin, onReCheckByTicket }) {
  const [whoStep, setWhoStep] = useState('select_who');
  const [whoType, setWhoType] = useState('self');
  const [ageValue, setAgeValue] = useState(45);
  const [ageUnit, setAgeUnit] = useState('years');
  const [sexValue, setSexValue] = useState(null);
  const [pronounsValue, setPronounsValue] = useState(null);
  const [patientNameInput, setPatientNameInput] = useState('');
  const [needsInterpreter, setNeedsInterpreter] = useState(false);
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [ticketInput, setTicketInput] = useState('');

  const langCode = selectedLang?.code || 'en';
  const t = kioskStrings(langCode);
  const isRtl = langCode === 'ar';

  const handleSelectWho = (type) => {
    setWhoType(type);
    if (type === 'child') {
      setAgeValue(5);
      setWhoStep('child_age');
    } else {
      setAgeValue(45);
      setWhoStep('step_age');
    }
  };

  const handleFinalSubmit = () => {
    const months = ageUnit === 'years' ? Number(ageValue) * 12 : Number(ageValue);
    const vitalsSkipped = months < 144;

    const formattedAge = whoType === 'child'
      ? (months < 24 ? `${months}m` : `${Math.floor(months / 12)}`)
      : `${ageValue}`;

    onStartCheckin({
      who: whoType === 'child' ? 'child' : (whoType === 'someone_else' ? 'assisted' : 'self'),
      name: patientNameInput.trim() || null,
      ageMonths: months,
      age: formattedAge,
      sex: sexValue,
      pronouns: pronounsValue,
      needsInterpreter,
      callVisually: needsInterpreter,
      vitalsSkipped,
    });
  };

  const stepNum = ABOUT_YOU_STEPS.indexOf(whoStep) + 1;

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-10rem)] p-4 text-center max-w-3xl mx-auto w-full bg-white text-black transition-all space-y-5 font-sans">
      <div className="space-y-2 pt-2">
        <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight leading-none uppercase">
          {t.title}
        </h1>

        <p className="text-zinc-700 text-lg md:text-xl font-bold max-w-xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      <div className="w-full max-w-xl bg-amber-50/70 text-amber-950 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs md:text-sm font-semibold border border-amber-200/50">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <span>{t.emergencyNotice}</span>
      </div>

      <div className="w-full max-w-xl space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center justify-center gap-1.5">
          <Globe className="w-4 h-4 text-black" />
          <span>{t.selectLang}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onSelectLang(lang)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-black text-white border-black font-extrabold scale-105'
                    : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <span className="font-extrabold text-xs leading-tight">{lang.native}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-xl bg-zinc-50/90 border-2 border-zinc-300 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
        {stepNum > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-zinc-600 uppercase tracking-wider">
              <span>{t.aboutYouTitle}</span>
              <span>{t.stepOf.replace('{n}', stepNum).replace('{total}', ABOUT_YOU_STEPS.length)}</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300 ease-out"
                style={{ width: `${(stepNum / ABOUT_YOU_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {whoStep === 'select_who' && (
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-black text-black text-center">
              {t.whoTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleSelectWho('self')}
                className="p-6 rounded-2xl bg-white hover:bg-zinc-900 hover:text-white border-2 border-zinc-200 hover:border-zinc-900 text-black font-extrabold text-lg flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <User className="w-9 h-9 text-zinc-800 group-hover:text-white transition-colors" />
                <span className="leading-tight">{t.me}</span>
                <span className="text-xs opacity-75 font-normal">{t.meDesc}</span>
              </button>

              <button
                onClick={() => handleSelectWho('child')}
                className="p-6 rounded-2xl bg-white hover:bg-zinc-900 hover:text-white border-2 border-zinc-200 hover:border-zinc-900 text-black font-extrabold text-lg flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <Baby className="w-9 h-9 text-zinc-800 group-hover:text-white transition-colors" />
                <span className="leading-tight">{t.child}</span>
                <span className="text-xs opacity-75 font-normal">{t.childDesc}</span>
              </button>

              <button
                onClick={() => handleSelectWho('someone_else')}
                className="p-6 rounded-2xl bg-white hover:bg-zinc-900 hover:text-white border-2 border-zinc-200 hover:border-zinc-900 text-black font-extrabold text-lg flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <Users className="w-9 h-9 text-zinc-800 group-hover:text-white transition-colors" />
                <span className="leading-tight">{t.someoneElse}</span>
                <span className="text-xs opacity-75 font-normal">{t.someoneElseDesc}</span>
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setNeedsInterpreter(!needsInterpreter)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    needsInterpreter
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  {needsInterpreter ? t.interpreterOn : t.interpreterOff}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowRecheckModal(true)}
                className="w-full p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-black" />
                <span>{t.alreadyCheckedIn}</span>
              </button>
            </div>
          </div>
        )}

        {whoStep === 'child_age' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-black text-black">{t.howOld}</h2>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.max(0, Number(prev) - 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                –
              </button>
              <input
                type="number"
                min="0"
                max="144"
                value={ageValue}
                onChange={(e) => setAgeValue(e.target.value)}
                className="w-28 p-4 bg-white text-black font-sans text-3xl font-black rounded-2xl border-2 border-zinc-300 text-center focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.min(144, Number(prev) + 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                +
              </button>

              <select
                value={ageUnit}
                onChange={(e) => setAgeUnit(e.target.value)}
                className="p-4 bg-white text-black text-lg font-bold rounded-2xl border-2 border-zinc-300 focus:outline-none"
              >
                <option value="years">{t.years}</option>
                <option value="months">{t.months}</option>
              </select>
            </div>

            <p className="text-xs text-zinc-800 bg-zinc-200/70 p-3.5 rounded-2xl border border-zinc-300 font-bold">
              {t.paediatricNote}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setWhoStep('select_who')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={() => setWhoStep('step_sex')}
                className="flex-1 py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_age' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-black">{t.ageLabel}</h2>

            <div className="flex items-center justify-center gap-3 my-4">
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.max(0, Number(prev) - 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                –
              </button>
              <input
                type="number"
                min="0"
                max="120"
                value={ageValue}
                onChange={(e) => setAgeValue(e.target.value)}
                className="w-32 p-4 bg-white text-black font-sans text-3xl font-black rounded-2xl border-2 border-zinc-300 text-center focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.min(120, Number(prev) + 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                +
              </button>
              <span className="text-lg font-bold text-zinc-700">{t.years}</span>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setWhoStep('select_who')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={() => setWhoStep('step_sex')}
                className="flex-1 py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_sex' && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl md:text-2xl font-black text-black leading-tight">
              {t.sexLabel}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: 'F', label: t.female },
                { code: 'M', label: t.male },
                { code: 'I', label: t.intersex },
                { code: 'NS', label: t.preferNot },
              ].map((s) => {
                const isSelected = sexValue === s.code;
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => {
                      setSexValue(s.code);
                      setWhoStep('step_pronouns');
                    }}
                    className={`p-5 rounded-2xl font-extrabold text-base border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-900 border-zinc-200 hover:border-black'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-zinc-500 font-medium italic pt-1 text-start">
              {t.whyWeAsk}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setWhoStep(whoType === 'child' ? 'child_age' : 'step_age')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={() => setWhoStep('step_pronouns')}
                disabled={!sexValue}
                className="flex-1 py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_pronouns' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-black text-black">{t.pronounsTitle}</h2>

            <div className="grid grid-cols-2 gap-3">
              {['he/him', 'she/her', 'they/them', 'other'].map((p) => {
                const isSelected = pronounsValue === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPronounsValue(p);
                      setWhoStep('step_name');
                    }}
                    className={`p-4 rounded-2xl font-extrabold text-base border-2 transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:border-black'
                    }`}
                  >
                    {t.pronouns[p]}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setWhoStep('step_sex')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>

              <button
                onClick={() => {
                  setPronounsValue(null);
                  setWhoStep('step_name');
                }}
                className="py-2 px-4 text-xs font-bold text-zinc-600 hover:text-black underline"
              >
                {t.skipPronouns}
              </button>

              <button
                onClick={() => setWhoStep('step_name')}
                className="py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_name' && (
          <div className="space-y-5 text-center">
            <div>
              <h2 className="text-2xl font-black text-black">{t.nameTitle}</h2>
              <p className="text-xs font-bold text-zinc-600">{t.nameSubtitle}</p>
            </div>

            <input
              type="text"
              value={patientNameInput}
              onChange={(e) => setPatientNameInput(e.target.value)}
              placeholder={t.nameSubtitle}
              className="w-full p-4 bg-white text-black font-sans text-lg font-bold rounded-2xl border-2 border-zinc-300 focus:outline-none focus:border-black text-center"
            />

            <div className="space-y-3 pt-1">
              <button
                onClick={() => {
                  if (patientNameInput.trim()) {
                    handleFinalSubmit();
                  }
                }}
                disabled={!patientNameInput.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={() => setWhoStep('step_pronouns')}
                  className="text-xs font-bold text-zinc-600 hover:text-black underline"
                >
                  {t.back}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRecheckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-zinc-200 text-start relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowRecheckModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <RefreshCw className="w-4 h-4 text-black" />
                <span>{t.recheckKicker}</span>
              </div>
              <h3 className="text-2xl font-black text-black">{t.recheckTitle}</h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                {t.recheckBody}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="A-17"
                className="w-full p-4 bg-zinc-50 text-black font-sans text-3xl font-black rounded-2xl border-2 border-zinc-300 text-center uppercase tracking-widest focus:outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={() => {
                  if (ticketInput.trim() && onReCheckByTicket) {
                    setShowRecheckModal(false);
                    onReCheckByTicket(ticketInput.trim());
                  }
                }}
                disabled={!ticketInput.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t.rescan}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
