import React from 'react';
import {
  ShieldAlert,
  HeartPulse,
  Pill,
  MessageSquarePlus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Bed } from '../../types/bed';
import { SectionCard } from '../common/SectionCard';
import { Chip } from '../common/Chip';

interface ClinicalHistoryChecklistSectionProps {
  data: any;
  bed: Bed;
  onUpdateField: (key: string, value: any) => void;
  onUpdateBed?: (updates: Partial<Bed>) => void;
}

const COMMON_ALLERGIES = [
  'Dipirona',
  'Penicilina / Amoxicilina',
  'AINEs (Ibuprofeno/Cetoprofeno)',
  'Sulfas',
  'Cefalosporinas',
  'Contraste Iodado'
];

const COMMON_COMORBIDITIES = [
  'HAS Crônica',
  'DMG (Diabetes Gestacional)',
  'DM Prévia (Tipo 1/2)',
  'Hipotireoidismo',
  'Obesidade',
  'Asma',
  'Anemia',
  'Trombofilia',
  'Cardiopatia',
  'Epilepsia'
];

const COMMON_MUC = [
  'Metildopa',
  'Levotiroxina',
  'Insulina',
  'AAS (Aspirina)',
  'Sulfato Ferroso',
  'Ácido Fólico',
  'Carbonato de Cálcio',
  'Polivitamínico'
];

const COMMON_COMPLAINTS = [
  'Cefaleia',
  'Dor em FO / Períneo',
  'Cólicas puerperais',
  'Náuseas / Vômitos',
  'Disúria (dor ao urinar)',
  'Constipação intestinal',
  'Dor mamilar / pega difícil',
  'Tontura / Mal-estar',
  'Dor lombar'
];

