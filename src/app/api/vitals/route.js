import { NextResponse } from 'next/server';
import { setSimulatedVitalsTarget } from '@/lib/vitals';

export async function POST(req) {
  try {
    const { pulse, breathing } = await req.json();
    const vitals = setSimulatedVitalsTarget({ pulse, breathing });
    return NextResponse.json({ success: true, vitals });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
