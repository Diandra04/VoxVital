import { NextResponse } from 'next/server';
import { getAllPatientsSorted } from '@/lib/store';

// public screen: ticket numbers only
export async function GET() {
  const patients = getAllPatientsSorted();

  const called = patients
    .filter((p) => p.status === 'called' && p.calledAt)
    .sort((a, b) => b.calledAt - a.calledAt)
    .slice(0, 6)
    .map((p) => ({ ticket: p.ticketNumber, calledAt: p.calledAt }));

  const waiting = patients.filter((p) => p.status === 'waiting' || p.status === 'confirmed').length;

  return NextResponse.json({ success: true, called, waiting });
}
