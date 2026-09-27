import { NextResponse } from 'next/server';
import { getPatient, findPatientByTicket, calculateQueueRank } from '@/lib/store';

export async function GET(req, { params }) {
  try {
    const { id: idOrTicket } = await params;
    const patient = getPatient(idOrTicket) || findPatientByTicket(idOrTicket);

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patientId: patient.id,
      ticketNumber: patient.ticketNumber,
      status: patient.status,
      ahead: calculateQueueRank(patient.id),
      recheckRequested: !!patient.recheckRequested,
      recheckRequestedByNurse: !!patient.recheckRequestedByNurse,
      phoneMessage: patient.phoneMessage,
      languageCode: patient.languageCode || 'en',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