export const ClinicalHistoryChecklistSection: React.FC<ClinicalHistoryChecklistSectionProps> = ({
  data,
  bed,
  onUpdateField,
  onUpdateBed
}) => {
  // Obter valores com fallback entre data e bed
  const currentAlergia = data?.alergias || bed.alergias || 'NEGA';
  const hasAllergy = Boolean(
    currentAlergia &&
    !currentAlergia.toUpperCase().includes('NEGA') &&
    !currentAlergia.toUpperCase().includes('NÃO REFERE')
  );

  const currentComorbidades = data?.comorbidades || bed.comorbidades || 'NEGA';
  const currentMuc = data?.muc || bed.muc || 'NEGA';
  const currentQueixas = data?.queixasAdicionais || bed.queixasAdicionais || '';

  const syncUpdate = (key: string, value: any) => {
    onUpdateField(key, value);
    if (onUpdateBed) {
      onUpdateBed({ [key]: value });
    }
  };

  const handleSetAlergiaStatus = (status: 'nao' | 'sim') => {
    if (status === 'nao') {
      syncUpdate('alergias', 'NEGA');
      syncUpdate('alergiaStatus', 'nao');
    } else {
      syncUpdate('alergiaStatus', 'sim');
      if (!hasAllergy) {
        syncUpdate('alergias', 'DIPIRONA');
      }
    }
  };

  const handleToggleAllergyTag = (drug: string) => {
    if (!hasAllergy || currentAlergia === 'NEGA') {
      syncUpdate('alergias', drug);
      syncUpdate('alergiaStatus', 'sim');
      return;
    }

    const items = currentAlergia
      .replace(/^ALERGIA:\s*/i, '')
      .split(/[,;/+]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    const exists = items.some((item: string) => item.toLowerCase() === drug.toLowerCase());
    let newItems: string[];
    if (exists) {
      newItems = items.filter((item: string) => item.toLowerCase() !== drug.toLowerCase());
    } else {
      newItems = [...items, drug];
    }

    if (newItems.length === 0) {
      syncUpdate('alergias', 'NEGA');
      syncUpdate('alergiaStatus', 'nao');
    } else {
      syncUpdate('alergias', newItems.join(', '));
      syncUpdate('alergiaStatus', 'sim');
    }
  };

  const handleToggleComorbidityTag = (item: string) => {
    if (currentComorbidades === 'NEGA' || !currentComorbidades) {
      syncUpdate('comorbidades', item);
      return;
    }

    const items = currentComorbidades
      .split(/[,;/+]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    const exists = items.some((x: string) => x.toLowerCase() === item.toLowerCase());
    let newItems: string[];
    if (exists) {
      newItems = items.filter((x: string) => x.toLowerCase() !== item.toLowerCase());
    } else {
      newItems = [...items, item];
    }

    syncUpdate('comorbidades', newItems.length === 0 ? 'NEGA' : newItems.join(', '));
  };

  const handleToggleMucTag = (med: string) => {
    if (currentMuc === 'NEGA' || !currentMuc) {
      syncUpdate('muc', med);
      return;
    }

    const items = currentMuc
      .split(/[,;/+]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    const exists = items.some((x: string) => x.toLowerCase() === med.toLowerCase());
    let newItems: string[];
    if (exists) {
      newItems = items.filter((x: string) => x.toLowerCase() !== med.toLowerCase());
    } else {
      newItems = [...items, med];
    }

    syncUpdate('muc', newItems.length === 0 ? 'NEGA' : newItems.join(', '));
  };

  const handleToggleComplaintTag = (symptom: string) => {
    if (!currentQueixas || currentQueixas.toUpperCase().includes('NEGA QUEIXAS')) {
      syncUpdate('queixasAdicionais', symptom);
      return;
    }

    const items = currentQueixas
      .split(/[,;/+]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    const exists = items.some((x: string) => x.toLowerCase() === symptom.toLowerCase());
    let newItems: string[];
    if (exists) {
      newItems = items.filter((x: string) => x.toLowerCase() !== symptom.toLowerCase());
    } else {
      newItems = [...items, symptom];
    }

    syncUpdate('queixasAdicionais', newItems.join(', '));
  };

  return (
    <SectionCard
      title="Histórico Clínico, Alergias & Queixas Atuais"
      icon={ShieldAlert}
      color="text-rose-700"
      bg="bg-rose-50"
    >
      <div className="space-y-4">
        {/* 1. ALERGIA A MEDICAMENTOS (Prioridade Máxima de Segurança) */}
        <div className={`p-3 rounded-2xl border transition-all ${
          hasAllergy
            ? 'bg-rose-50/90 border-rose-300 shadow-2xs'
            : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
              <AlertTriangle className={`w-3.5 h-3.5 ${hasAllergy ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <span>Alergia a Medicamentos:</span>
              {hasAllergy && (
                <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  ALERTA DE SEGURANÇA
                </span>
              )}
            </label>

            {/* Status Sim / Não */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSetAlergiaStatus('nao')}
                className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  !hasAllergy
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Nega Alergias</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetAlergiaStatus('sim')}
                className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  hasAllergy
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Sim, Refere Alergia</span>
              </button>
            </div>
          </div>

          {hasAllergy && (
            <div className="space-y-2 pt-1 border-t border-rose-200/80">
              {/* Chips rápidos de medicamentos alergênicos frequentes */}
              <div className="flex flex-wrap gap-1">
                {COMMON_ALLERGIES.map((drug) => {
                  const isSelected = currentAlergia.toLowerCase().includes(drug.toLowerCase());
                  return (
                    <button
                      key={drug}
                      type="button"
                      onClick={() => handleToggleAllergyTag(drug)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-100/60'
                      }`}
                    >
                      {drug}
                    </button>
                  );
                })}
              </div>

              {/* Input livre para especificar medicamentos ou manifestações */}
              <div>
                <input
                  type="text"
                  value={currentAlergia === 'NEGA' ? '' : currentAlergia}
                  onChange={(e) => {
                    const val = e.target.value;
                    syncUpdate('alergias', val.trim() ? val : 'NEGA');
                    syncUpdate('alergiaStatus', val.trim() ? 'sim' : 'nao');
                  }}
                  placeholder="Especifique medicamento(s) e reação (Ex: Dipirona, Penicilina - choque anafilático)"
                  className="w-full bg-white border border-rose-300 rounded-xl px-2.5 py-1.5 text-xs text-rose-950 font-bold focus:outline-none focus:border-rose-600 shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. COMORBIDADES */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
              <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
              <span>Comorbidades Prévias ou Gestacionais:</span>
            </label>

            <button
              type="button"
              onClick={() => syncUpdate('comorbidades', 'NEGA')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                currentComorbidades === 'NEGA'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Nega Comorbidades
            </button>
          </div>

          {/* Chips Rápidos de Comorbidades */}
          <div className="flex flex-wrap gap-1">
            {COMMON_COMORBIDITIES.map((c) => {
              const isSelected = currentComorbidades.toLowerCase().includes(c.toLowerCase());
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleToggleComorbidityTag(c)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:text-purple-800'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Campo de Texto para Comorbidades */}
          <input
            type="text"
            value={currentComorbidades}
            onChange={(e) => syncUpdate('comorbidades', e.target.value)}
            placeholder="Ex: HAS Crônica, DMG em dieta, Hipotireoidismo..."
            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-500 shadow-2xs"
          />
        </div>

        {/* 3. MEDICAMENTOS DE USO CONTÍNUO (MUC) */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
              <Pill className="w-3.5 h-3.5 text-sky-600" />
              <span>Medicamentos de Uso Contínuo (MUC):</span>
            </label>

            <button
              type="button"
              onClick={() => syncUpdate('muc', 'NEGA')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                currentMuc === 'NEGA'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Nega MUC
            </button>
          </div>

          {/* Chips Rápidos de MUC */}
          <div className="flex flex-wrap gap-1">
            {COMMON_MUC.map((med) => {
              const isSelected = currentMuc.toLowerCase().includes(med.toLowerCase());
              return (
                <button
                  key={med}
                  type="button"
                  onClick={() => handleToggleMucTag(med)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-800'
                  }`}
                >
                  {med}
                </button>
              );
            })}
          </div>

          {/* Campo de Texto para MUC */}
          <input
            type="text"
            value={currentMuc}
            onChange={(e) => syncUpdate('muc', e.target.value)}
            placeholder="Ex: Metildopa 500mg 8/8h, Levotiroxina 50mcg em jejum..."
            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-2xs"
          />
        </div>

        {/* 4. QUEIXAS ADICIONAIS & SINTOMAS ESCRITOS DA PACIENTE */}
        <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-950">
              <MessageSquarePlus className="w-3.5 h-3.5 text-amber-700" />
              <span>Queixas Adicionais da Paciente (Sintomas Relatados):</span>
            </label>

            <button
              type="button"
              onClick={() => syncUpdate('queixasAdicionais', 'Nega queixas no momento')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                currentQueixas.toLowerCase().includes('nega queixas')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Nega Queixas
            </button>
          </div>

          {/* Chips rápidos de sintomas frequentes */}
          <div className="flex flex-wrap gap-1">
            {COMMON_COMPLAINTS.map((symptom) => {
              const isSelected = currentQueixas.toLowerCase().includes(symptom.toLowerCase());
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleToggleComplaintTag(symptom)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/70'
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>

          {/* Campo de Texto Aberto (Textarea) para Escrita de Queixas Adicionais */}
          <div>
            <textarea
              rows={2}
              value={currentQueixas}
              onChange={(e) => syncUpdate('queixasAdicionais', e.target.value)}
              placeholder="Descreva aqui quaisquer queixas adicionais relatadas pela paciente (ex: refere cefaleia holocraniana leve após deambulação; relata dor lombar com melhora ao repouso; queixa-se de náuseas pós-dieta...)"
              className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-600 shadow-2xs leading-relaxed resize-y"
            />
            <span className="text-[10px] text-amber-800 block mt-0.5 font-medium">
              * O que for digitado aqui é integrado automaticamente na evolução médica e na passagem do leito.
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
