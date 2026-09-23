import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ChipColor = 'emerald' | 'purple' | 'sky' | 'amber' | 'rose' | 'teal';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  color?: ChipColor;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  active,
  onClick,
  label,
  icon: Icon,
  badge,
  color = 'teal',
  disabled = false
}) => {
  const colorClasses: Record<ChipColor, string> = {
    emerald: active
      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50',
    purple: active
      ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-200'
      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50',
    sky: active
      ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-200'
      : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50',
    amber: active
      ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50',
    rose: active
      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50',
    teal: active
      ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-200'
      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 active:scale-95 text-left cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${colorClasses[color] || colorClasses.teal}`}
    >
      {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />}
      <span>{label}</span>
      {badge && (
        <span
          className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
            active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
