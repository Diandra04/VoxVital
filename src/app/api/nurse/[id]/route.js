import { NextResponse } from 'next/server';
import { updateNurseAction } from '@/lib/store';

async function handleNurseRequest(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = updateNurseAction(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export { handleNurseRequest as POST, handleNurseRequest as PATCH };

