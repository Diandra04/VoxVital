import { NextResponse } from 'next/server';
import { getAllPatientsSorted, calculateQueueRank } from '@/lib/store';

const UI_STRINGS = {
  en: {
    title: "You're checked in",
    ahead: 'people ahead of you',
    nurseWillCall: 'A triage nurse will call your name shortly',
    feelingWorse: 'Feeling worse? Tap here to notify nurse',
    notified: 'Nurse notified of worsening condition',
  },
  fr: {
    title: 'Vous êtes enregistré',
    ahead: 'personnes avant vous',
    nurseWillCall: 'Un infirmier va vous appeler sous peu',
    feelingWorse: 'Vous vous sentez plus mal ? Appuyez ici',
    notified: 'Infirmier prévenu de votre état',
  },
  es: {
    title: '¡Registro completado!',
    ahead: 'personas delante de usted',
    nurseWillCall: 'Una enfermera le llamará pronto',
    feelingWorse: '¿Se siente peor? Toque aquí',
    notified: 'Enfermera notificada',
  },
  ar: {
    title: 'تم تسجيلك بنجاح',
    ahead: 'أشخاص قبلك في الانتظار',
    nurseWillCall: 'سوف ينادي ممرض الفحص اسمك قريباً',
    feelingWorse: 'هل تشعر بسوء؟ اضغط هنا',
    notified: 'تم إبلاغ الممرض',
  },
  pa: {
    title: 'ਤੁਸੀਂ ਚੈੱਕ-ਇਨ ਹੋ ਗਏ ਹੋ',
    ahead: 'ਤੁਹਾਡੇ ਤੋਂ ਅੱਗੇ ਲੋਕ',
    nurseWillCall: 'ਨਰਸ ਜਲਦੀ ਹੀ ਤੁਹਾਡਾ ਨਾਮ ਬੁਲਾਏਗੀ',
    feelingWorse: 'ਹੋਰ ਖਰਾਬ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ? ਇੱਥੇ ਟੈਪ ਕਰੋ',
    notified: 'ਨਰਸ ਨੂੰ ਸੂਚਿਤ ਕੀਤਾ ਗਿਆ',
  },
  zh: {
    title: '您已成功登记',
    ahead: '人排在您前面',
    nurseWillCall: '分诊护士很快会叫您的名字',
    feelingWorse: '感到病情加重？点击此处',
    notified: '已通知护士',
  },
};

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const all = getAllPatientsSorted();
    const patient = all.find((p) => p.id === id);

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient record not found' }, { status: 404 });
    }

    const rank = calculateQueueRank(id);
    const langCode = patient.languageCode || 'en';
    const ui = UI_STRINGS[langCode] || UI_STRINGS.en;

    return NextResponse.json({
      success: true,
      patientId: id,
      name: patient.name,
      status: patient.status,
      suggestedLevel: patient.suggestedLevel,
      ahead: rank,
      recheckRequested: !!patient.recheckRequested,
      recheckRequestedByNurse: !!patient.recheckRequestedByNurse,
      languageCode: langCode,
      ui,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
