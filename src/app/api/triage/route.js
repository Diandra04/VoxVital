import { NextResponse } from 'next/server';
import { getAllPatientsSorted, addOrUpdatePatient, resetStore } from '@/lib/store';
import { analyzeTranscriptWithGemini } from '@/lib/gemini';
import { getLatestVitals } from '@/lib/vitals';

export async function GET() {
  try {
    const patients = getAllPatientsSorted();
    return NextResponse.json({ success: true, patients, count: patients.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const {
      transcript = '',
      painScore = 0,
      pulse: rawPulse,
      breathingRate: rawBreathing,
      vitalsSkipped = false,
      language,
      languageCode,
      onset,
      ...intake
    } = await req.json();

    // Fall back to the latest camera reading if the kiosk didn't send vitals
    const latestVitals = getLatestVitals();
    const pulse = vitalsSkipped ? null : (rawPulse != null ? Number(rawPulse) : latestVitals.pulse);
    const breathingRate = vitalsSkipped ? null : (rawBreathing != null ? Number(rawBreathing) : latestVitals.breathing);

    const analysis = await analyzeTranscriptWithGemini({ transcript, pulse, breathingRate, painScore });

    const patient = await addOrUpdatePatient({
      ...intake,
      vitalsSkipped,
      language: language || analysis.detectedLanguage,
      languageCode: languageCode || analysis.detectedLanguageCode,
      chiefComplaint: analysis.chiefComplaint,
      symptoms: analysis.symptoms,
      onset: onset && onset !== 'Skipped' ? onset : analysis.onset,
      painScore: analysis.painScore,
      pulse,
      breathingRate,
      vitalsConfidence: Math.round(((latestVitals.pulseConf + latestVitals.breathConf) / 2) * 100),
      vitalsSource: latestVitals.simulated ? 'Presage Telemetry (Simulated)' : 'Presage Optical Camera SDK',
      transcript,
      llmSuggestedLevel: analysis.llmSuggestedLevel,
    });

    return NextResponse.json({ success: true, patient });
  } catch (error) {
    console.error('Error processing intake:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const patients = await resetStore();
    return NextResponse.json({ success: true, patients });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
