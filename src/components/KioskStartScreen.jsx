'use client';

import { useState } from 'react';
import { Globe, ArrowRight, User, Baby, Users, AlertCircle, Check, RefreshCw, X, CreditCard } from 'lucide-react';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'zh', name: 'Mandarin', native: '中文' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
];

export const TRANSLATIONS = {
  en: {
    title: 'Emergency Check-In',
    subtitle: 'Scan vitals. Speak symptoms in your language.',
    selectLang: 'Select Language',
    whoTitle: 'Who is this check-in for?',
    me: 'Me (Adult)',
    meDesc: 'Self check-in',
    child: 'Child',
    childDesc: 'Under 12 years',
    someoneElse: "Someone I'm with",
    someoneElseDesc: 'Family member or friend',
    howOld: 'How old is your child?',
    paediatricNote: 'Paediatric Note: Camera scan is skipped for children under 12. A nurse will manually check vitals.',
    aboutYouTitle: 'About you',
    ageLabel: 'How old are you?',
    sexLabel: 'Sex assigned at birth (for medical care)',
    female: 'Female',
    male: 'Male',
    intersex: 'Intersex',
    preferNot: 'Prefer not to say',
    pronounsTitle: 'Pronouns (optional)',
    nameTitle: 'Your Name',
    nameSubtitle: 'First and last name',
    emergencyNotice: "Chest pain or can't breathe? Arrived by ambulance? Go straight to the desk.",
    back: 'Back',
    continue: 'Continue',
    skip: 'Skip',
    askStaff: 'Ask staff',
  },
  ar: {
    title: 'تسجيل الدخول للطوارئ',
    subtitle: 'افحص مؤشراتك الحيوية. صف أعراضك بلغتك.',
    selectLang: 'اختر اللغة / Select Language',
    whoTitle: 'لمن هذا التسجيل؟',
    me: 'أنا (شخص بالغ)',
    meDesc: 'تسجيل ذاتي',
    child: 'طفل',
    childDesc: 'أقل من ١٢ سنة',
    someoneElse: 'شخص معي',
    someoneElseDesc: 'فرد من العائلة أو صديق',
    howOld: 'كم عمر طفلك؟',
    paediatricNote: 'ملاحظة للأطفال: يتم تخطي الفحص بالكاميرا للأطفال دون سن ١٢ عاماً.',
    aboutYouTitle: 'معلومات عنك',
    ageLabel: 'كم عمرك؟',
    sexLabel: 'الجنس المحدد عند الولادة',
    female: 'أنثى',
    male: 'ذكر',
    intersex: 'ثنائي الجنس',
    preferNot: 'أفضل عدم الإجابة',
    pronounsTitle: 'الضمائر (اختياري)',
    nameTitle: 'اسمك',
    nameSubtitle: 'الاسم الأول والحرف الأول من الكنية',
    emergencyNotice: 'ألم بالصدر أو صعوبة في التنفس؟ وصلتم بسيارة إسعاف؟ توجهوا فوراً للمكتب.',
    back: 'رجوع',
    continue: 'متابعة',
    skip: 'تخطي',
    askStaff: 'اسأل الموظفين',
  },
  fr: {
    title: 'Inscription aux Urgences',
    subtitle: 'Scannez vos constantes. Décrivez vos symptômes dans votre langue.',
    selectLang: 'Choisissez votre langue',
    whoTitle: 'Pour qui est cette inscription ?',
    me: 'Moi (Adulte)',
    meDesc: 'Auto-inscription',
    child: 'Enfant',
    childDesc: 'Moins de 12 ans',
    someoneElse: 'Un proche',
    someoneElseDesc: 'Membre de la famille ou ami',
    howOld: 'Quel âge a votre enfant ?',
    paediatricNote: 'Note pédiatrique : L\'analyse caméra est ignorée pour les enfants de moins de 12 ans.',
    aboutYouTitle: 'À propos de vous',
    ageLabel: 'Quel âge avez-vous ?',
    sexLabel: 'Sexe assigné à la naissance (pour soins médicaux)',
    female: 'Femme',
    male: 'Homme',
    intersex: 'Intersexe',
    preferNot: 'Ne préfère pas répondre',
    pronounsTitle: 'Pronom (optionnel)',
    nameTitle: 'Votre nom',
    nameSubtitle: 'Prénom et initiale du nom',
    emergencyNotice: 'Douleur thoracique ou difficulté à respirer ? Arrivé en ambulance ? Allez directement au bureau.',
    back: 'Retour',
    continue: 'Continuer',
    skip: 'Passer',
    askStaff: 'Demander au personnel',
  },
  es: {
    title: 'Registro de Emergencias',
    subtitle: 'Escanee sus signos vitales. Describa sus síntomas en su idioma.',
    selectLang: 'Seleccione su idioma',
    whoTitle: '¿Para quién es este registro?',
    me: 'Yo (Adulto)',
    meDesc: 'Registro personal',
    child: 'Niño/a',
    childDesc: 'Menor de 12 años',
    someoneElse: 'Alguien que me acompaña',
    someoneElseDesc: 'Familiar o amigo',
    howOld: '¿Cuántos años tiene su hijo/a?',
    paediatricNote: 'Nota pediátrica: Se omite el escaneo por cámara para menores de 12 años.',
    aboutYouTitle: 'Acerca de usted',
    ageLabel: '¿Cuántos años tiene?',
    sexLabel: 'Sexo asignado al nacer (para atención médica)',
    female: 'Mujer',
    male: 'Hombre',
    intersex: 'Intersexual',
    preferNot: 'Prefiero no decir',
    pronounsTitle: 'Pronombres (opcional)',
    nameTitle: 'Su nombre',
    nameSubtitle: 'Nombre e inicial del apellido',
    emergencyNotice: '¿Dolor de pecho o dificultad para respirar? ¿Llegó en ambulancia? Vaya directamente al mostrador.',
    back: 'Volver',
    continue: 'Continuar',
    skip: 'Omitir',
    askStaff: 'Pedir ayuda al personal',
  },
  pa: {
    title: 'ਐਮਰਜੈਂਸੀ ਚੈੱਕ-ਇਨ',
    subtitle: 'ਆਪਣੇ ਲੱਛਣ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ।',
    selectLang: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    whoTitle: 'ਇਹ ਚੈੱਕ-ਇਨ ਕਿਸ ਲਈ ਹੈ?',
    me: 'ਮੈਂ (ਬਾਲਗ)',
    meDesc: 'ਖੁਦ ਚੈੱਕ-ਇਨ',
    child: 'ਬੱਚਾ',
    childDesc: '12 ਸਾਲ ਤੋਂ ਘੱਟ',
    someoneElse: 'ਮੇਰੇ ਨਾਲ ਕੋਈ',
    someoneElseDesc: 'ਪਰਿਵਾਰ ਦਾ ਮੈਂਬਰ ਜਾਂ ਦੋਸਤ',
    howOld: 'ਤੁਹਾਡੇ ਬੱਚੇ ਦੀ ਉਮਰ ਕਿੰਨੀ ਹੈ?',
    paediatricNote: 'ਨੋਟ: 12 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਦੇ ਬੱਚਿਆਂ ਲਈ ਕੈਮਰਾ ਸਕੈਨ ਨਹੀਂ ਹੁੰਦਾ।',
    aboutYouTitle: 'ਤੁਹਾਡੇ ਬਾਰੇ',
    ageLabel: 'ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ?',
    sexLabel: 'ਜਨਮ ਸਮੇਂ ਨਿਰਧਾਰਤ ਲਿੰਗ',
    female: 'ਔਰਤ',
    male: 'ਮਰਦ',
    intersex: 'ਇੰਟਰਸੈਕਸ',
    preferNot: 'ਦੱਸਣਾ ਨਹੀਂ ਚਾਹੁੰਦੇ',
    pronounsTitle: 'ਪੜਨਾਂਵ (ਮਨਚਾਹਾ)',
    nameTitle: 'ਤੁਹਾਡਾ ਨਾਮ',
    nameSubtitle: 'ਪਹਿਲਾ ਨਾਮ ਅਤੇ ਆਖਰੀ ਅੱਖਰ',
    emergencyNotice: 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼? ਐਂਬੂਲੈਂਸ ਨਾਲ ਆਏ ਹੋ? ਸਿੱਧਾ ਡੈਸਕ ਤੇ ਜਾਓ।',
    back: 'ਵਾਪਸ',
    continue: 'ਅੱਗੇ ਵਧੋ',
    skip: 'ਛੱਡੋ',
    askStaff: 'ਸਟਾਫ਼ ਤੋਂ ਪੁੱਛੋ',
  },
  zh: {
    title: '急诊登记',
    subtitle: '扫描体征。用您的母语描述症状。',
    selectLang: '选择语言',
    whoTitle: '本次登记对象是谁？',
    me: '本人 (成人)',
    meDesc: '自行登记',
    child: '儿童',
    childDesc: '12 岁以下',
    someoneElse: '同行人员',
    someoneElseDesc: '家属或朋友',
    howOld: '您的孩子多大？',
    paediatricNote: '儿科说明：12岁以下儿童跳过摄像头扫描。',
    aboutYouTitle: '关于您',
    ageLabel: '您的年龄是多少？',
    sexLabel: '出生生理性别 (供医疗参考)',
    female: '女',
    male: '男',
    intersex: '双性',
    preferNot: '保密',
    pronounsTitle: '代词 (选填)',
    nameTitle: '您的姓名',
    nameSubtitle: '名字及姓氏首字母',
    emergencyNotice: '胸痛或呼吸困难？乘坐救护车到达？请直接前往服务台。',
    back: '返回',
    continue: '继续',
    skip: '跳过',
    askStaff: '寻求工作人员帮助',
  },
  ru: {
    title: 'Экстренная Регистрация',
    subtitle: 'Опишите ваши симптомы на вашем языке.',
    selectLang: 'Выберите язык',
    whoTitle: 'Для кого эта регистрация?',
    me: 'Я (Взрослый)',
    meDesc: 'Саморегистрация',
    child: 'Ребенок',
    childDesc: 'До 12 лет',
    someoneElse: 'Кто-то со мной',
    someoneElseDesc: 'Член семьи или друг',
    howOld: 'Сколько лет вашему ребенку?',
    paediatricNote: 'Детская заметка: Сканирование камерой пропускается для детей до 12 лет.',
    aboutYouTitle: 'О вас',
    ageLabel: 'Сколько вам лет?',
    sexLabel: 'Пол при рождении',
    female: 'Женский',
    male: 'Мужской',
    intersex: 'Интерсекс',
    preferNot: 'Предпочитаю не говорить',
    pronounsTitle: 'Местоимения (необязательно)',
    nameTitle: 'Ваше имя',
    nameSubtitle: 'Имя и первая буква фамилии',
    emergencyNotice: 'Боль в груди или одышка? Приехали на скорой? Идите прямо к стойке.',
    back: 'Назад',
    continue: 'Продолжить',
    skip: 'Пропустить',
    askStaff: 'Спросить персонал',
  },
};

