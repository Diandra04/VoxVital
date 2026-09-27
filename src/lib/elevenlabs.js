const apiKey = process.env.ELEVENLABS_API_KEY;

// "Sarah" (built-in voice, free plans can't use library voices via API)
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export async function generateSpeechBuffer(text) {
  if (!apiKey || !text?.trim()) return null;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;

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
      console.error('ElevenLabs API error:', response.status, await response.text());
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}
