import { NextResponse } from 'next/server';
import { requestPatientRecheck } from '@/lib/store';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const updated = requestPatientRecheck(id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