const ABOUT_YOU_STEPS = ['step_age', 'step_sex', 'step_pronouns', 'step_name'];

export default function KioskStartScreen({ selectedLang, onSelectLang, onStartCheckin, onReCheckByTicket }) {
  // select_who -> (child_age | step_age) -> step_sex -> step_pronouns -> step_name
  const [whoStep, setWhoStep] = useState('select_who');
  const [whoType, setWhoType] = useState('self');
  const [ageValue, setAgeValue] = useState(45);
  const [ageUnit, setAgeUnit] = useState('years');
  const [sexValue, setSexValue] = useState('M');
  const [pronounsValue, setPronounsValue] = useState('he/him');
  const [patientNameInput, setPatientNameInput] = useState('');
  const [preferTyping, setPreferTyping] = useState(false);
  const [needsInterpreter, setNeedsInterpreter] = useState(false);
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [isScanningCard, setIsScanningCard] = useState(false);

  const langCode = selectedLang?.code || 'en';
  const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;
  const isRtl = langCode === 'ar';

  const handleSelectWho = (type) => {
    setWhoType(type);
    if (type === 'child') {
      setAgeValue(5);
      setWhoStep('child_age');
    } else {
      setAgeValue(45);
      setWhoStep('step_age');
    }
  };

  const handleFinalSubmit = () => {
    const months = ageUnit === 'years' ? Number(ageValue) * 12 : Number(ageValue);
    const vitalsSkipped = months < 144;

    const formattedAge = whoType === 'child'
      ? (months < 24 ? `${months}m` : `${Math.floor(months / 12)}`)
      : `${ageValue}`;

    onStartCheckin({
      who: whoType === 'child' ? 'child' : (whoType === 'someone_else' ? 'assisted' : 'self'),
      name: patientNameInput.trim() || null,
      ageMonths: months,
      age: formattedAge,
      sex: sexValue,
      pronouns: pronounsValue,
      preferTyping,
      needsInterpreter,
      callVisually: needsInterpreter,
      vitalsSkipped,
    });
  };

  const stepNum = ABOUT_YOU_STEPS.indexOf(whoStep) + 1;

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-10rem)] p-4 text-center max-w-3xl mx-auto w-full bg-white text-black transition-all space-y-5 font-sans">
      <div className="space-y-2 pt-2">
        <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight leading-none uppercase">
          {t.title}
        </h1>

        <p className="text-zinc-700 text-lg md:text-xl font-bold max-w-xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      <div className="w-full max-w-xl bg-amber-50/70 text-amber-950 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs md:text-sm font-semibold border border-amber-200/50">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <span>{t.emergencyNotice}</span>
      </div>

      <div className="w-full max-w-xl space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center justify-center gap-1.5">
          <Globe className="w-4 h-4 text-black" />
          <span>{t.selectLang}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onSelectLang(lang)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-black text-white border-black font-extrabold shadow-md scale-105'
                    : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <span className="font-extrabold text-xs leading-tight">{lang.native}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-xl bg-zinc-50/90 border-2 border-zinc-300 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-xs">
        {stepNum > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-zinc-600 uppercase tracking-wider">
              <span>{t.aboutYouTitle}</span>
              <span>Step {stepNum} of {ABOUT_YOU_STEPS.length}</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300 ease-out"
                style={{ width: `${(stepNum / ABOUT_YOU_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {whoStep === 'select_who' && (
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-black text-black text-center">
              {t.whoTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleSelectWho('self')}
                className="p-6 rounded-2xl bg-white hover:bg-zinc-900 hover:text-white border-2 border-zinc-200 hover:border-zinc-900 text-black font-extrabold text-lg flex flex-col items-center justify-center gap-2 transition-all shadow-xs group"
              >
                <User className="w-9 h-9 text-zinc-800 group-hover:text-white transition-colors" />
                <span className="leading-tight">{t.me}</span>
                <span className="text-xs opacity-75 font-normal">{t.meDesc}</span>
              </button>

              <button
                onClick={() => handleSelectWho('child')}
                className="p-6 rounded-2xl bg-white hover:bg-zinc-900 hover:text-white border-2 border-zinc-200 hover:border-zinc-900 text-black font-extrabold text-lg flex flex-col items-center justify-center gap-2 transition-all shadow-xs group"
              >
                <Baby className="w-9 h-9 text-zinc-800 group-hover:text-white transition-colors" />
                <span className="leading-tight">{t.child}</span>
                <span className="text-xs opacity-75 font-normal">{t.childDesc}</span>
              </button>

              <button
                onClick={() => handleSelectWho('someone_else')}
                className="p-6 rounded-2xl bg-white hover:bg-zinc-900 hover:text-white border-2 border-zinc-200 hover:border-zinc-900 text-black font-extrabold text-lg flex flex-col items-center justify-center gap-2 transition-all shadow-xs group"
              >
                <Users className="w-9 h-9 text-zinc-800 group-hover:text-white transition-colors" />
                <span className="leading-tight">{t.someoneElse}</span>
                <span className="text-xs opacity-75 font-normal">{t.someoneElseDesc}</span>
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreferTyping(!preferTyping)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    preferTyping
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  {preferTyping ? "✓ Prefer Typing" : "I'd rather type"}
                </button>
                <button
                  type="button"
                  onClick={() => setNeedsInterpreter(!needsInterpreter)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    needsInterpreter
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  {needsInterpreter ? "✓ Sign Language Interpreter Requested" : "I need a sign language interpreter"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowRecheckModal(true)}
                className="w-full p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Already checked in and feeling worse?</span>
              </button>
            </div>
          </div>
        )}

        {whoStep === 'child_age' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-black text-black">{t.howOld}</h2>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.max(0, Number(prev) - 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                –
              </button>
              <input
                type="number"
                min="0"
                max="144"
                value={ageValue}
                onChange={(e) => setAgeValue(e.target.value)}
                className="w-28 p-4 bg-white text-black font-sans text-3xl font-black rounded-2xl border-2 border-zinc-300 text-center focus:outline-none focus:border-black shadow-xs"
              />
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.min(144, Number(prev) + 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                +
              </button>

              <select
                value={ageUnit}
                onChange={(e) => setAgeUnit(e.target.value)}
                className="p-4 bg-white text-black text-lg font-bold rounded-2xl border-2 border-zinc-300 focus:outline-none shadow-xs"
              >
                <option value="years">years</option>
                <option value="months">months</option>
              </select>
            </div>

            <p className="text-xs text-zinc-800 bg-zinc-200/70 p-3.5 rounded-2xl border border-zinc-300 font-bold">
              {t.paediatricNote}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setWhoStep('select_who')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={() => setWhoStep('step_sex')}
                className="flex-1 py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_age' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-black">{t.ageLabel}</h2>

            <div className="flex items-center justify-center gap-3 my-4">
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.max(0, Number(prev) - 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                –
              </button>
              <input
                type="number"
                min="0"
                max="120"
                value={ageValue}
                onChange={(e) => setAgeValue(e.target.value)}
                className="w-32 p-4 bg-white text-black font-sans text-3xl font-black rounded-2xl border-2 border-zinc-300 text-center focus:outline-none focus:border-black shadow-xs"
              />
              <button
                type="button"
                onClick={() => setAgeValue((prev) => Math.min(120, Number(prev) + 1))}
                className="w-14 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-black font-extrabold text-3xl flex items-center justify-center border border-zinc-300 transition-colors shrink-0"
              >
                +
              </button>
              <span className="text-lg font-bold text-zinc-700">years</span>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setWhoStep('select_who')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={() => setWhoStep('step_sex')}
                className="flex-1 py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_sex' && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl md:text-2xl font-black text-black leading-tight">
              {t.sexLabel}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: 'F', label: t.female },
                { code: 'M', label: t.male },
                { code: 'I', label: t.intersex },
                { code: 'NS', label: t.preferNot },
              ].map((s) => {
                const isSelected = sexValue === s.code;
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => {
                      setSexValue(s.code);
                      setWhoStep('step_pronouns');
                    }}
                    className={`p-5 rounded-2xl font-extrabold text-base border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-zinc-900 border-zinc-200 hover:border-black'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-zinc-500 font-medium italic pt-1 text-left">
              Why we ask: Sex assigned at birth helps evaluate organ-specific risk and lab reference ranges.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setWhoStep('step_age')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={() => setWhoStep('step_pronouns')}
                className="flex-1 py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_pronouns' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-black text-black">{t.pronounsTitle}</h2>

            <div className="grid grid-cols-2 gap-3">
              {['he/him', 'she/her', 'they/them', 'other'].map((p) => {
                const isSelected = pronounsValue === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPronounsValue(p);
                      setWhoStep('step_name');
                    }}
                    className={`p-4 rounded-2xl font-extrabold text-base border-2 transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:border-black'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setWhoStep('step_sex')}
                className="py-4 px-5 rounded-2xl bg-zinc-200 border border-zinc-300 text-black text-base font-bold hover:bg-zinc-300 transition-colors"
              >
                {t.back}
              </button>

              <button
                onClick={() => setWhoStep('step_name')}
                className="py-2 px-4 text-xs font-bold text-zinc-600 hover:text-black underline"
              >
                Skip pronouns
              </button>

              <button
                onClick={() => setWhoStep('step_name')}
                className="py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {whoStep === 'step_name' && (
          <div className="space-y-5 text-center">
            <div>
              <h2 className="text-2xl font-black text-black">{t.nameTitle}</h2>
              <p className="text-xs font-bold text-zinc-600">Scan your health card or fill in your name to continue.</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsScanningCard(true);
                  setTimeout(() => {
                    setPatientNameInput('Maria K.');
                    setIsScanningCard(false);
                  }, 600);
                }}
                disabled={isScanningCard}
                className="w-full p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-300 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xs"
              >
                {isScanningCard ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-black animate-spin" />
                    <span>Scanning Health Card...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 text-black" />
                    <span>Scan Health / Insurance Card</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-extrabold text-zinc-400 uppercase tracking-wider my-1">
              <div className="flex-1 h-px bg-zinc-300" />
              <span>or type manually</span>
              <div className="flex-1 h-px bg-zinc-300" />
            </div>

            <input
              type="text"
              value={patientNameInput}
              onChange={(e) => setPatientNameInput(e.target.value)}
              placeholder="First and last name"
              className="w-full p-4 bg-white text-black font-sans text-lg font-bold rounded-2xl border-2 border-zinc-300 focus:outline-none focus:border-black shadow-xs text-center"
            />

            <div className="space-y-3 pt-1">
              <button
                onClick={() => {
                  if (patientNameInput.trim()) {
                    handleFinalSubmit();
                  }
                }}
                disabled={!patientNameInput.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t.continue}</span>
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={() => setWhoStep('step_pronouns')}
                  className="text-xs font-bold text-zinc-600 hover:text-black underline"
                >
                  {t.back}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRecheckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-zinc-200 text-left relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowRecheckModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Re-Check Symptoms</span>
              </div>
              <h3 className="text-2xl font-black text-black">Already checked in?</h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Enter your ticket number (e.g. A-17) printed on your check-in card to rescan your vitals and report new symptoms.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="A-17"
                className="w-full p-4 bg-zinc-50 text-black font-sans text-3xl font-black rounded-2xl border-2 border-zinc-300 text-center uppercase tracking-widest focus:outline-none focus:border-black shadow-xs"
              />

              <button
                type="button"
                onClick={() => {
                  if (ticketInput.trim() && onReCheckByTicket) {
                    setShowRecheckModal(false);
                    onReCheckByTicket(ticketInput.trim());
                  }
                }}
                disabled={!ticketInput.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Rescan Symptoms</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
