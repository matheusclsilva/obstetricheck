import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  badge?: string;
  children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon: Icon,
  color = 'text-teal-700',
  bg = 'bg-teal-50',
  badge,
  children
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs mb-2.5 sm:mb-3 transition-all hover:border-slate-300">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
          </div>
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight">{title}</h3>
        </div>
        {badge && (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded-md">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};
