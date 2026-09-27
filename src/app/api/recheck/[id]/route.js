import { NextResponse } from 'next/server';
import { getPatient, requestPatientRecheck, addOrUpdatePatient } from '@/lib/store';
import { analyzeTranscriptWithGemini } from '@/lib/gemini';
import { rateLimit, requestBaseUrl } from '@/lib/http';

// no body = just flag "feeling worse"; with text, re-run triage
export async function POST(req, { params }) {
  const limited = rateLimit(req, 'recheck', 20);
  if (limited) return limited;

  try {
    const { id } = await params;
    const { transcript = '', painScore } = await req.json().catch(() => ({}));
    const update = transcript.trim();

    const patient = update ? getPatient(id) : requestPatientRecheck(id);
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
    if (!update) {
      return NextResponse.json({ success: true, patient });
    }

    const pain = painScore ?? patient.painScore;
    const combined = `${patient.originalTranscript} ${update}`.trim();
    const analysis = await analyzeTranscriptWithGemini({
      transcript: combined,
      pulse: patient.pulse,
      breathingRate: patient.breathingRate,
      painScore: pain,
    });

    patient.auditLog.push({ at: Date.now(), who: 'patient', what: `Update from phone (pain ${pain}/10): "${update}"` });

    const updated = await addOrUpdatePatient({
      id,
      publicBase: requestBaseUrl(req),
      name: patient.name,
      age: patient.age,
      recheckRequested: true,
      recheckRequestedByNurse: patient.recheckRequestedByNurse,
      pulse: patient.pulse,
      breathingRate: patient.breathingRate,
      vitalsSkipped: patient.vitalsSkipped,
      vitalsSource: patient.vitalsSource,
      vitalsConfidence: patient.vitals ? patient.vitals.pulseConf * 100 : undefined,
      language: patient.language,
      languageCode: patient.languageCode,
      transcript: combined,
      originalTranscript: patient.originalTranscript,
      chiefComplaint: analysis.chiefComplaint,
      symptoms: analysis.symptoms,
      painScore: analysis.painScore,
      llmSuggestedLevel: analysis.llmSuggestedLevel,
    });

    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
