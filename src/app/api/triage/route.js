import { NextResponse } from 'next/server';
import { getAllPatientsSorted, addOrUpdatePatient, resetStore } from '@/lib/store';
import { analyzeTranscriptWithGemini } from '@/lib/gemini';
import { getLatestVitals } from '@/lib/vitals';
import { rateLimit, requestBaseUrl } from '@/lib/http';

export async function GET() {
  try {
    const patients = getAllPatientsSorted();
    return NextResponse.json({ success: true, patients, count: patients.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const limited = rateLimit(req, 'triage', 20);
  if (limited) return limited;

  try {
    const {
      transcript = '',
      followUps = [],
      painScore = 0,
      pulse: rawPulse,
      breathingRate: rawBreathing,
      vitalsSkipped = false,
      language,
      languageCode,
      onset,
      ...intake
    } = await req.json();

    const latestVitals = getLatestVitals();
    const pulse = vitalsSkipped ? null : (rawPulse != null ? Number(rawPulse) : latestVitals.pulse);
    const breathingRate = vitalsSkipped ? null : (rawBreathing != null ? Number(rawBreathing) : latestVitals.breathing);

    const answered = followUps.filter((f) => f.answer?.trim());
    const fullTranscript = [transcript, ...answered.map((f) => f.answer.trim())].join(' ');

    const analysis = await analyzeTranscriptWithGemini({ transcript: fullTranscript, pulse, breathingRate, painScore });

    const patient = await addOrUpdatePatient({
      ...intake,
      publicBase: requestBaseUrl(req),
      followUps: answered,
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
      transcript: fullTranscript,
      originalTranscript: transcript,
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
