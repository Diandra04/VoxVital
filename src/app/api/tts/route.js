import { NextResponse } from 'next/server';
import { generateSpeechBuffer } from '@/lib/elevenlabs';
import { rateLimit } from '@/lib/http';

export async function POST(req) {
  const limited = rateLimit(req, 'tts', 60);
  if (limited) return limited;

  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text parameter required' }, { status: 400 });
    }
    if (text.length > 400) {
      return NextResponse.json({ success: false, error: 'Text too long' }, { status: 400 });
    }

    const audioBuffer = await generateSpeechBuffer(text);

    if (!audioBuffer) {
      // client falls back to speechSynthesis
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
