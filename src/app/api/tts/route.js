import { NextResponse } from 'next/server';
import { generateSpeechBuffer } from '@/lib/elevenlabs';

export async function POST(req) {
  try {
    const { text, langCode = 'en' } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text parameter required' }, { status: 400 });
    }

    const audioBuffer = await generateSpeechBuffer(text, langCode);

    if (!audioBuffer) {
      // No ElevenLabs key or synthesis failed; the client falls back to Web Speech
      return NextResponse.json({ success: false, fallback: true });
    }

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
