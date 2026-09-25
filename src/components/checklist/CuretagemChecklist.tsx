import React from 'react';
import { ShieldCheck, Activity, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { Bed, CuretagemData } from '../../types/bed';
import { Chip } from '../common/Chip';
import { SectionCard } from '../common/SectionCard';
import { BloodPressureInput } from '../common/BloodPressureInput';
import { ObstetricHistoryInput } from '../common/ObstetricHistoryInput';
import { AtestadoChecklistSection } from './AtestadoChecklistSection';
import { ClinicalHistoryChecklistSection } from './ClinicalHistoryChecklistSection';
import { HdaAnamneseChecklistSection } from './HdaAnamneseChecklistSection';
import { getBedBP } from '../../utils/bpAnalyzer';

interface CuretagemChecklistProps {
  bed: Bed;
  onUpdateBed?: (updates: Partial<Bed>) => void;
  onUpdateData: (updater: (prev: CuretagemData) => CuretagemData) => void;
  onNavigateToPrescription: () => void;
}

export const CuretagemChecklist: React.FC<CuretagemChecklistProps> = ({
  bed,
  onUpdateBed,
  onUpdateData,
  onNavigateToPrescription
}) => {
  const d: CuretagemData = bed.data || {};

  const updateField = (key: keyof CuretagemData, value: any) => {
    onUpdateData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSetAdmissionDate = (dateVal: string) => {
    if (onUpdateBed) {
      onUpdateBed({ admissionDate: dateVal });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 space-y-3">
        <SectionCard title="Procedimento & Sangramento Pós-Curetagem" icon={ShieldCheck} color="text-amber-700" bg="bg-amber-100">
          <div className="space-y-3">
            {/* Paridade / História Obstétrica Padrão: G03P03(n03 C 00)A00 */}
            <ObstetricHistoryInput
              value={d.obstetricHistory || bed.obstetricHistory || 'G02P00(n00 C 00)A01'}
              onChange={(val) => {
                updateField('obstetricHistory', val);
                if (onUpdateBed) onUpdateBed({ obstetricHistory: val });
              }}
              label="História Obstétrica (Paridade Oficial):"
            />

            {/* Data de Internação / Admissão (Alimenta HDA) */}
            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-amber-950 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  Data de Internação / Admissão (Alimenta HDA e Evolução):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toLocaleDateString('pt-BR');
                      handleSetAdmissionDate(today);
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const dt = new Date();
                      dt.setDate(dt.getDate() - 1);
                      handleSetAdmissionDate(dt.toLocaleDateString('pt-BR'));
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    Ontem
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-amber-900 uppercase block mb-0.5">
                    Data de Entrada no Hospital / Enfermaria:
                  </label>
                  <input
                    type="text"
                    value={bed.admissionDate || ''}
                    onChange={(e) => handleSetAdmissionDate(e.target.value)}
                    placeholder="Ex: 22/09/2026 ou 22/09"
                    className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-amber-900 uppercase block mb-0.5">
                    Hora de Entrada (opcional):
                  </label>
                  <input
                    type="text"
                    value={bed.admissionTime || ''}
                    onChange={(e) => onUpdateBed && onUpdateBed({ admissionTime: e.target.value })}
                    placeholder="Ex: 15:44"
                    className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Motivo do Procedimento:
              </label>
              <input
                type="text"
                value={d.admissionReason || 'Abortamento Incompleto'}
                onChange={(e) => updateField('admissionReason', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Sangramento Vaginal / Forro:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  color="emerald"
                  active={d.bleeding === 'ausente'}
                  onClick={() => updateField('bleeding', 'ausente')}
                  label="Ausente"
                />
                <Chip
                  color="amber"
                  active={d.bleeding === 'leve'}
                  onClick={() => updateField('bleeding', 'leve')}
                  label="Leve / Fisiológico"
                />
                <Chip
                  color="amber"
                  active={d.bleeding === 'moderado'}
                  onClick={() => updateField('bleeding', 'moderado')}
                  label="Moderado"
                />
                <Chip
                  color="rose"
                  active={d.bleeding === 'intenso'}
                  onClick={() => updateField('bleeding', 'intenso')}
                  label="Intenso / Hemorragia"
                  badge="ALERTA"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* História da Doença Atual (Anamnese Dirigida & HDA) */}
        <HdaAnamneseChecklistSection
          bed={bed}
          data={d}
          onUpdateField={updateField}
          onUpdateBed={onUpdateBed}
        />

        {/* Histórico Clínico, Alergias, Comorbidades, MUC & Queixas da Paciente */}
        <ClinicalHistoryChecklistSection
          data={d}
          bed={bed}
          onUpdateField={updateField}
          onUpdateBed={onUpdateBed}
        />
      </div>

      <div className="lg:col-span-4 space-y-3">
        {/* Sinais Vitais & PA */}
        <SectionCard title="Sinais Vitais (PA Auto-Detectada)" icon={Activity} color="text-amber-700" bg="bg-amber-100">
          <BloodPressureInput
            value={getBedBP(bed)}
            onChange={(val) => {
              updateField('bloodPressure', val);
              if (onUpdateBed) {
                onUpdateBed({ bloodPressure: val });
              }
            }}
            label="Pressão Arterial:"
            showQuickChips={true}
          />
        </SectionCard>

        <SectionCard title="Nível de Dor & Alta" icon={Activity} color="text-rose-600" bg="bg-rose-50">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Dor Pós-Procedimento:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <Chip
                color="emerald"
                active={d.painLevel === '0'}
                onClick={() => updateField('painLevel', '0')}
                label="Sem Dor (0)"
              />
              <Chip
                color="emerald"
                active={d.painLevel === '1-3'}
                onClick={() => updateField('painLevel', '1-3')}
                label="Leve (1 a 3)"
              />
              <Chip
                color="amber"
                active={d.painLevel === '4-6'}
                onClick={() => updateField('painLevel', '4-6')}
                label="Moderada (4 a 6)"
              />
              <Chip
                color="rose"
                active={d.painLevel === '7-10'}
                onClick={() => updateField('painLevel', '7-10')}
                label="Forte (7 a 10)"
              />
            </div>
          </div>
        </SectionCard>

        {/* Atestados e Declarações (Paciente & Acompanhante) */}
        <AtestadoChecklistSection
          data={d}
          onUpdateField={(key, value) => updateField(key as keyof CuretagemData, value)}
          onUpdateBed={onUpdateBed}
          patientType="curetagem"
        />

        <button
          onClick={onNavigateToPrescription}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <span>Gerar Prescrição & Alta</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
