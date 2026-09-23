import React, { useEffect, useState } from 'react';
import { Baby, Minus, Plus, Sparkles } from 'lucide-react';
import {
  formatObstetricHistory,
  parseObstetricHistory,
  OBSTETRIC_PRESETS
} from '../../utils/obstetricHistory';

interface ObstetricHistoryInputProps {
  value?: string;
  onChange: (formattedStr: string) => void;
  label?: string;
}

export const ObstetricHistoryInput: React.FC<ObstetricHistoryInputProps> = ({
  value,
  onChange,
  label = 'História Obstétrica (Paridade)'
}) => {
  const parsed = parseObstetricHistory(value);
  const [g, setG] = useState(parsed.g);
  const [n, setN] = useState(parsed.n);
  const [c, setC] = useState(parsed.c);
  const [a, setA] = useState(parsed.a);
  const [customText, setCustomText] = useState(value || parsed.formatted);

  useEffect(() => {
    if (value) {
      const p = parseObstetricHistory(value);
      setG(p.g);
      setN(p.n);
      setC(p.c);
      setA(p.a);
      setCustomText(value);
    }
  }, [value]);

  const updateNumbers = (newG: number, newN: number, newC: number, newA: number) => {
    const safeG = Math.max(1, newG);
    const safeN = Math.max(0, newN);
    const safeC = Math.max(0, newC);
    const safeA = Math.max(0, newA);

    setG(safeG);
    setN(safeN);
    setC(safeC);
    setA(safeA);

    const formatted = formatObstetricHistory(safeG, safeN, safeC, safeA);
    setCustomText(formatted);
    onChange(formatted);
  };

  const handlePreset = (presetStr: string) => {
    const p = parseObstetricHistory(presetStr);
    setG(p.g);
    setN(p.n);
    setC(p.c);
    setA(p.a);
    setCustomText(presetStr);
    onChange(presetStr);
  };

  const handleTextChange = (txt: string) => {
    setCustomText(txt);
    onChange(txt);
    const p = parseObstetricHistory(txt);
    if (p) {
      setG(p.g);
      setN(p.n);
      setC(p.c);
      setA(p.a);
    }
  };

  const pTotal = n + c;

  return (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Baby className="w-3.5 h-3.5 text-purple-600" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-slate-400 font-medium">
          Padrão: G03P03(n03 C 00)A00
        </span>
      </div>

      {/* Main String Input & Quick Preview */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Ex: G03P03(n03 C 00)A00"
          className="flex-1 font-mono text-sm font-bold bg-white text-purple-900 border border-purple-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase"
        />
      </div>

      {/* Steppers: G, n, C, A */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
        {/* Gestações */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase">G (Gestações)</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => updateNumbers(g - 1, n, c, a)}
              disabled={g <= 1}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-sm text-slate-800 w-6 text-center">{g}</span>
            <button
              type="button"
              onClick={() => updateNumbers(g + 1, n, c, a)}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Partos Normais (n) */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase">n (Normais)</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => updateNumbers(g, n - 1, c, a)}
              disabled={n <= 0}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-sm text-slate-800 w-6 text-center">{n}</span>
            <button
              type="button"
              onClick={() => updateNumbers(Math.max(g, n + 1 + c), n + 1, c, a)}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Cesáreas (C) */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase">C (Cesáreas)</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => updateNumbers(g, n, c - 1, a)}
              disabled={c <= 0}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-sm text-slate-800 w-6 text-center">{c}</span>
            <button
              type="button"
              onClick={() => updateNumbers(Math.max(g, n + c + 1), n, c + 1, a)}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Abortos (A) */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase">A (Abortos)</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => updateNumbers(g, n, c, a - 1)}
              disabled={a <= 0}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-sm text-slate-800 w-6 text-center">{a}</span>
            <button
              type="button"
              onClick={() => updateNumbers(Math.max(g, n + c + a + 1), n, c, a + 1)}
              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-600" />
          Modelos Rápidos:
        </span>
        <div className="flex flex-wrap gap-1">
          {OBSTETRIC_PRESETS.map((p) => (
            <button
              key={p.str}
              type="button"
              onClick={() => handlePreset(p.str)}
              className={`text-[9px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                customText.replace(/\s+/g, '') === p.str.replace(/\s+/g, '')
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
