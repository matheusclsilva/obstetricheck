import React from 'react';
import { FileText, Users, Check, Clock } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';
import { Chip } from '../common/Chip';
import { Bed } from '../../types/bed';

interface AtestadoChecklistSectionProps {
  data: {
    atestadoPaciente?: 'nao' | 'sim' | 'licenca_maternidade';
    atestadoPacienteDias?: string;
    atestadoAcompanhante?: 'nao' | 'sim';
    atestadoAcompanhanteNome?: string;
    atestadoAcompanhanteDias?: string;
    [key: string]: any;
  };
  onUpdateField: (key: string, value: any) => void;
  onUpdateBed?: (updates: Partial<Bed>) => void;
  patientType?: 'puerpera' | 'gestante' | 'curetagem';
}

export const AtestadoChecklistSection: React.FC<AtestadoChecklistSectionProps> = ({
  data,
  onUpdateField,
  onUpdateBed,
  patientType = 'puerpera'
}) => {
  const atestadoPac = data.atestadoPaciente || 'nao';
  const atestadoPacDias = data.atestadoPacienteDias || '';
  const atestadoAcomp = data.atestadoAcompanhante || 'nao';
  const acompNome = data.atestadoAcompanhanteNome || '';
  const acompDias = data.atestadoAcompanhanteDias || '';

  const handlePatientAtestadoChange = (val: 'nao' | 'sim' | 'licenca_maternidade') => {
    onUpdateField('atestadoPaciente', val);
    if (val === 'licenca_maternidade' && !atestadoPacDias) {
      onUpdateField('atestadoPacienteDias', '120 dias');
      if (onUpdateBed) onUpdateBed({ atestadoPaciente: val, atestadoPacienteDias: '120 dias' });
    } else if (val === 'sim' && !atestadoPacDias) {
      const defaultDias = patientType === 'curetagem' ? '7 dias' : '14 dias';
      onUpdateField('atestadoPacienteDias', defaultDias);
      if (onUpdateBed) onUpdateBed({ atestadoPaciente: val, atestadoPacienteDias: defaultDias });
    } else {
      if (onUpdateBed) onUpdateBed({ atestadoPaciente: val });
    }
  };

  const handleCompanionAtestadoChange = (val: 'nao' | 'sim') => {
    onUpdateField('atestadoAcompanhante', val);
    if (val === 'sim' && !acompDias) {
      const defaultPeriod = 'Período de internação';
      onUpdateField('atestadoAcompanhanteDias', defaultPeriod);
      if (onUpdateBed) onUpdateBed({ atestadoAcompanhante: val, atestadoAcompanhanteDias: defaultPeriod });
    } else {
      if (onUpdateBed) onUpdateBed({ atestadoAcompanhante: val });
    }
  };

  const quickDaysPatient = patientType === 'curetagem'
    ? ['3 dias', '5 dias', '7 dias', '10 dias', '14 dias']
    : ['7 dias', '14 dias', '15 dias', '30 dias', '120 dias'];

  const quickDaysCompanion = ['Declaração de Horas', '1 dia', '2 dias', 'Período de internação'];

  return (
    <SectionCard
      title="Atestados & Declarações (Alta / Plantão)"
      icon={FileText}
      color="text-indigo-700"
      bg="bg-indigo-100"
      badge={
        atestadoPac !== 'nao' || atestadoAcomp === 'sim'
          ? `${atestadoPac !== 'nao' ? 'Pac: SIM' : ''}${atestadoPac !== 'nao' && atestadoAcomp === 'sim' ? ' | ' : ''}${atestadoAcomp === 'sim' ? 'Acomp: SIM' : ''}`
          : undefined
      }
    >
      <div className="space-y-4">
        {/* 1. Atestado da Paciente */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Paciente precisa de atestado?
            </label>
            {atestadoPac !== 'nao' && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {atestadoPac === 'licenca_maternidade' ? 'Licença Maternidade' : 'Atestado Solicitado'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="emerald"
              active={atestadoPac === 'nao'}
              onClick={() => handlePatientAtestadoChange('nao')}
              label="Não precisa"
            />
            <Chip
              color="purple"
              active={atestadoPac === 'sim'}
              onClick={() => handlePatientAtestadoChange('sim')}
              label="Sim, precisa de atestado"
              badge="Médico"
            />
            {patientType === 'puerpera' && (
              <Chip
                color="teal"
                active={atestadoPac === 'licenca_maternidade'}
                onClick={() => handlePatientAtestadoChange('licenca_maternidade')}
                label="Licença Maternidade"
                badge="120 dias"
              />
            )}
          </div>

          {atestadoPac === 'sim' && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="text-[10px] font-semibold text-indigo-900 uppercase">
                  Dias de Afastamento / Prazo:
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  {quickDaysPatient.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        onUpdateField('atestadoPacienteDias', d);
                        if (onUpdateBed) onUpdateBed({ atestadoPacienteDias: d });
                      }}
                      className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all border cursor-pointer ${
                        atestadoPacDias === d
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={atestadoPacDias}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateField('atestadoPacienteDias', val);
                  if (onUpdateBed) onUpdateBed({ atestadoPacienteDias: val });
                }}
                placeholder="Ex: 14 dias a contar do parto, ou 7 dias de repouso..."
                className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 shadow-2xs"
              />
            </div>
          )}

          {atestadoPac === 'licenca_maternidade' && (
            <div className="p-2.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Licença Maternidade (120 dias)</strong> assinalada para o Sumário e Documentos de Alta.
              </span>
            </div>
          )}
        </div>

        {/* 2. Atestado do Acompanhante */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Acompanhante vai precisar de atestado / declaração?
            </label>
            {atestadoAcomp === 'sim' && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Declaração Acomp.
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip
              color="emerald"
              active={atestadoAcomp === 'nao'}
              onClick={() => handleCompanionAtestadoChange('nao')}
              label="Não precisa"
            />
            <Chip
              color="purple"
              active={atestadoAcomp === 'sim'}
              onClick={() => handleCompanionAtestadoChange('sim')}
              label="Sim, acompanhante precisa de atestado"
              badge="Declaração"
            />
          </div>

          {atestadoAcomp === 'sim' && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-indigo-900 uppercase block mb-1">
                    Nome do Acompanhante (opcional):
                  </label>
                  <input
                    type="text"
                    value={acompNome}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateField('atestadoAcompanhanteNome', val);
                      if (onUpdateBed) onUpdateBed({ atestadoAcompanhanteNome: val });
                    }}
                    placeholder="Nome completo do acompanhante"
                    className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-indigo-900 uppercase">
                      Período / Dias:
                    </label>
                    <div className="flex items-center gap-1">
                      {quickDaysCompanion.slice(0, 2).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            onUpdateField('atestadoAcompanhanteDias', q);
                            if (onUpdateBed) onUpdateBed({ atestadoAcompanhanteDias: q });
                          }}
                          className={`text-[8px] px-1.5 py-0.5 rounded font-bold border cursor-pointer ${
                            acompDias === q
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={acompDias}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateField('atestadoAcompanhanteDias', val);
                      if (onUpdateBed) onUpdateBed({ atestadoAcompanhanteDias: val });
                    }}
                    placeholder="Ex: 2 dias, Durante a internação, etc."
                    className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[9px] text-indigo-800 font-semibold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  Opções Rápidas:
                </span>
                {quickDaysCompanion.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      onUpdateField('atestadoAcompanhanteDias', q);
                      if (onUpdateBed) onUpdateBed({ atestadoAcompanhanteDias: q });
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded font-semibold border cursor-pointer ${
                      acompDias === q
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};
