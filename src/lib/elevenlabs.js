const apiKey = process.env.ELEVENLABS_API_KEY;

const VOICE_IDS = {
  en: '21m00Tcm4TlvDq8ikWAM',
  fr: 'XB0fDUnXU5powctDhC70',
  es: 'ErXwobaYiN019PkySvjV',
  ar: 'AZnzlk1XvdvUeBnXmlld',
  pa: '21m00Tcm4TlvDq8ikWAM',
  zh: '21m00Tcm4TlvDq8ikWAM',
  default: '21m00Tcm4TlvDq8ikWAM',
};

export async function generateSpeechBuffer(text, langCode = 'en') {
  if (!apiKey || !text?.trim()) return null;

  const voiceId = VOICE_IDS[langCode] || VOICE_IDS.default;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}
