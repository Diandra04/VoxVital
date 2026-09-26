import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Falls back to a keyword parser when there is no API key or the call fails.
export async function analyzeTranscriptWithGemini({ transcript, pulse, breathingRate, painScore }) {
  if (!transcript || transcript.trim().length === 0) {
    return getFallbackAnalysis('Patient provided no spoken description.', painScore);
  }

  if (!genAI) {
    console.warn('GEMINI_API_KEY missing. Using fallback parser.');
    return getFallbackAnalysis(transcript, painScore);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
4. Compose 1-2 empathetic, helpful follow-up questions IN THE PATIENT'S NATIVE LANGUAGE to clarify onset and pain severity.
5. Provide the English translation of the follow-up question.
6. Suggest a preliminary CTAS triage level (1 to 5) based on severity.

Return ONLY a valid JSON object matching this EXACT schema (no markdown, no code block backticks):
{
  "chiefComplaint": "Concise medical chief complaint in English matching ONLY stated facts",
  "symptoms": ["Symptom 1 (from: \"exact quote 1\")", "Symptom 2 (from: \"exact quote 2\")"],
  "onset": "Duration or onset description in English",
  "painScore": ${painScore},
  "detectedLanguage": "Full language name in English (e.g. French, Spanish, Punjabi, Arabic, Mandarin, English)",
  "detectedLanguageCode": "ISO-639-1 code (e.g. fr, es, pa, ar, zh, en)",
  "redFlagKeywords": ["chest pain", "shortness of breath"],
  "followUpQuestionNative": "Follow-up question written in the patient's detected native language",
  "followUpQuestionEnglish": "Follow-up question translated to English",
  "llmSuggestedLevel": 2
}
`;

    const result = await model.generateContent(prompt);
    // The model sometimes wraps the JSON in a markdown code fence anyway
    const json = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(json);

    return {
      chiefComplaint: parsed.chiefComplaint || transcript.trim(),
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      onset: parsed.onset || 'Recent onset',
      painScore: Number(parsed.painScore) || Number(painScore) || 0,
      detectedLanguage: parsed.detectedLanguage || 'English',
      detectedLanguageCode: parsed.detectedLanguageCode || 'en',
      redFlagKeywords: Array.isArray(parsed.redFlagKeywords) ? parsed.redFlagKeywords : [],
      followUpQuestionNative: parsed.followUpQuestionNative || 'When did your symptoms start?',
      followUpQuestionEnglish: parsed.followUpQuestionEnglish || 'When did your symptoms start?',
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
  let followUpNative = 'When did your symptoms start? From 1 to 10, how bad is the pain?';
  let followUpEnglish = 'When did your symptoms start? From 1 to 10, how bad is the pain?';

  if (/[àâäéèêëîïôöùûüç]/i.test(text) || /\b(je|j'ai|douleur|poitrine|mal|respirer|depuis|bras|fort|merci)\b/i.test(text)) {
    language = 'French';
    langCode = 'fr';
    followUpNative = 'Depuis quand ressentez-vous ces symptômes ? Sur une échelle de 1 à 10, à combien évaluez-vous la douleur ?';
    followUpEnglish = 'How long have you felt these symptoms? On a scale of 1 to 10, how bad is the pain?';
  } else if (/[áéíóúñ¿¡]/i.test(text) || /\b(tengo|dolor|pecho|respirar|me|duele|pie|tobillo|desde)\b/i.test(text)) {
    language = 'Spanish';
    langCode = 'es';
    followUpNative = '¿Cuándo comenzó el dolor? De 1 a 10, ¿qué tan fuerte es?';
    followUpEnglish = 'When did the pain start? From 1 to 10, how severe is it?';
  } else if (/[\u0600-\u06FF]/.test(text)) {
    language = 'Arabic';
    langCode = 'ar';
    followUpNative = 'متى بدأت هذه الأعراض؟ من 1 إلى 10، ما هي شدة الألم؟';
    followUpEnglish = 'When did these symptoms start? From 1 to 10, how severe is the pain?';
  } else if (/[\u0A00-\u0A7F]/.test(text)) {
    language = 'Punjabi';
    langCode = 'pa';
    followUpNative = 'ਇਹ ਦਰਦ ਕਦੋਂ ਤੋਂ ਸ਼ੁਰੂ ਹੋਇਆ ਹੈ? 1 ਤੋਂ 10 ਤੱਕ, ਦਰਦ ਕਿੰਨਾ ਜ਼ਿਆਦਾ ਹੈ?';
    followUpEnglish = 'When did this pain start? On a scale of 1 to 10, how severe is the pain?';
  } else if (/[\u4E00-\u9FFF]/.test(text)) {
    language = 'Mandarin';
    langCode = 'zh';
    followUpNative = '请问症状是从什么时候开始的？如果从1到10打分，您的疼痛程度是多少？';
    followUpEnglish = 'When did your symptoms start? On a scale of 1 to 10, how bad is the pain?';
  }

  const symptoms = [];
  const redFlags = [];
  let suggestedLevel = 4;

  if (text.includes('chest') || text.includes('poitrine') || text.includes('pecho') || text.includes('heart')) {
    const match = transcript.match(/(chest\s*\w*|poitrine|pecho|heart)/i);
    const quote = match ? match[0] : 'chest';
    symptoms.push(`Chest pain (from: "${quote}")`);
    redFlags.push('chest pain');
    suggestedLevel = 2;
  }
  if (text.includes('breath') || text.includes('respirer') || text.includes('respirar') || text.includes('dyspnea')) {
    const match = transcript.match(/(breath\w*|respirer|respirar|dyspnea)/i);
    const quote = match ? match[0] : 'breathing';
    symptoms.push(`Shortness of breath (from: "${quote}")`);
    redFlags.push('trouble breathing');
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
    redFlagKeywords: redFlags,
    followUpQuestionNative: followUpNative,
    followUpQuestionEnglish: followUpEnglish,
    llmSuggestedLevel: suggestedLevel,
  };
}
