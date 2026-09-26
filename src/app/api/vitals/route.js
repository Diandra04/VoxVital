import { NextResponse } from 'next/server';
import { getLatestVitals, setSimulatedVitalsTarget } from '@/lib/vitals';

export async function GET() {
  return NextResponse.json({ success: true, vitals: getLatestVitals() });
}

export async function POST(req) {
  try {
    const { pulse, breathing } = await req.json();
    const updated = setSimulatedVitalsTarget({ pulse, breathing });
    return NextResponse.json({ success: true, vitals: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
