import Link from 'next/link';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import MedicalAnimationFigure from '@/components/MedicalAnimationFigure';
import Logo from '@/components/Logo';
import { Camera, Globe, ShieldCheck, Activity, Monitor } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      <nav className="px-6 py-4 bg-white sticky top-0 z-40 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/kiosk"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black font-extrabold text-sm transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-black" />
              <span>Kiosk</span>
            </Link>

            <Link
              href="/nurse"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black font-extrabold text-sm transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-black" />
              <span>Nurse station</span>
            </Link>

            <Link
              href="/board"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black font-extrabold text-sm transition-all flex items-center gap-2"
            >
              <Monitor className="w-4 h-4 text-black" />
              <span>Waiting room</span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-10 md:py-14 px-6 max-w-7xl mx-auto w-full bg-white text-black">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-black tracking-tight leading-tight">
              See every patient <br />
              before they <br />
              <span className="text-blue-600">
                reach the desk.
              </span>
            </h1>

            <p className="text-base md:text-xl text-zinc-700 max-w-2xl leading-relaxed font-medium">
              VoxVital replaces long, uncertain ER waits with a camera-based vitals scan,
              multilingual voice interaction, and safe, rule-based priority.
            </p>

            <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <span className="font-mono text-2xl md:text-3xl font-black text-black block">30s</span>
                <span className="text-xs text-zinc-600 font-bold leading-snug block">camera scan</span>
              </div>
              <div>
                <span className="font-mono text-2xl md:text-3xl font-black text-blue-600 block">7</span>
                <span className="text-xs text-zinc-600 font-bold leading-snug block">languages</span>
              </div>
              <div>
                <span className="font-mono text-2xl md:text-3xl font-black text-black block">100%</span>
                <span className="text-xs text-zinc-600 font-bold leading-snug block">nurse confirmed</span>
              </div>
              <div>
                <span className="font-mono text-2xl md:text-3xl font-black text-blue-600 block">0</span>
                <span className="text-xs text-zinc-600 font-bold leading-snug block">data saved to disk</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center">
            <MedicalAnimationFigure />
          </div>
        </div>
      </section>

      <section className="py-14 px-6 bg-zinc-50 border-y border-zinc-200 text-black">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-black">How VoxVital Works</h2>
            <p className="text-zinc-600 text-base max-w-xl mx-auto font-medium">
              Camera readings plus clear medical rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-zinc-300 space-y-4">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-black">1. Touchless camera vitals</h3>
              <p className="text-zinc-700 text-sm leading-relaxed font-medium">
                Measures pulse rate and breathing rate from a 30-second camera scan by detecting tiny colour changes in the face, using Presage. No physical touching required.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-300 space-y-4">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-black">2. Voice in any language</h3>
              <p className="text-zinc-700 text-sm leading-relaxed font-medium">
                Patients describe symptoms in English, French, Spanish, Arabic, Punjabi, Mandarin, or Russian using Web Speech API. Gemini 3.8 Flash structures the record; ElevenLabs speaks back in their language.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-300 space-y-4">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-black">3. Safety rules first</h3>
              <p className="text-zinc-700 text-sm leading-relaxed font-medium">
                CTAS rules set red flags and minimum priority levels. The AI can only raise priority, never lower it. The nurse retains final authority.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 max-w-7xl mx-auto w-full space-y-8 bg-white text-black border-t border-zinc-200">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-black">VoxVital Architecture</h2>
          <p className="text-zinc-600 text-base font-medium">Runs on one laptop. Patient data stays in memory and is never saved to disk.</p>
        </div>

        <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-6 md:p-8 text-black space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 text-left">
            <div className="bg-white border border-zinc-300 p-5 rounded-xl space-y-3 flex-1 w-full flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="w-7 h-7 rounded-full bg-black text-white font-extrabold flex items-center justify-center text-xs shrink-0">1</div>
                <h4 className="font-black text-sm text-black">Input & camera scan</h4>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">Presage camera vitals + Web Speech API recognition.</p>
            </div>

            <div className="hidden lg:flex items-center justify-center text-zinc-400 font-bold text-xl shrink-0 self-center">→</div>

            <div className="bg-white border border-zinc-300 p-5 rounded-xl space-y-3 flex-1 w-full flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="w-7 h-7 rounded-full bg-black text-white font-extrabold flex items-center justify-center text-xs shrink-0">2</div>
                <h4 className="font-black text-sm text-black">Gemini 3.8 Flash</h4>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">Translates to English & extracts symptoms and timing.</p>
            </div>

            <div className="hidden lg:flex items-center justify-center text-zinc-400 font-bold text-xl shrink-0 self-center">→</div>

            <div className="bg-white border border-zinc-300 p-5 rounded-xl space-y-3 flex-1 w-full flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="w-7 h-7 rounded-full bg-black text-white font-extrabold flex items-center justify-center text-xs shrink-0">3</div>
                <h4 className="font-black text-sm text-black">Safety rules first</h4>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">CTAS rules enforce minimum priority level and flags.</p>
            </div>

            <div className="hidden lg:flex items-center justify-center text-zinc-400 font-bold text-xl shrink-0 self-center">→</div>

            <div className="bg-white border border-zinc-300 p-5 rounded-xl space-y-3 flex-1 w-full flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="w-7 h-7 rounded-full bg-black text-white font-extrabold flex items-center justify-center text-xs shrink-0">4</div>
                <h4 className="font-black text-sm text-black">Live updates & nurse station</h4>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">Updates the nurse screen instantly and speaks replies to the patient (ElevenLabs).</p>
            </div>
          </div>
        </div>
      </section>

      <DisclaimerBanner />
    </div>
  );
}
