'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowRight, ArrowLeft, Keyboard, Volume2, RotateCcw } from 'lucide-react';
import { SPEECH_LOCALES, speak } from '@/lib/speech';

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

export default function KioskVoiceIntake({ t, selectedLang, scannedVitals, onSubmitIntake, isAnalyzing, checkinMeta = {} }) {
  const answerLabels = { No: t.no, Yes: t.yes, 'Not sure': t.notSure, 'Prefer not to say': t.preferNot };

  const [subStep, setSubStep] = useState('symptoms');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const [followUp, setFollowUp] = useState(null);
  const [followUpFor, setFollowUpFor] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [painScore, setPainScore] = useState(5);
  const [showTextInput, setShowTextInput] = useState(!!checkinMeta.needsInterpreter);

  const [hasAllergy, setHasAllergy] = useState(null);
  const [allergyDetails, setAllergyDetails] = useState('');
  const [takeMeds, setTakeMeds] = useState(null);
  const [medicationsText, setMedicationsText] = useState('');
  const [onsetChoice, setOnsetChoice] = useState(null);
  const [detectedOnsetFromWords, setDetectedOnsetFromWords] = useState(null);
  const [pregnantChoice, setPregnantChoice] = useState(null);

  const recognitionRef = useRef(null);
  // refs so async callbacks see current values
  const listenTarget = useRef('symptoms');
  const subStepRef = useRef('symptoms');

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
      if (listenTarget.current === 'followup') setFollowUpAnswer(text);
      else setTranscript(text);
    };
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [selectedLang]);

  const goTo = (step) => {
    subStepRef.current = step;
    setSubStep(step);
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };

  const startListening = (target) => {
    // no SpeechRecognition (Firefox etc.)
    if (!recognitionRef.current) {
      setShowTextInput(true);
      return;
    }
    listenTarget.current = target;
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
    setIsRecording(true);
  };

  const toggleRecording = (target) => {
    if (isRecording) stopListening();
    else startListening(target);
  };

  const askFollowUp = async (question) => {
    stopListening();
    setIsSpeaking(true);
    await speak(question.question, selectedLang.code);
    setIsSpeaking(false);
    if (subStepRef.current === 'followup') startListening('followup');
  };

  const handleNextFromSymptoms = async () => {
    if (!transcript.trim()) return;
    stopListening();

    const detected = detectOnsetFromTranscript(transcript);
    if (detected) {
      setDetectedOnsetFromWords(detected);
      if (!onsetChoice) {
        setOnsetChoice(detected);
      }
    }

    goTo('followup');
    if (followUp && followUpFor === transcript) return;

    setFollowUp(null);
    setFollowUpAnswer('');
    setFollowUpLoading(true);
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, languageCode: selectedLang.code }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const question = { question: data.question, questionEnglish: data.questionEnglish };
      setFollowUp(question);
      setFollowUpFor(transcript);
      setFollowUpLoading(false);
      askFollowUp(question);
    } catch {
      // skip the follow-up
      setFollowUpLoading(false);
      goTo('questions');
    }
  };

  const handleLeaveFollowUp = (keepAnswer) => {
    stopListening();
    window.speechSynthesis?.cancel();
    if (!keepAnswer) setFollowUpAnswer('');
    goTo('questions');
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
      followUp: followUp && followUpAnswer.trim()
        ? { ...followUp, answer: followUpAnswer.trim() }
        : null,
    });
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-8rem)] p-4 max-w-3xl mx-auto w-full text-center bg-white text-black font-sans space-y-6">
      {subStep === 'symptoms' && (
        <>
          <div className="space-y-3 pt-2">
            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
              {t.describeTitle}
            </h2>

            <p className="text-zinc-700 text-base md:text-lg max-w-xl mx-auto font-medium">
              {t.describeSub}
            </p>
          </div>

          <div className="w-full max-w-md space-y-5">
            <div className="flex flex-col items-center justify-center space-y-3">
              <button
                onClick={() => toggleRecording('symptoms')}
                disabled={isAnalyzing}
                className={`p-8 rounded-full transition-all flex items-center justify-center border-4 ${
                  isRecording
                    ? 'bg-red-600 border-red-700 text-white scale-110 animate-pulse'
                    : 'bg-black text-white border-black hover:bg-zinc-800'
                }`}
                aria-label={isRecording ? t.listening : t.tapToSpeak}
              >
                {isRecording ? (
                  <Mic className="w-14 h-14 text-white animate-pulse" />
                ) : (
                  <MicOff className="w-14 h-14 text-white opacity-85" />
                )}
              </button>

              <span className="text-base font-bold text-black">
                {isRecording ? t.listening : t.tapToSpeak}
              </span>
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 text-start space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-bold tracking-wider">
                <span>{t.whatYouSaid}</span>
                <button
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="text-black hover:underline flex items-center gap-1 font-extrabold"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  {showTextInput ? t.hideTextBox : t.typeInstead}
                </button>
              </div>

              {!showTextInput ? (
                <div className="min-h-[70px] text-black text-base font-medium p-3 bg-white rounded-xl border border-zinc-200">
                  {transcript || (
                    <span className="text-zinc-400 italic font-normal">
                      {isRecording ? t.listeningPlaceholder : t.spokenPlaceholder}
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={t.typeSymptoms}
                  className="w-full min-h-[80px] bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black text-sm font-medium"
                />
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-sm font-extrabold text-black">
                <span>{t.painQuestion}</span>
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
                          ? 'bg-black text-white border border-black font-extrabold scale-105'
                          : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-500 pt-0.5 px-0.5">
                <span>{t.noPain}</span>
                <span>{t.worstPain}</span>
              </div>
            </div>

            <button
              onClick={handleNextFromSymptoms}
              disabled={!transcript.trim() || isAnalyzing}
              className="w-full py-4 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-40"
            >
              <span>{t.next}</span>
              <ArrowRight className="w-6 h-6 rtl:rotate-180" />
            </button>
          </div>
        </>
      )}

      {subStep === 'followup' && (
        <>
          <div className="w-full max-w-md space-y-3 pt-2 text-start">
            <button
              type="button"
              onClick={() => {
                stopListening();
                goTo('symptoms');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t.backToSymptoms}</span>
            </button>

            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">
              {t.oneMoreQuestion}
            </h2>
          </div>

          {followUpLoading || !followUp ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
              <span className="text-base font-bold text-zinc-700">{t.preparingQuestion}</span>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-5">
              <div className="bg-blue-50 border-2 border-blue-600 rounded-2xl p-5 text-start space-y-3">
                <div className="flex items-start gap-3">
                  <Volume2 className={`w-7 h-7 text-blue-600 shrink-0 mt-1 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <p className="text-xl md:text-2xl font-black text-black leading-snug">{followUp.question}</p>
                </div>
                {selectedLang.code !== 'en' && (
                  <p className="text-xs font-medium text-zinc-600 ps-10">{followUp.questionEnglish}</p>
                )}
                <button
                  type="button"
                  onClick={() => askFollowUp(followUp)}
                  disabled={isSpeaking}
                  className="ms-10 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.hearAgain}</span>
                </button>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3">
                <button
                  onClick={() => toggleRecording('followup')}
                  disabled={isSpeaking}
                  className={`p-6 rounded-full transition-all flex items-center justify-center border-4 disabled:opacity-40 ${
                    isRecording
                      ? 'bg-red-600 border-red-700 text-white scale-110 animate-pulse'
                      : 'bg-black text-white border-black hover:bg-zinc-800'
                  }`}
                  aria-label={isRecording ? t.listening : t.tapToSpeak}
                >
                  {isRecording ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10 opacity-85" />}
                </button>
                <span className="text-base font-bold text-black">
                  {isSpeaking ? t.listenToQuestion : isRecording ? t.listening : t.tapToAnswer}
                </span>
              </div>

              <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 text-start space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-600 font-bold tracking-wider">
                  <span>{t.yourAnswer}</span>
                  <button
                    onClick={() => setShowTextInput(!showTextInput)}
                    className="text-black hover:underline flex items-center gap-1 font-extrabold"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    {showTextInput ? t.hideTextBox : t.typeInstead}
                  </button>
                </div>
                {!showTextInput ? (
                  <div className="min-h-[60px] text-black text-base font-medium p-3 bg-white rounded-xl border border-zinc-200">
                    {followUpAnswer || (
                      <span className="text-zinc-400 italic font-normal">{t.answerPlaceholder}</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder={t.typeAnswer}
                    className="w-full min-h-[70px] bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black text-sm font-medium"
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLeaveFollowUp(false)}
                  className="py-4 px-5 rounded-xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
                >
                  {t.skip}
                </button>
                <button
                  onClick={() => handleLeaveFollowUp(true)}
                  disabled={!followUpAnswer.trim()}
                  className="flex-1 py-4 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-40"
                >
                  <span>{t.next}</span>
                  <ArrowRight className="w-6 h-6 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {subStep === 'questions' && (
        <>
          <div className="w-full max-w-md space-y-3 pt-2 text-start">
            <button
              type="button"
              onClick={() => goTo('symptoms')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t.backToSymptoms}</span>
            </button>

            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">
              {t.quickTitle}
            </h2>
            <p className="text-zinc-600 text-sm font-medium">
              {t.quickSub}
            </p>
          </div>

          <div className="w-full max-w-md space-y-4 text-start">
            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3">
              <label className="font-bold text-sm text-zinc-900 block">
                {t.allergyQ}
              </label>
              <div className="flex items-center gap-2">
                {['No', 'Yes', 'Not sure'].map((val) => ({ val, label: answerLabels[val] })).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setHasAllergy(opt.val)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                      hasAllergy === opt.val
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {hasAllergy === 'Yes' && (
                <div className="pt-1">
                  <label className="text-xs font-bold text-zinc-600 block mb-1">{t.whichOne}</label>
                  <input
                    type="text"
                    placeholder={t.allergyExample}
                    value={allergyDetails}
                    onChange={(e) => setAllergyDetails(e.target.value)}
                    className="w-full bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black font-medium text-sm"
                  />
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3">
              <label className="font-bold text-sm text-zinc-900 block">
                {t.medsQ}
              </label>
              <div className="flex items-center gap-2">
                {['No', 'Yes'].map((val) => ({ val, label: answerLabels[val] })).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setTakeMeds(opt.val)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                      takeMeds === opt.val
                        ? 'bg-black text-white border-black'
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
                    placeholder={t.medsExample}
                    value={medicationsText}
                    onChange={(e) => setMedicationsText(e.target.value)}
                    className="w-full bg-white text-black p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-black font-medium text-sm"
                  />
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-sm text-zinc-900 block">
                  {t.onsetQ}
                </label>
                {detectedOnsetFromWords && (
                  <span className="text-xs text-zinc-500 font-medium block">
                    {t.detected} <span className="font-bold text-zinc-800">{t.onset[detectedOnsetFromWords]}</span>
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
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {t.onset[opt]}
                  </button>
                ))}
              </div>
            </div>

            {canAskPregnancy && (
              <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-4 space-y-3">
                <label className="font-bold text-sm text-zinc-900 block">
                  {t.pregnantQ}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['No', 'Yes', 'Not sure', 'Prefer not to say'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPregnantChoice(opt)}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center ${
                        pregnantChoice === opt
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {answerLabels[opt]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="w-full py-4 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-40 mt-4"
            >
              {isAnalyzing ? (
                <span>{t.analyzing}</span>
              ) : (
                <>
                  <span>{t.checkIn}</span>
                  <ArrowRight className="w-6 h-6 rtl:rotate-180" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
