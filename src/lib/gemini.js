import { GoogleGenerativeAI } from '@google/generative-ai';
import { kioskStrings } from './kioskStrings';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// fallbacks for when a model is overloaded (503)
const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

async function generate(prompt) {
  let lastError;
  for (const model of MODELS) {
    try {
      const result = await genAI.getGenerativeModel({ model }).generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const LANGUAGE_NAMES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  ar: 'Arabic',
  pa: 'Punjabi',
  zh: 'Mandarin Chinese',
  ru: 'Russian',
};

const FALLBACK_FOLLOW_UP = {
  en: 'Do you have any other symptoms, like fever, vomiting, dizziness or trouble breathing?',
  fr: 'Avez-vous d\'autres symptômes, comme de la fièvre, des vomissements, des vertiges ou du mal à respirer ?',
  es: '¿Tiene otros síntomas, como fiebre, vómitos, mareos o dificultad para respirar?',
  ar: 'هل لديك أعراض أخرى، مثل الحمى أو القيء أو الدوخة أو صعوبة في التنفس؟',
  pa: 'ਕੀ ਤੁਹਾਨੂੰ ਕੋਈ ਹੋਰ ਲੱਛਣ ਹਨ, ਜਿਵੇਂ ਬੁਖਾਰ, ਉਲਟੀ, ਚੱਕਰ ਆਉਣਾ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼?',
  zh: '您还有其他症状吗？比如发烧、呕吐、头晕或呼吸困难？',
  ru: 'Есть ли у вас другие симптомы, например температура, рвота, головокружение или затруднённое дыхание?',
};

const parseJson = (text) => JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());

const FALLBACK_CLOSING = {
  en: 'Thank you, that helps the nurse. Tap Next to continue.',
  fr: 'Merci, cela aide l\'infirmière. Appuyez sur Suivant pour continuer.',
  es: 'Gracias, eso ayuda a la enfermera. Toque Siguiente para continuar.',
  ar: 'شكراً، هذا يساعد الممرضة. اضغط على التالي للمتابعة.',
  pa: 'ਧੰਨਵਾਦ, ਇਸ ਨਾਲ ਨਰਸ ਦੀ ਮਦਦ ਹੁੰਦੀ ਹੈ। ਜਾਰੀ ਰੱਖਣ ਲਈ ਅੱਗੇ ਦਬਾਓ।',
  zh: '谢谢，这对护士很有帮助。请点击下一步继续。',
  ru: 'Спасибо, это поможет медсестре. Нажмите «Далее», чтобы продолжить.',
};

const MAX_FOLLOW_UPS = 3;

// history: [{ question, answer }] asked so far. Returns the next question, or
// { done: true } with a closing line once there's enough for the nurse.
export async function nextFollowUp({ transcript, languageCode = 'en', history = [] }) {
  const finish = {
    done: true,
    message: FALLBACK_CLOSING[languageCode] || FALLBACK_CLOSING.en,
    messageEnglish: FALLBACK_CLOSING.en,
  };
  const firstQuestion = {
    done: false,
    question: FALLBACK_FOLLOW_UP[languageCode] || FALLBACK_FOLLOW_UP.en,
    questionEnglish: FALLBACK_FOLLOW_UP.en,
  };

  if (history.length >= MAX_FOLLOW_UPS) return finish;
  if (!genAI || !transcript?.trim()) return history.length ? finish : firstQuestion;

  const language = LANGUAGE_NAMES[languageCode] || 'English';
  const nextLabel = kioskStrings(languageCode).next;
  const asked = history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n');

  try {
    const parsed = parseJson(await generate(`
You are a triage nurse talking with a patient at an Emergency Room check-in kiosk.
The patient first said: "${transcript}"
${asked ? `Follow-up so far:\n${asked}` : 'No follow-up questions asked yet.'}

Decide what to do next:
- If you still need something important for triage, ask ONE new short, kind question
  (associated symptoms, what makes it worse, relevant history). Never repeat a question,
  and never ask when it started or how bad the pain is; the kiosk asks those later.
- If you have enough, finish with one short warm sentence that thanks them and tells them
  to tap "${nextLabel}" to continue. If the answers sound like an emergency (chest pain,
  trouble breathing, stroke signs, heavy bleeding), also tell them to alert staff right away.
Write in ${language}, plain words, under 30 words. You may ask at most ${MAX_FOLLOW_UPS - history.length} more question(s).

Return ONLY JSON, one of:
{"done": false, "question": "in ${language}", "questionEnglish": "English translation"}
{"done": true, "message": "in ${language}", "messageEnglish": "English translation"}
`));

    if (parsed.done && parsed.message) {
      return { done: true, message: parsed.message, messageEnglish: parsed.messageEnglish || parsed.message };
    }
    if (!parsed.done && parsed.question) {
      return { done: false, question: parsed.question, questionEnglish: parsed.questionEnglish || parsed.question };
    }
  } catch (error) {
    console.error('Gemini follow-up error:', error);
  }
  return history.length ? finish : firstQuestion;
}

export async function analyzeTranscriptWithGemini({ transcript, pulse, breathingRate, painScore }) {
  if (!transcript || transcript.trim().length === 0) {
    return getFallbackAnalysis('Patient provided no spoken description.', painScore);
  }

  if (!genAI) {
    console.warn('GEMINI_API_KEY missing. Using fallback parser.');
    return getFallbackAnalysis(transcript, painScore);
  }

  try {
    const prompt = `
You are VoxVital AI, a clinical intake assistant for a hospital Emergency Room.
Analyze the following patient transcript (which may be in ANY language) along with their non-contact camera vitals.

PATIENT VITAL SIGNS:
- Pulse Rate: ${pulse !== null ? pulse + ' bpm' : 'Skipped / Not available'}
- Respiratory Rate: ${breathingRate !== null ? breathingRate + ' rpm' : 'Skipped / Not available'}
- Self-Rated Pain Score: ${painScore}/10

PATIENT SPOKEN TRANSCRIPT:
"${transcript}"

CRITICAL TRUTH & ACCURACY RULES:
1. Summarize ONLY what was explicitly stated in the transcript. Do NOT invent, assume, or add symptoms or details not present in the transcript (e.g. NEVER add crying, fever, or pain unless directly mentioned in the transcript).
2. For EVERY item in the 'symptoms' array, you MUST provide an exact supporting quote or direct phrase from the transcript. Format each symptom as: 'Symptom Name (from: "exact phrase")'. If a symptom cannot be directly quoted from the transcript, DROP IT completely.
3. NEVER edit, translate, or modify the original transcript text. Return the original transcript verbatim as spoken.
4. Symptom tags come ONLY from the transcript. Vital signs (pulse/breathing) are measured separately by camera telemetry.

TASK:
1. Detect the language used in the transcript.
2. Translate and synthesize the chief complaint into concise medical English strictly reflecting only what was said.
3. Extract key symptoms with exact quotes from the transcript: 'Symptom (from: "quote")'.
4. Suggest a preliminary CTAS triage level (1 to 5) based on severity.

Return ONLY a valid JSON object matching this EXACT schema (no markdown, no code block backticks):
{
  "chiefComplaint": "Concise medical chief complaint in English matching ONLY stated facts",
  "symptoms": ["Symptom 1 (from: \"exact quote 1\")", "Symptom 2 (from: \"exact quote 2\")"],
  "onset": "Duration or onset description in English",
  "painScore": ${painScore},
  "detectedLanguage": "Full language name in English (e.g. French, Spanish, Punjabi, Arabic, Mandarin, English)",
  "detectedLanguageCode": "ISO-639-1 code (e.g. fr, es, pa, ar, zh, en)",
  "llmSuggestedLevel": 2
}
`;

    const parsed = parseJson(await generate(prompt));

    return {
      chiefComplaint: parsed.chiefComplaint || transcript.trim(),
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      onset: parsed.onset || 'Recent onset',
      painScore: Number(parsed.painScore) || Number(painScore) || 0,
      detectedLanguage: parsed.detectedLanguage || 'English',
      detectedLanguageCode: parsed.detectedLanguageCode || 'en',
      llmSuggestedLevel: Number(parsed.llmSuggestedLevel) || 4,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return getFallbackAnalysis(transcript, painScore);
  }
}

function getFallbackAnalysis(transcript, painScore) {
  const text = transcript.toLowerCase();

  let language = 'English';
  let langCode = 'en';

  if (/[àâäéèêëîïôöùûüç]/i.test(text) || /\b(je|j'ai|douleur|poitrine|mal|respirer|depuis|bras|fort|merci)\b/i.test(text)) {
    language = 'French';
    langCode = 'fr';
  } else if (/[áéíóúñ¿¡]/i.test(text) || /\b(tengo|dolor|pecho|respirar|me|duele|pie|tobillo|desde)\b/i.test(text)) {
    language = 'Spanish';
    langCode = 'es';
  } else if (/[\u0600-\u06FF]/.test(text)) {
    language = 'Arabic';
    langCode = 'ar';
  } else if (/[\u0A00-\u0A7F]/.test(text)) {
    language = 'Punjabi';
    langCode = 'pa';
  } else if (/[\u4E00-\u9FFF]/.test(text)) {
    language = 'Mandarin';
    langCode = 'zh';
  }

  const symptoms = [];
  let suggestedLevel = 4;

  if (text.includes('chest') || text.includes('poitrine') || text.includes('pecho') || text.includes('heart')) {
    const match = transcript.match(/(chest\s*\w*|poitrine|pecho|heart)/i);
    const quote = match ? match[0] : 'chest';
    symptoms.push(`Chest pain (from: "${quote}")`);
    suggestedLevel = 2;
  }
  if (text.includes('breath') || text.includes('respirer') || text.includes('respirar') || text.includes('dyspnea')) {
    const match = transcript.match(/(breath\w*|respirer|respirar|dyspnea)/i);
    const quote = match ? match[0] : 'breathing';
    symptoms.push(`Shortness of breath (from: "${quote}")`);
    suggestedLevel = Math.min(suggestedLevel, 2);
  }
  if (text.includes('ankle') || text.includes('tobillo') || text.includes('foot') || text.includes('sprain')) {
    const match = transcript.match(/(tobillo\s*\w*|ankle\s*\w*|foot)/i);
    const quote = match ? match[0] : 'ankle';
    symptoms.push(`Ankle pain (from: "${quote}")`);
    suggestedLevel = Math.min(suggestedLevel, 4);
  }
  if (text.includes('headache') || text.includes('dizziness') || text.includes('ਚੱਕਰ') || text.includes('ਤਬੀਅਤ')) {
    const match = transcript.match(/(dizziness|dizzy|headache|ਚੱਕਰ)/i);
    const quote = match ? match[0] : 'dizziness';
    symptoms.push(`Dizziness (from: "${quote}")`);
    suggestedLevel = Math.min(suggestedLevel, 3);
  }

  if (symptoms.length === 0 && transcript.trim().length > 0) {
    const quote = transcript.trim().slice(0, 45);
    symptoms.push(`Reported symptoms (from: "${quote}")`);
  }

  const chiefComplaint = symptoms.length > 0
    ? symptoms.map((s) => s.split(' (from:')[0]).join(', ')
    : transcript.trim();

  let onset = 'Just now';
  if (text.includes('20 min') || text.includes('depuis 20')) {
    onset = '20 min before check-in';
  } else if (text.includes('today') || text.includes('aujourd\'hui')) {
    onset = 'Today';
  } else if (text.includes('yesterday') || text.includes('hier')) {
    onset = 'Yesterday';
  }

  return {
    chiefComplaint,
    symptoms,
    onset,
    painScore: Number(painScore) || 0,
    detectedLanguage: language,
    detectedLanguageCode: langCode,
    llmSuggestedLevel: suggestedLevel,
  };
}
