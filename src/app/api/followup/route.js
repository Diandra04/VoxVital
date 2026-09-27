import { NextResponse } from 'next/server';
import { nextFollowUp } from '@/lib/gemini';
import { rateLimit } from '@/lib/http';

export async function POST(req) {
  const limited = rateLimit(req, 'followup', 20);
  if (limited) return limited;

  try {
    const { transcript, languageCode, history } = await req.json();
    const next = await nextFollowUp({ transcript, languageCode, history: Array.isArray(history) ? history : [] });
    return NextResponse.json({ success: true, ...next });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
