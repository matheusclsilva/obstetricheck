import {
  Baby,
  HeartPulse,
  Activity,
  Sparkles,
  ShieldCheck,
  Layers,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  TestTube,
  Calendar
} from 'lucide-react';
import { Bed, PuerperaData } from '../../types/bed';
import { Chip } from '../common/Chip';
import { SectionCard } from '../common/SectionCard';
import { BloodPressureInput } from '../common/BloodPressureInput';
import { ObstetricHistoryInput } from '../common/ObstetricHistoryInput';
import { AtestadoChecklistSection } from './AtestadoChecklistSection';
import { ClinicalHistoryChecklistSection } from './ClinicalHistoryChecklistSection';
import { HdaAnamneseChecklistSection } from './HdaAnamneseChecklistSection';
import { getBedBP } from '../../utils/bpAnalyzer';

interface PuerperaChecklistProps {
  bed: Bed;
  onUpdateBed?: (updates: Partial<Bed>) => void;
  onUpdateData: (updater: (prev: PuerperaData) => PuerperaData) => void;
  onNavigateToPrescription: () => void;
}

export const PuerperaChecklist: React.FC<PuerperaChecklistProps> = ({
  bed,
  onUpdateBed,
  onUpdateData,
  onNavigateToPrescription
}) => {
  const d: PuerperaData = bed.data || {};

  const toggleArrayItem = (key: keyof PuerperaData, value: string) => {
    onUpdateData((prev) => {
      const arr = (prev[key] as string[]) || [];
      const exists = arr.includes(value);
      const nextArr = exists ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [key]: nextArr };
    });
  };

  const updateField = (key: keyof PuerperaData, value: any) => {
    onUpdateData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSetAdmissionDate = (dateVal: string) => {
    if (onUpdateBed) {
      onUpdateBed({ admissionDate: dateVal });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Form Column */}
      <div className="lg:col-span-8 space-y-3">
        {/* 1. Parto e Cronologia */}
        <SectionCard title="Parto e Cronologia Puerperal" icon={Baby} color="text-purple-700" bg="bg-purple-100">
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

            {/* Data de Internação ao Serviço (Alimenta diretamente a HDA) */}
            <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-purple-950 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  Data de Internação ao Serviço (Alimenta HDA e Evolução):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toLocaleDateString('pt-BR');
                      handleSetAdmissionDate(today);
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 cursor-pointer shadow-2xs"
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
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 cursor-pointer shadow-2xs"
                  >
                    Ontem
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-purple-900 uppercase block mb-0.5">
                    Data de Entrada no Hospital / Enfermaria:
                  </label>
                  <input
                    type="text"
                    value={bed.admissionDate || ''}
                    onChange={(e) => handleSetAdmissionDate(e.target.value)}
                    placeholder="Ex: 18/09/2026 ou 18/09"
                    className="w-full bg-white border border-purple-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-purple-900 uppercase block mb-0.5">
                    Hora de Entrada (opcional):
                  </label>
                  <input
                    type="text"
                    value={bed.admissionTime || ''}
                    onChange={(e) => onUpdateBed && onUpdateBed({ admissionTime: e.target.value })}
                    placeholder="Ex: 20:50"
                    className="w-full bg-white border border-purple-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Data do Parto (se prévia à admissão) */}
              <div className="pt-1.5 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                    Data do Parto (se realizado antes da internação atual):
                  </label>
                  <input
                    type="text"
                    value={d.deliveryDate || ''}
                    onChange={(e) => updateField('deliveryDate', e.target.value)}
                    placeholder="Ex: 04/09/26 (para HDA: 'EM 04/09/26 DE PÓS CESÁREA, DEU ENTRADA EM 18/09/2026')"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Via de Parto:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  color="purple"
                  active={d.deliveryType === 'vaginal'}
                  onClick={() => updateField('deliveryType', 'vaginal')}
                  label="Parto Normal Eutócico"
                />
                <Chip
                  color="purple"
                  active={d.deliveryType === 'forceps'}
                  onClick={() => updateField('deliveryType', 'forceps')}
                  label="Fórceps / Instrumental"
                />
                <Chip
                  color="purple"
                  active={d.deliveryType === 'cesarea_eletiva'}
                  onClick={() => updateField('deliveryType', 'cesarea_eletiva')}
                  label="Cesárea Eletiva"
                />
                <Chip
                  color="purple"
                  active={d.deliveryType === 'cesarea_urgencia'}
                  onClick={() => updateField('deliveryType', 'cesarea_urgencia')}
                  label="Cesárea de Urgência"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Dia Pós-Parto:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['D0', 'D1', 'D2', 'D3+'] as const).map((day) => (
                  <Chip
                    key={day}
                    color="purple"
                    active={d.postpartumDay === day}
                    onClick={() => updateField('postpartumDay', day)}
                    label={day === 'D0' ? 'D0 (Imediato)' : day === 'D1' ? 'D1 (Toda medicação oral)' : day}
                    badge={day === 'D1' ? 'Via Oral' : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 1.1 Pressão Arterial Auto-detectada */}
        <SectionCard title="Pressão Arterial (Auto-Detecção Clínica)" icon={Activity} color="text-purple-700" bg="bg-purple-100">
          <BloodPressureInput
            value={getBedBP(bed)}
            onChange={(val) => {
              updateField('bloodPressure', val);
              if (onUpdateBed) {
                onUpdateBed({ bloodPressure: val });
              }
            }}
            label="Aferição da Pressão Arterial (PA):"
            showQuickChips={true}
          />
        </SectionCard>

        {/* 1.2 História da Doença Atual (Anamnese Dirigida & HDA) */}
        <HdaAnamneseChecklistSection
          bed={bed}
          data={d}
          onUpdateField={updateField}
          onUpdateBed={onUpdateBed}
        />

        {/* 1.3 Histórico Clínico, Alergias, Comorbidades, MUC & Queixas da Paciente */}
        <ClinicalHistoryChecklistSection
          data={d}
          bed={bed}
          onUpdateField={updateField}
          onUpdateBed={onUpdateBed}
        />

        {/* 2. Mamas e Amamentação */}
        <SectionCard title="Mamas e Lactação" icon={HeartPulse} color="text-rose-700" bg="bg-rose-100">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Avaliação das Mamas e Pega do RN:
          </label>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="rose"
              active={d.breasts?.includes('flacidas')}
              onClick={() => toggleArrayItem('breasts', 'flacidas')}
              label="Mamas Flácidas / Colostro"
            />
            <Chip
              color="rose"
              active={d.breasts?.includes('apojadura')}
              onClick={() => toggleArrayItem('breasts', 'apojadura')}
              label="Apojadura Fisiológica"
            />
            <Chip
              color="rose"
              active={d.breasts?.includes('ingurgitamento')}
              onClick={() => toggleArrayItem('breasts', 'ingurgitamento')}
              label="Ingurgitamento Doloroso"
              badge="Alívio"
            />
            <Chip
              color="rose"
              active={d.breasts?.includes('fissura')}
              onClick={() => toggleArrayItem('breasts', 'fissura')}
              label="Fissura Mamilar"
            />
            <Chip
              color="rose"
              active={d.breasts?.includes('pega_ok')}
              onClick={() => toggleArrayItem('breasts', 'pega_ok')}
              label="Pega Adequada (AMEX)"
            />
            <Chip
              color="rose"
              active={d.breasts?.includes('pega_dificil')}
              onClick={() => toggleArrayItem('breasts', 'pega_dificil')}
              label="Dificuldade de Pega"
            />
          </div>
        </SectionCard>

        {/* 3. Útero & Involução */}
        <SectionCard title="Útero & Involução (Globo de Pinard)" icon={Activity} color="text-amber-700" bg="bg-amber-100">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="amber"
              active={d.uterus === 'contraido'}
              onClick={() => updateField('uterus', 'contraido')}
              label="Contraído Firme (Nível/Abaixo Umbilical)"
            />
            <Chip
              color="amber"
              active={d.uterus === 'hipotonico'}
              onClick={() => updateField('uterus', 'hipotonico')}
              label="Hipotônico / Atonia"
              badge="URGENTE"
            />
            <Chip
              color="amber"
              active={d.uterus === 'subinvoluido'}
              onClick={() => updateField('uterus', 'subinvoluido')}
              label="Subinvoluído"
            />
            <Chip
              color="amber"
              active={d.uterus === 'doloroso'}
              onClick={() => updateField('uterus', 'doloroso')}
              label="Doloroso à Palpação Profunda"
            />
          </div>
        </SectionCard>

        {/* 4. Lóquios */}
        <SectionCard title="Lóquios Puerperais" icon={Sparkles} color="text-purple-700" bg="bg-purple-100">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="purple"
              active={d.lochia === 'fisiologico'}
              onClick={() => updateField('lochia', 'fisiologico')}
              label="Fisiológicos (Rubros Moderados)"
            />
            <Chip
              color="purple"
              active={d.lochia === 'aumentado'}
              onClick={() => updateField('lochia', 'aumentado')}
              label="Hemorragia / Lóquios Aumentados"
              badge="Alerta"
            />
            <Chip
              color="purple"
              active={d.lochia === 'coagulos'}
              onClick={() => updateField('lochia', 'coagulos')}
              label="Coágulos Volumosos"
            />
            <Chip
              color="purple"
              active={d.lochia === 'fetido'}
              onClick={() => updateField('lochia', 'fetido')}
              label="Lóquios Fétidos (Suspeita Endometrite)"
              badge="Infeccioso"
            />
          </div>
        </SectionCard>

        {/* 5. Ferida Operatória / Períneo */}
        <SectionCard title="Ferida Operatória / Períneo" icon={ShieldCheck} color="text-teal-700" bg="bg-teal-100">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="teal"
              active={d.wound === 'curativo_limpo'}
              onClick={() => updateField('wound', 'curativo_limpo')}
              label="FO: Curativo Limpo e Seco (Lavar 4x/dia)"
            />
            <Chip
              color="teal"
              active={d.wound === 'curativo_sangrante'}
              onClick={() => updateField('wound', 'curativo_sangrante')}
              label="FO: Sangramento / Úmido"
            />
            <Chip
              color="teal"
              active={d.wound === 'perineo_integro'}
              onClick={() => updateField('wound', 'perineo_integro')}
              label="Períneo Íntegro"
            />
            <Chip
              color="teal"
              active={d.wound === 'laceracao_suturada'}
              onClick={() => updateField('wound', 'laceracao_suturada')}
              label="Laceração / Episio Suturada s/ Edema"
            />
            <Chip
              color="teal"
              active={d.wound === 'hematoma_perineal'}
              onClick={() => updateField('wound', 'hematoma_perineal')}
              label="Edema / Hematoma Perineal"
              badge="Gelo"
            />
          </div>
        </SectionCard>

        {/* 6. Eliminações, SVD & Trânsito */}
        <SectionCard title="Eliminações, Trânsito e SVD (Protocolo 12h)" icon={Layers} color="text-sky-700" bg="bg-sky-100">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="sky"
              active={d.eliminations?.includes('diurese_espontanea')}
              onClick={() => toggleArrayItem('eliminations', 'diurese_espontanea')}
              label="Diurese Espontânea Clara"
            />
            <Chip
              color="sky"
              active={d.eliminations?.includes('retencao_globo')}
              onClick={() => toggleArrayItem('eliminations', 'retencao_globo')}
              label="Retenção / Globo Vesical"
              badge="Sondagem"
            />
            <Chip
              color="sky"
              active={d.eliminations?.includes('svd_em_uso')}
              onClick={() => toggleArrayItem('eliminations', 'svd_em_uso')}
              label="SVD em Uso"
            />
            <Chip
              color="sky"
              active={d.eliminations?.includes('retirar_svd')}
              onClick={() => toggleArrayItem('eliminations', 'retirar_svd')}
              label="Retirar SVD (12h pós-cesárea)"
              badge="Protocolo"
            />
            <Chip
              color="sky"
              active={d.eliminations?.includes('flatos_presentes')}
              onClick={() => toggleArrayItem('eliminations', 'flatos_presentes')}
              label="Flatos Presentes"
            />
            <Chip
              color="sky"
              active={d.eliminations?.includes('acesso_pervio')}
              onClick={() => toggleArrayItem('eliminations', 'acesso_pervio')}
              label="Acesso Venoso Salinizado"
            />
          </div>
        </SectionCard>
      </div>

      {/* Right Column: Protocols, Rh/MATERGAN, Labs & Pain */}
      <div className="lg:col-span-4 space-y-3">
        {/* Triagem Rh & MATERGAN */}
        <SectionCard title="Triagem Rh & MATERGAN" icon={ShieldAlert} color="text-purple-700" bg="bg-purple-50">
          <div className="space-y-1.5">
            <Chip
              color="purple"
              active={d.rhScreening === 'rh_pos'}
              onClick={() => updateField('rhScreening', 'rh_pos')}
              label="Mãe Rh Positivo (Sem indicação)"
            />
            <Chip
              color="purple"
              active={d.rhScreening === 'rh_neg_rn_pos'}
              onClick={() => updateField('rhScreening', 'rh_neg_rn_pos')}
              label="Mãe Rh(-) c/ RN Rh(+) [MATERGAN]"
              badge="1 AMP IM AGORA"
            />
            <Chip
              color="purple"
              active={d.rhScreening === 'nao_aplica'}
              onClick={() => updateField('rhScreening', 'nao_aplica')}
              label="Tipagem Pendente"
            />
          </div>
        </SectionCard>

        {/* Exames de Alta Obrigatórios (evolucao.txt) */}
        <SectionCard title="Critérios de Alta (Exames Obrigatórios)" icon={TestTube} color="text-teal-700" bg="bg-teal-50">
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold block text-slate-700 mb-1">
                • Paciente só vai de alta com:
              </span>
              <span className="text-[11px] text-slate-500">
                Hemograma, Testes Rápidos (Sífilis, HIV, Hep) e Tipagem Sanguínea.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">TR Sífilis:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <Chip
                  color="amber"
                  active={!d.labExams?.trSifilis || d.labExams?.trSifilis === 'pendente'}
                  onClick={() =>
                    updateField('labExams', { ...d.labExams, trSifilis: 'pendente' })
                  }
                  label="Pendente"
                />
                <Chip
                  color="teal"
                  active={d.labExams?.trSifilis === 'nao_reagente'}
                  onClick={() =>
                    updateField('labExams', { ...d.labExams, trSifilis: 'nao_reagente' })
                  }
                  label="Não Reagente"
                />
                <Chip
                  color="rose"
                  active={d.labExams?.trSifilis === 'reagente'}
                  onClick={() =>
                    updateField('labExams', { ...d.labExams, trSifilis: 'reagente' })
                  }
                  label="Reagente (VDRL)"
                  badge="Penicilina"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Dor e Temperatura */}
        <SectionCard title="Dor e Temperatura" icon={Thermometer} color="text-orange-600" bg="bg-orange-50">
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Escala da Dor (0-10):</label>
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
                  badge="Resgate"
                />
                <Chip
                  color="rose"
                  active={d.painLevel === '7-10'}
                  onClick={() => updateField('painLevel', '7-10')}
                  label="Forte (7 a 10)"
                  badge="Opioide"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Temperatura:</label>
              <div className="grid grid-cols-2 gap-1.5">
                <Chip
                  color="emerald"
                  active={d.temperature === 'afebril'}
                  onClick={() => updateField('temperature', 'afebril')}
                  label="Afebril (<37.8°C)"
                />
                <Chip
                  color="rose"
                  active={d.temperature === 'febril'}
                  onClick={() => updateField('temperature', 'febril')}
                  label="Febril (>=37.8°C)"
                  badge="Investigar"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Atestados e Declarações (Paciente & Acompanhante) */}
        <AtestadoChecklistSection
          data={d}
          onUpdateField={(key, value) => updateField(key as keyof PuerperaData, value)}
          onUpdateBed={onUpdateBed}
          patientType="puerpera"
        />

        {/* Action Button to Prescription */}
        <button
          onClick={onNavigateToPrescription}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <span>Gerar Prescrição Médica</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
