'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowRight, ArrowLeft, Keyboard } from 'lucide-react';

const SPEECH_LOCALES = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  ar: 'ar-SA',
  pa: 'pa-IN',
  zh: 'zh-CN',
  ru: 'ru-RU',
};

const detectOnsetFromTranscript = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower.includes('20 min') || lower.includes('20 minute') || lower.includes('30 min') || lower.includes('an hour') || lower.includes('1 hour') || lower.includes('just now') || lower.includes("à l'instant") || lower.includes('quelques minutes') || lower.includes('minute')) {
    return 'Just now';
  }
  if (lower.includes('ce matin') || lower.includes('this morning') || lower.includes('today') || lower.includes("aujourd'hui")) {
    return 'Today';
  }
  if (lower.includes('yesterday') || lower.includes('hier') || lower.includes('few days') || lower.includes('quelques jours') || lower.includes('2 days') || lower.includes('3 days')) {
    return 'A few days';
  }
  if (lower.includes('week') || lower.includes('semaine') || lower.includes('month') || lower.includes('mois')) {
    return 'A week or more';
  }
  return null;
};

export default function KioskVoiceIntake({ selectedLang, scannedVitals, onSubmitIntake, isAnalyzing, preferTyping = false, checkinMeta = {} }) {
  const [subStep, setSubStep] = useState('symptoms');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [painScore, setPainScore] = useState(5);
  const [showTextInput, setShowTextInput] = useState(preferTyping);

  // Nothing is pre-selected so a skipped question is recorded as skipped
  const [hasAllergy, setHasAllergy] = useState(null);
  const [allergyDetails, setAllergyDetails] = useState('');
  const [takeMeds, setTakeMeds] = useState(null);
  const [medicationsText, setMedicationsText] = useState('');
  const [onsetChoice, setOnsetChoice] = useState(null);
  const [detectedOnsetFromWords, setDetectedOnsetFromWords] = useState(null);
  const [pregnantChoice, setPregnantChoice] = useState(null);

  const recognitionRef = useRef(null);

  const ageMonths = checkinMeta?.ageMonths ?? 540;
  const sex = checkinMeta?.sex || 'M';
  const canAskPregnancy = (sex === 'F' || sex === 'I') && ageMonths >= 144 && ageMonths <= 660;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LOCALES[selectedLang.code] || 'en-US';

    recognition.onresult = (event) => {
      const text = Array.from(event.results, (r) => r[0].transcript).join('');
      setTranscript(text);
    };
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [selectedLang]);

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    try {
      if (isRecording) recognition?.stop();
      else recognition?.start();
    } catch {
      // start() throws if a session is already running
    }
    setIsRecording(!isRecording);
  };

  const handleNextToQuestions = () => {
    if (!transcript.trim()) return;
    const detected = detectOnsetFromTranscript(transcript);
    if (detected) {
      setDetectedOnsetFromWords(detected);
      if (!onsetChoice) {
        setOnsetChoice(detected);
      }
    }
    setSubStep('questions');
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;

    let computedAllergies = 'Skipped';
    if (hasAllergy === 'Yes') {
      computedAllergies = allergyDetails.trim() ? `Yes (${allergyDetails.trim()})` : 'Yes (unspecified)';
    } else if (hasAllergy === 'No') {
      computedAllergies = 'None reported';
    } else if (hasAllergy === 'Not sure') {
      computedAllergies = 'Not sure';
    }

    let computedMeds = 'Skipped';
    if (takeMeds === 'Yes') {
      computedMeds = medicationsText.trim() || 'Yes (unspecified)';
    } else if (takeMeds === 'No') {
      computedMeds = 'None reported';
    }

    const computedOnset = onsetChoice || detectedOnsetFromWords || 'Skipped';
    const computedPregnant = canAskPregnancy ? (pregnantChoice || 'Skipped') : null;

    onSubmitIntake({
      transcript: transcript.trim(),
      painScore,
      pulse: scannedVitals?.pulse || 76,
      breathingRate: scannedVitals?.breathingRate || 16,
      allergies: computedAllergies,
      medications: computedMeds,
      onset: computedOnset,
      isPregnant: computedPregnant,
    });
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-8rem)] p-4 max-w-3xl mx-auto w-full text-center bg-white text-black font-sans space-y-6">
      {subStep === 'symptoms' ? (
        <>
          <div className="space-y-3 pt-2">
            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
              Describe Your Symptoms
            </h2>

            <p className="text-zinc-700 text-base md:text-lg max-w-xl mx-auto font-medium">
              Press the button below and speak naturally in your language.
            </p>
          </div>

          <div className="w-full max-w-md space-y-5">
            <div className="flex flex-col items-center justify-center space-y-3">
              <button
                onClick={toggleRecording}
                disabled={isAnalyzing}
                className={`p-8 rounded-full transition-all flex items-center justify-center border-4 shadow-lg ${
                  isRecording
                    ? 'bg-red-600 border-red-700 text-white scale-110 ring-8 ring-red-200 animate-pulse'
                    : 'bg-black text-white border-black hover:bg-zinc-800'
                }`}
                aria-label={isRecording ? 'Stop listening' : 'Start microphone'}
              >
                {isRecording ? (
                  <Mic className="w-14 h-14 text-white animate-pulse" />
                ) : (
                  <MicOff className="w-14 h-14 text-white opacity-85" />
                )}
              </button>

              <span className="text-base font-bold text-black">
                {isRecording ? 'Listening... Speak now (tap to stop)' : 'Tap Microphone to Speak'}
              </span>
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 text-left space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-bold tracking-wider">
                <span>What you said</span>
                <button
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="text-black hover:underline flex items-center gap-1 font-extrabold"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  {showTextInput ? 'Hide Text Box' : 'Type instead'}
                </button>
              </div>

              {!showTextInput ? (
                <div className="min-h-[70px] text-black text-base font-medium p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                  {transcript || (
                    <span className="text-zinc-400 italic font-normal">
                      {isRecording ? 'Listening to your voice...' : 'Your spoken words will appear here...'}
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Type your symptoms here..."
                  className="w-full min-h-[80px] bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black text-sm font-medium shadow-2xs"
                />
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center text-sm font-extrabold text-black">
                <span>How bad is the pain?</span>
                <span className="text-black text-lg font-black">{painScore} / 10</span>
              </div>

              <div className="flex items-center justify-between gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = painScore === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPainScore(num)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                        isSelected
                          ? 'bg-black text-white border border-black font-extrabold scale-105 shadow-xs'
                          : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-500 pt-0.5 px-0.5">
                <span>0 - No pain</span>
                <span>10 - Worst pain</span>
              </div>
            </div>

            <button
              onClick={handleNextToQuestions}
              disabled={!transcript.trim() || isAnalyzing}
              className="w-full py-4 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-40 shadow-md"
            >
              <span>Next</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-md space-y-3 pt-2 text-left">
            <button
              type="button"
              onClick={() => setSubStep('symptoms')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to symptoms</span>
            </button>

            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">
              A few quick questions
            </h2>
            <p className="text-zinc-600 text-sm font-medium">
              Help us prioritize your care. You can skip any question if unsure.
            </p>
          </div>

          <div className="w-full max-w-md space-y-4 text-left">
            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              <label className="font-bold text-sm text-zinc-900 block">
                Are you allergic to any medicines?
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'No', val: 'No' },
                  { label: 'Yes', val: 'Yes' },
                  { label: 'Not sure', val: 'Not sure' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setHasAllergy(opt.val)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                      hasAllergy === opt.val
                        ? 'bg-black text-white border-black shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {hasAllergy === 'Yes' && (
                <div className="pt-1">
                  <label className="text-xs font-bold text-zinc-600 block mb-1">Which one?</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin"
                    value={allergyDetails}
                    onChange={(e) => setAllergyDetails(e.target.value)}
                    className="w-full bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black font-medium text-sm shadow-2xs"
                  />
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              <label className="font-bold text-sm text-zinc-900 block">
                Do you take any medicines?
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'No', val: 'No' },
                  { label: 'Yes', val: 'Yes' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setTakeMeds(opt.val)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                      takeMeds === opt.val
                        ? 'bg-black text-white border-black shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {takeMeds === 'Yes' && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="e.g. aspirin, insulin"
                    value={medicationsText}
                    onChange={(e) => setMedicationsText(e.target.value)}
                    className="w-full bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black font-medium text-sm shadow-2xs"
                  />
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="space-y-1">
                <label className="font-bold text-sm text-zinc-900 block">
                  When did this start?
                </label>
                {detectedOnsetFromWords && (
                  <span className="text-xs text-zinc-500 font-medium block">
                    Detected from your description: <span className="font-bold text-zinc-800">{detectedOnsetFromWords}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['Just now', 'Today', 'A few days', 'A week or more'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOnsetChoice(opt)}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center ${
                      onsetChoice === opt
                        ? 'bg-black text-white border-black shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {canAskPregnancy && (
              <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3 shadow-2xs">
                <label className="font-bold text-sm text-zinc-900 block">
                  Could you be pregnant?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['No', 'Yes', 'Not sure', 'Prefer not to say'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPregnantChoice(opt)}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center ${
                        pregnantChoice === opt
                          ? 'bg-black text-white border-black shadow-2xs'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="w-full py-4 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-40 shadow-md mt-4"
            >
              {isAnalyzing ? (
                <span>Analyzing Intake...</span>
              ) : (
                <>
                  <span>Check in</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
