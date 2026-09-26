import { NextResponse } from 'next/server';
import { requestStaffHelp, dismissStaffHelp } from '@/lib/store';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const alertItem = requestStaffHelp(body.location || 'Kiosk 1');
    return NextResponse.json({ success: true, alert: alertItem });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('id');
    dismissStaffHelp(alertId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
