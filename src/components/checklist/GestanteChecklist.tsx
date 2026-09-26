import React from 'react';
import {
  Calendar,
  Activity,
  HeartPulse,
  ShieldAlert,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Bed, GestanteData } from '../../types/bed';
import { Chip } from '../common/Chip';
import { SectionCard } from '../common/SectionCard';
import { BloodPressureInput } from '../common/BloodPressureInput';
import { ObstetricHistoryInput } from '../common/ObstetricHistoryInput';
import { AtestadoChecklistSection } from './AtestadoChecklistSection';
import { ClinicalHistoryChecklistSection } from './ClinicalHistoryChecklistSection';
import { HdaAnamneseChecklistSection } from './HdaAnamneseChecklistSection';
import { parseAndEvaluateBP, getBedBP, getBedBPStatus } from '../../utils/bpAnalyzer';

interface GestanteChecklistProps {
  bed: Bed;
  onUpdateBed?: (updates: Partial<Bed>) => void;
  onUpdateData: (updater: (prev: GestanteData) => GestanteData) => void;
  onNavigateToPrescription: () => void;
}

export const GestanteChecklist: React.FC<GestanteChecklistProps> = ({
  bed,
  onUpdateBed,
  onUpdateData,
  onNavigateToPrescription
}) => {
  const d: GestanteData = bed.data || {};

  const toggleArrayItem = (key: keyof GestanteData, value: string) => {
    onUpdateData((prev) => {
      const arr = (prev[key] as string[]) || [];
      const exists = arr.includes(value);
      const nextArr = exists ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [key]: nextArr };
    });
  };

  const handleToggleAdmissionReason = (reasonKey: string) => {
    onUpdateData((prev) => {
      const arr = (prev.admissionReason as string[]) || [];
      // Se for ITU ou Pielonefrite, remove a chave unificada antiga 'itu_pielonefrite' se presente
      let cleaned = arr;
      if (reasonKey === 'itu' || reasonKey === 'pielonefrite') {
        cleaned = cleaned.filter((x) => x !== 'itu_pielonefrite');
      }
      const exists = cleaned.includes(reasonKey);
      const nextArr = exists ? cleaned.filter((x) => x !== reasonKey) : [...cleaned, reasonKey];
      return { ...prev, admissionReason: nextArr };
    });
  };

  const updateField = (key: keyof GestanteData, value: any) => {
    onUpdateData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSetAdmissionDate = (dateVal: string) => {
    if (onUpdateBed) {
      onUpdateBed({ admissionDate: dateVal });
    }
  };

  const isSevereBP = getBedBPStatus(bed).isSevere;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Column */}
      <div className="lg:col-span-8 space-y-3">
        {/* 1. Idade Gestacional & Admissão */}
        <SectionCard title="Idade Gestacional & Admissão" icon={Calendar} color="text-sky-700" bg="bg-sky-100">
          <div className="space-y-3">
            {/* Paridade / História Obstétrica Padrão: G03P03(n03 C 00)A00 */}
            <ObstetricHistoryInput
              value={d.obstetricHistory || bed.obstetricHistory || 'G01P00(n00 C 00)A00'}
              onChange={(val) => {
                updateField('obstetricHistory', val);
                if (onUpdateBed) onUpdateBed({ obstetricHistory: val });
              }}
              label="História Obstétrica (Paridade Oficial):"
            />

            {/* Data de Internação / Admissão ao Serviço (Alimenta HDA) */}
            <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-200/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-sky-950 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-700" />
                  Data de Internação / Admissão (Alimenta HDA e Evolução):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toLocaleDateString('pt-BR');
                      handleSetAdmissionDate(today);
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-800 hover:bg-sky-100 cursor-pointer shadow-2xs"
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
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-800 hover:bg-sky-100 cursor-pointer shadow-2xs"
                  >
                    Ontem
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-sky-900 uppercase block mb-0.5">
                    Data de Entrada no Hospital / Enfermaria:
                  </label>
                  <input
                    type="text"
                    value={bed.admissionDate || ''}
                    onChange={(e) => handleSetAdmissionDate(e.target.value)}
                    placeholder="Ex: 22/09/2026 ou 22/09"
                    className="w-full bg-white border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-sky-900 uppercase block mb-0.5">
                    Hora de Entrada (opcional):
                  </label>
                  <input
                    type="text"
                    value={bed.admissionTime || ''}
                    onChange={(e) => onUpdateBed && onUpdateBed({ admissionTime: e.target.value })}
                    placeholder="Ex: 14:30"
                    className="w-full bg-white border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-600 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Direct Input: Semanas, Dias, Método */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Semanas:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="44"
                      value={d.gestationalAge ?? 32}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        updateField('gestationalAge', val);
                      }}
                      className="w-20 text-center font-bold text-base px-2 py-1 bg-white border border-slate-300 rounded-xl focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <span className="text-slate-400 font-bold self-end pb-1.5">+</span>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Dias (0-6):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={d.gestationalDays ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateField('gestationalDays', isNaN(val) ? 0 : Math.min(Math.max(val, 0), 6));
                      }}
                      className="w-16 text-center font-bold text-base px-2 py-1 bg-white border border-slate-300 rounded-xl focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Método: Alegada, DUM, USG */}
                  <div className="ml-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Base do Cálculo:
                    </label>
                    <div className="flex items-center gap-1">
                      {(['Alegada', 'DUM', 'USG'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateField('gestationalAgeMethod', m)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
                            (d.gestationalAgeMethod || 'Alegada') === m
                              ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stage Classification Badge */}
                <div className="self-end pb-0.5">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                      (d.gestationalAge || 32) < 12
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : (d.gestationalAge || 32) < 20
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : (d.gestationalAge || 32) < 24
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : (d.gestationalAge || 32) < 34
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : (d.gestationalAge || 32) < 37
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {(d.gestationalAge || 32) < 12
                      ? '1º Trimestre (< 12 sem)'
                      : (d.gestationalAge || 32) < 20
                      ? '2º Trimestre Precoce (< 20 sem)'
                      : (d.gestationalAge || 32) < 24
                      ? 'Periviabilidade (20 a 23 sem)'
                      : (d.gestationalAge || 32) < 34
                      ? 'Prematuro (< 34 sem - Corticoide)'
                      : (d.gestationalAge || 32) < 37
                      ? 'Prematuro Tardio (34 a 36 sem)'
                      : 'A Termo (>= 37 sem)'}
                  </span>
                </div>
              </div>

              {/* Range Slider 1 to 42 weeks */}
              <div className="pt-1">
                <input
                  type="range"
                  min="1"
                  max="42"
                  value={d.gestationalAge || 32}
                  onChange={(e) => updateField('gestationalAge', parseInt(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1s</span>
                  <span>8s</span>
                  <span>12s</span>
                  <span className="font-bold text-amber-600">20s</span>
                  <span>24s (Viabilidade)</span>
                  <span>34s (Corticoide)</span>
                  <span>37s (Termo)</span>
                  <span>42s</span>
                </div>
              </div>

              {/* Free text for alleged IG notes */}
              <div className="pt-1">
                <input
                  type="text"
                  value={d.gestationalAgeText || ''}
                  onChange={(e) => updateField('gestationalAgeText', e.target.value)}
                  placeholder="Nota complementar sobre a IG alegada (ex: DUM incerta, USG precoce de 8s, atraso menstrual...)"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Motivo da Internação:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('ameaca_aborto')}
                  onClick={() => handleToggleAdmissionReason('ameaca_aborto')}
                  label="Ameaça de Aborto (<20s)"
                  badge="Repouso"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('hiperemese')}
                  onClick={() => handleToggleAdmissionReason('hiperemese')}
                  label="Hiperêmese Gravídica"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('sangramento_1tri')}
                  onClick={() => handleToggleAdmissionReason('sangramento_1tri')}
                  label="Sangramento 1º/2º Trimestre"
                  badge="STV"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('tp_latente')}
                  onClick={() => handleToggleAdmissionReason('tp_latente')}
                  label="Trabalho de Parto Latente"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('tp_ativo')}
                  onClick={() => handleToggleAdmissionReason('tp_ativo')}
                  label="Trabalho de Parto Ativo"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('ruprema')}
                  onClick={() => handleToggleAdmissionReason('ruprema')}
                  label="RUPREMA (Bolsa Rota)"
                  badge="Latência"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('hipertensao')}
                  onClick={() => handleToggleAdmissionReason('hipertensao')}
                  label="Síndrome Hipertensiva / HAS"
                  badge="PA"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('preeclampsia')}
                  onClick={() => handleToggleAdmissionReason('preeclampsia')}
                  label="Pré-Eclâmpsia (PE)"
                  badge="Zuspan"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('dmg')}
                  onClick={() => handleToggleAdmissionReason('dmg')}
                  label="DMG (Diabetes Gestacional)"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('itu')}
                  onClick={() => handleToggleAdmissionReason('itu')}
                  label="ITU (Infecção Urinária)"
                  badge="Baixa / Cistite"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('pielonefrite') || d.admissionReason?.includes('itu_pielonefrite')}
                  onClick={() => handleToggleAdmissionReason('pielonefrite')}
                  label="Pielonefrite Aguda"
                  badge="Parenteral / EV"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('ameaca_tpp')}
                  onClick={() => handleToggleAdmissionReason('ameaca_tpp')}
                  label="Ameaça de TPP"
                  badge="Corticoide"
                />
                <Chip
                  color="sky"
                  active={d.admissionReason?.includes('dor_abdominal')}
                  onClick={() => handleToggleAdmissionReason('dor_abdominal')}
                  label="Dor Abdominal a Esclarecer"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 1.1 História da Doença Atual (Anamnese Dirigida & HDA) */}
        <HdaAnamneseChecklistSection
          bed={bed}
          data={d}
          onUpdateField={updateField}
          onUpdateBed={onUpdateBed}
        />

        {/* 1.2 Histórico Clínico, Alergias, Comorbidades, MUC & Queixas da Paciente */}
        <ClinicalHistoryChecklistSection
          data={d}
          bed={bed}
          onUpdateField={updateField}
          onUpdateBed={onUpdateBed}
        />

        {/* 2. Exame Físico Obstétrico (>20 semanas - evolucao.txt) */}
        <SectionCard title="Exame Físico Obstétrico (>20 Semanas)" icon={Activity} color="text-teal-700" bg="bg-teal-100">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Dinâmica Uterina (Contrações):
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  color="teal"
                  active={d.dynamics === 'ausente'}
                  onClick={() => updateField('dynamics', 'ausente')}
                  label="Ausente (Padrão Normal)"
                />
                <Chip
                  color="teal"
                  active={d.dynamics === 'irregular'}
                  onClick={() => updateField('dynamics', 'irregular')}
                  label="Irregular / Incoordenada (1-2/10min)"
                />
                <Chip
                  color="teal"
                  active={d.dynamics === 'ativo'}
                  onClick={() => updateField('dynamics', 'ativo')}
                  label="Trabalho de Parto Ativo (3-4 contr/10min)"
                  badge="Parto"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Tônus Uterino:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  color="teal"
                  active={d.uterineTone === 'normal'}
                  onClick={() => updateField('uterineTone', 'normal')}
                  label="Normal (Abdome depressível)"
                />
                <Chip
                  color="rose"
                  active={d.uterineTone === 'hipertonia'}
                  onClick={() => updateField('uterineTone', 'hipertonia')}
                  label="Hipertonia Uterina (Alerta DPP)"
                  badge="URGÊNCIA"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Perdas Vaginais:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  color="teal"
                  active={d.vaginalLosses === 'ausente'}
                  onClick={() => updateField('vaginalLosses', 'ausente')}
                  label="Ausentes / Fisiológico"
                />
                <Chip
                  color="teal"
                  active={d.vaginalLosses === 'tampao'}
                  onClick={() => updateField('vaginalLosses', 'tampao')}
                  label="Tampão Mucoso"
                />
                <Chip
                  color="teal"
                  active={d.vaginalLosses === 'liquido_claro'}
                  onClick={() => updateField('vaginalLosses', 'liquido_claro')}
                  label="Líquido Amniótico Claro com Grumos"
                />
                <Chip
                  color="rose"
                  active={d.vaginalLosses === 'liquido_meconial'}
                  onClick={() => updateField('vaginalLosses', 'liquido_meconial')}
                  label="Líquido Amniótico Meconial"
                  badge="Alerta"
                />
                <Chip
                  color="rose"
                  active={d.vaginalLosses === 'sangramento'}
                  onClick={() => updateField('vaginalLosses', 'sangramento')}
                  label="Sangramento Vivo Ativo"
                  badge="URGÊNCIA"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Edema em MMII:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['ausente', '1+', '2+', '3+', '4+'] as const).map((ed) => (
                  <Chip
                    key={ed}
                    color="sky"
                    active={d.edema === ed}
                    onClick={() => updateField('edema', ed)}
                    label={ed === 'ausente' ? 'Ausente' : `Edema ${ed}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Right Column: PA, Iminência Zuspan & BCF */}
      <div className="lg:col-span-4 space-y-3">
        {/* Nível Pressórico & Zuspan */}
        <SectionCard
          title="Pressão Arterial & Alerta Zuspan"
          icon={Activity}
          color="text-rose-700"
          bg="bg-rose-100"
          badge={isSevereBP ? 'ZUSPAN' : undefined}
        >
          <div className="space-y-2.5">
            <BloodPressureInput
              value={getBedBP(bed)}
              onChange={(val) => {
                const evalResult = parseAndEvaluateBP(val);
                const status: 'normal' | 'elevada' | 'grave' =
                  evalResult.classification === 'grave'
                    ? 'grave'
                    : evalResult.classification === 'elevada'
                    ? 'elevada'
                    : 'normal';

                // 1. Atualiza dados específicos da gestante
                onUpdateData((prev) => ({
                  ...prev,
                  bpValue: val,
                  bloodPressure: status
                }));

                // 2. Atualiza imediatamente o leito (alimenta em tempo real a evolução médica)
                if (onUpdateBed) {
                  onUpdateBed({
                    bloodPressure: val
                  });
                }
              }}
              label="Aferição da Pressão Arterial (Auto-Detectada):"
              showQuickChips={true}
            />

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Sinais de Iminência de Eclâmpsia:
              </label>
              <div className="space-y-1.5">
                <Chip
                  color="rose"
                  active={d.imminenceSigns?.includes('cefaleia')}
                  onClick={() => toggleArrayItem('imminenceSigns', 'cefaleia')}
                  label="Cefaleia Refratária"
                />
                <Chip
                  color="rose"
                  active={d.imminenceSigns?.includes('escotomas')}
                  onClick={() => toggleArrayItem('imminenceSigns', 'escotomas')}
                  label="Escotomas / Turvação Visual"
                />
                <Chip
                  color="rose"
                  active={d.imminenceSigns?.includes('epigastralgia')}
                  onClick={() => toggleArrayItem('imminenceSigns', 'epigastralgia')}
                  label="Epigastralgia / Dor em Barra"
                />
              </div>
            </div>

            {isSevereBP && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Protocolo do Posto: Chamar plantonista imediatamente e questionar sobre Sulfatação (Zuspan)!
                </span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Vitalidade Fetal (BCF) */}
        <SectionCard title="Vitalidade Fetal (BCF)" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50">
          <div className="space-y-2.5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="text-xs font-medium text-slate-600">
                  BCF (Normal: 110 a 160 bpm):
                </label>
                {(d.gestationalAge || 32) > 14 ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Ausculta de 6/6h indicada (&gt;14 sem)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    IG ≤ 14 sem: Avaliar por USG (Sem BCF no sonar)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="60"
                  max="220"
                  value={d.fhrValue || 140}
                  onChange={(e) => updateField('fhrValue', parseInt(e.target.value) || 140)}
                  disabled={(d.gestationalAge || 32) <= 14}
                  className={`w-24 text-center font-bold text-base px-2 py-1.5 border rounded-xl focus:outline-none ${
                    (d.gestationalAge || 32) <= 14
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-teal-500'
                  }`}
                />
                <span className="text-xs text-slate-500 font-medium">bpm</span>
              </div>
              {(d.gestationalAge || 32) <= 14 && (
                <p className="text-[10px] text-amber-700 mt-1.5 font-medium leading-relaxed bg-amber-50/60 p-2 rounded-lg border border-amber-200/80">
                  * Gestação com ≤ 14 semanas. A escuta periódica de 6/6h no sonar Doppler é suprimida da prescrição e evolução.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Chip
                color="emerald"
                active={(d.fhrValue || 140) >= 110 && (d.fhrValue || 140) <= 160}
                onClick={() => updateField('fetalVitality', 'bcf_normal')}
                label="Normal (110-160 bpm) Reativo"
              />
              <Chip
                color="rose"
                active={(d.fhrValue || 140) < 110 || (d.fhrValue || 140) > 160}
                onClick={() => updateField('fetalVitality', 'bcf_anormal')}
                label={(d.fhrValue || 140) < 110 ? 'Bradicardia (<110 bpm)' : 'Taquicardia (>160 bpm)'}
                badge="CTG Urgente"
              />
              <Chip
                color="teal"
                active={d.fetalVitality === 'mov_ativo'}
                onClick={() => updateField('fetalVitality', 'mov_ativo')}
                label="Movimentação Fetal Ativa Sentida"
              />
            </div>
          </div>
        </SectionCard>

        {/* Atestados e Declarações (Paciente & Acompanhante) */}
        <AtestadoChecklistSection
          data={d}
          onUpdateField={(key, value) => updateField(key as keyof GestanteData, value)}
          onUpdateBed={onUpdateBed}
          patientType="gestante"
        />

        {/* Action Button */}
        <button
          onClick={onNavigateToPrescription}
          className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <span>Gerar Prescrição da Gestante</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
