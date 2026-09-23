import React from 'react';
import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { parseAndEvaluateBP } from '../../utils/bpAnalyzer';

interface BloodPressureInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  compact?: boolean;
  showQuickChips?: boolean;
}

export const BloodPressureInput: React.FC<BloodPressureInputProps> = ({
  value,
  onChange,
  label = 'Pressão Arterial (PA):',
  compact = false,
  showQuickChips = true
}) => {
  const evaluation = parseAndEvaluateBP(value);

  const handleQuickSelect = (bp: string) => {
    onChange(bp);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="PA (ex: 120x80)"
            className="w-24 px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 shadow-2xs"
          />
        </div>
        {evaluation.classification !== 'vazio' && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md border text-center whitespace-nowrap ${evaluation.badgeColor}`}
            title={evaluation.alertDesc || evaluation.badgeLabel}
          >
            {evaluation.shortFormatted || evaluation.badgeLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-purple-600" />
          <span>{label}</span>
        </label>

        {/* Live Auto-detected Badge */}
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${evaluation.badgeColor}`}
        >
          {evaluation.badgeLabel}
        </span>
      </div>

      {/* Input Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite: 120x80, 160/111, 140 90..."
            className={`w-full px-3 py-2 text-sm font-bold rounded-xl border focus:outline-none transition-all ${
              evaluation.isHypertensiveCrisis
                ? 'bg-rose-50 border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                : evaluation.isElevated
                ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-2 focus:ring-amber-500/20'
                : 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
            }`}
          />
          {evaluation.shortFormatted && evaluation.classification !== 'invalida' && (
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
              mmHg
            </span>
          )}
        </div>

        {/* Quick PA Presets */}
        {showQuickChips && (
          <div className="flex flex-wrap items-center gap-1">
            {[
              { val: '120x80', label: '120x80 (Normal)' },
              { val: '110x70', label: '110x70' },
              { val: '130x80', label: '130x80' },
              { val: '140x90', label: '140x90 (Elevada)' },
              { val: '160x110', label: '160x110 (Grave/Zuspan)' }
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                onClick={() => handleQuickSelect(chip.val)}
                className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                  evaluation.shortFormatted === chip.val
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {chip.val}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auto-detected Alert Message */}
      {evaluation.alertDesc && (
        <div
          className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
            evaluation.isHypertensiveCrisis
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : evaluation.isElevated
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          {evaluation.isHypertensiveCrisis ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-tight">{evaluation.alertDesc}</span>
        </div>
      )}
    </div>
  );
};
