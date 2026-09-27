import { Triangle } from 'lucide-react';

const SIZES = {
  sm: { circle: 'w-9 h-9', icon: 'w-4 h-4', text: 'text-xl' },
  md: { circle: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-2xl' },
  lg: { circle: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-3xl' },
};

export default function Logo({ size = 'md' }) {
  const s = SIZES[size];
  return (
    <span className="flex items-center gap-3">
      <span className={`${s.circle} bg-black rounded-full flex items-center justify-center shrink-0`}>
        <Triangle className={`${s.icon} fill-white text-white`} />
      </span>
      <span className={`font-extrabold ${s.text} tracking-tight text-black`}>
        Vox<span className="text-blue-600">Vital</span>
      </span>
    </span>
  );
}
