import { NextResponse } from 'next/server';
import { generateFollowUpQuestion } from '@/lib/gemini';
import { rateLimit } from '@/lib/http';

export async function POST(req) {
  const limited = rateLimit(req, 'followup', 20);
  if (limited) return limited;

  try {
    const { transcript, languageCode } = await req.json();
    const followUp = await generateFollowUpQuestion({ transcript, languageCode });
    return NextResponse.json({ success: true, ...followUp });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
