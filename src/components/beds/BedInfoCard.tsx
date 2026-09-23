import React from 'react';
import {
  CheckCircle2,
  Trash2,
  ClipboardList,
  Pill,
  FileText,
  FileCheck,
  AlertTriangle,
  Calendar,
  Syringe,
  Activity,
  Baby
} from 'lucide-react';
import { Bed, BedType } from '../../types/bed';
import { ClinicalAlert } from '../../types/clinical';
import { parseAndEvaluateBP, getBedBP } from '../../utils/bpAnalyzer';

interface BedInfoCardProps {
  activeBed: Bed;
  activeTab: string;
  activeAlerts: ClinicalAlert[];
  setActiveTab: (tab: string) => void;
  onUpdateBed: (updates: Partial<Bed>) => void;
  onSetBedType: (type: BedType) => void;
  onToggleReviewed: (bedId: number) => void;
  onClearBed: (bedId: number) => void;
}

export const BedInfoCard: React.FC<BedInfoCardProps> = ({
  activeBed,
  activeTab,
  activeAlerts,
  setActiveTab,
  onUpdateBed,
  onSetBedType,
  onToggleReviewed,
  onClearBed
}) => {
  const currentBP = getBedBP(activeBed);
  const bpEval = parseAndEvaluateBP(currentBP);
  const allergyVal = activeBed.alergias || activeBed.data?.alergias;
  const hasAllergy = Boolean(
    allergyVal &&
    !allergyVal.toUpperCase().includes('NEGA') &&
    !allergyVal.toUpperCase().includes('NÃO REFERE')
  );

  return (
    <div className="bg-white border-b border-slate-200 px-2.5 sm:px-6 py-2.5 sm:py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto space-y-2.5 sm:space-y-3">
        {/* Top Bed Header Details */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Bed Badge & Patient Details */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Leito Badge */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-bold shadow-xs shrink-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400">Leito</span>
              <span className="text-xs sm:text-sm tracking-tight leading-none font-extrabold">{activeBed.label}</span>
            </div>

            {/* Patient Info Column */}
            <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
              {/* Top row: Name + Age + Mobile Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={activeBed.patientName}
                  onChange={(e) => onUpdateBed({ patientName: e.target.value })}
                  placeholder="Nome da Paciente"
                  className="text-sm sm:text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none transition-all flex-1 min-w-0 truncate"
                />
                <input
                  type="text"
                  value={activeBed.age}
                  onChange={(e) => onUpdateBed({ age: e.target.value })}
                  placeholder="Idade"
                  className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 w-14 sm:w-20 text-center shrink-0"
                />

                {/* Action buttons on mobile (Revisar & Limpar) */}
                <div className="flex sm:hidden items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleReviewed(activeBed.id)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeBed.isReviewed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                    title={activeBed.isReviewed ? 'Revisado' : 'Marcar Revisado'}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${activeBed.isReviewed ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </button>
                  <button
                    onClick={() => onClearBed(activeBed.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Alta / Liberar Leito"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Paridade + PA Auto-detectada + Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs text-slate-500">
                {/* Paridade Oficial */}
                <div
                  className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 shrink-0"
                  title="História Obstétrica (Paridade Oficial)"
                >
                  <Baby className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <input
                    type="text"
                    value={activeBed.obstetricHistory || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateBed({
                        obstetricHistory: val,
                        data: { ...(activeBed.data || {}), obstetricHistory: val }
                      });
                    }}
                    placeholder="G03P03(n03 C 00)A00"
                    className="text-xs font-mono font-bold text-purple-900 bg-transparent focus:outline-none w-36 sm:w-40 uppercase"
                  />
                </div>

                {/* PA com Auto-detecção e Classificação Imediata */}
                <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                  <Activity className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="font-bold text-[11px] text-slate-700">PA:</span>
                  <input
                    type="text"
                    value={currentBP}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateBed({
                        bloodPressure: val,
                        data: { ...(activeBed.data || {}), bloodPressure: val, bpValue: val }
                      });
                    }}
                    placeholder="120x80"
                    className="w-16 sm:w-18 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-purple-500 shadow-2xs"
                  />
                  {bpEval.classification !== 'vazio' && (
                    <span
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-all ${bpEval.badgeColor}`}
                      title={bpEval.alertDesc}
                    >
                      {bpEval.badgeLabel}
                    </span>
                  )}
                </div>

                {/* Alerta de Alergia Medicamentosa */}
                {hasAllergy && (
                  <div
                    className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-bold shrink-0 animate-pulse"
                    title={`ALERTA DE SEGURANÇA: Alergia a ${allergyVal}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">Alergia: {allergyVal}</span>
                  </div>
                )}

                {/* Adm */}
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-600 text-[10px] sm:text-xs">Adm:</span>
                  <input
                    type="text"
                    value={activeBed.admissionDate}
                    onChange={(e) => onUpdateBed({ admissionDate: e.target.value })}
                    placeholder="Data"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none text-slate-700 font-medium w-16 sm:w-20 text-xs"
                  />
                </div>

                {/* AVP */}
                <div className="flex items-center gap-1 shrink-0">
                  <Syringe className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-600 text-[10px] sm:text-xs">AVP:</span>
                  <input
                    type="text"
                    value={activeBed.avpSite}
                    onChange={(e) => onUpdateBed({ avpSite: e.target.value })}
                    placeholder="Sítio"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none text-slate-700 font-medium w-14 sm:w-18 text-xs"
                  />
                </div>

                {/* Diagnóstico */}
                <div className="flex items-center gap-1 flex-1 min-w-[150px] sm:min-w-[200px]">
                  <span className="font-semibold text-slate-600 text-[10px] sm:text-xs">Diag:</span>
                  <input
                    type="text"
                    value={activeBed.diagnosis}
                    onChange={(e) => onUpdateBed({ diagnosis: e.target.value })}
                    placeholder="Diagnóstico"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none text-slate-700 font-medium flex-1 min-w-0 text-xs truncate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Type Switcher & Action Buttons on Desktop */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 lg:self-center shrink-0">
            {/* Bed Type Switcher */}
            <div className="grid grid-cols-4 sm:flex bg-slate-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl items-center gap-0.5 sm:gap-1 w-full sm:w-auto">
              <button
                onClick={() => onSetBedType('puerpera')}
                className={`text-[11px] sm:text-xs py-1 px-2 sm:px-2.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer text-center ${
                  activeBed.type === 'puerpera'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-700 hover:bg-purple-100/60'
                }`}
              >
                Puérpera
              </button>
              <button
                onClick={() => onSetBedType('gestante')}
                className={`text-[11px] sm:text-xs py-1 px-2 sm:px-2.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer text-center ${
                  activeBed.type === 'gestante'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-sky-700 hover:bg-sky-100/60'
                }`}
              >
                Gestante
              </button>
              <button
                onClick={() => onSetBedType('curetagem')}
                className={`text-[11px] sm:text-xs py-1 px-2 sm:px-2.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer text-center ${
                  activeBed.type === 'curetagem'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-100/60'
                }`}
              >
                Curetagem
              </button>
              <button
                onClick={() => onSetBedType('vago')}
                className={`text-[11px] sm:text-xs py-1 px-2 sm:px-2.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer text-center ${
                  activeBed.type === 'vago'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vago
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onToggleReviewed(activeBed.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  activeBed.isReviewed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${activeBed.isReviewed ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{activeBed.isReviewed ? 'Revisado' : 'Revisar'}</span>
              </button>

              <button
                onClick={() => onClearBed(activeBed.id)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Registrar alta ou liberar leito vago"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Alta / Limpar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Mobile: 4-Column Full-Width Segmented Bar (All 4 tabs visible simultaneously!) */}
        <div className="sm:hidden pt-1.5 border-t border-slate-100">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-2xl">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-1.5 px-0.5 rounded-xl text-center font-bold text-[10px] transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">1. Checklist</span>
            </button>

            <button
              onClick={() => setActiveTab('prescription')}
              className={`py-1.5 px-0.5 rounded-xl text-center font-bold text-[10px] transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'prescription'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">2. Prescrição</span>
            </button>

            <button
              onClick={() => setActiveTab('evolution')}
              className={`py-1.5 px-0.5 rounded-xl text-center font-bold text-[10px] transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'evolution'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">3. Evolução</span>
            </button>

            <button
              onClick={() => setActiveTab('discharge')}
              className={`py-1.5 px-0.5 rounded-xl text-center font-bold text-[10px] transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'discharge'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">4. Alta</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Desktop: Spacious Horizontal Bar */}
        <div className="hidden sm:flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>1. Checklist da Passagem</span>
          </button>

          <button
            onClick={() => setActiveTab('prescription')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'prescription'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>2. Prescrição Médica</span>
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'evolution'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Evolução Médica (evolucao.txt)</span>
          </button>

          <button
            onClick={() => setActiveTab('discharge')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'discharge'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>4. Documentos de Alta</span>
          </button>

          {activeAlerts.length > 0 && (
            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shrink-0">
              <AlertTriangle className="w-3 h-3" />
              {activeAlerts.length} Alerta{activeAlerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
