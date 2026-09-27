export const SPEECH_LOCALES = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  ar: 'ar-SA',
  pa: 'pa-IN',
  zh: 'zh-CN',
  ru: 'ru-RU',
};

export function speakInBrowser(text, languageCode = 'en') {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALES[languageCode] || 'en-US';
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

// ElevenLabs if configured, otherwise browser speech. Resolves when done.
export async function speak(text, languageCode = 'en') {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, langCode: languageCode }),
    });
    if (!res.headers.get('Content-Type')?.includes('audio')) return speakInBrowser(text, languageCode);

    const audio = new Audio(URL.createObjectURL(await res.blob()));
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  } catch {
    await speakInBrowser(text, languageCode);
  }
}
