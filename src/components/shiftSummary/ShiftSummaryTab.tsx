import React, { useState } from 'react';
import {
  ClipboardList,
  Copy,
  Printer,
  Table as TableIcon,
  LayoutGrid,
  AlertTriangle,
  Check,
  CheckCircle2
} from 'lucide-react';
import { Bed, Sector } from '../../types/bed';
import { analyzeBedAlerts } from '../../utils/alertAnalyzer';
import { SECTORS } from '../../constants/defaultBeds';
import { parseAndEvaluateBP, getBedBP } from '../../utils/bpAnalyzer';

interface ShiftSummaryTabProps {
  beds: Bed[];
  onSelectBed: (bedId: number) => void;
  onShowToast: (msg: string) => void;
}

export const ShiftSummaryTab: React.FC<ShiftSummaryTabProps> = ({
  beds,
  onSelectBed,
  onShowToast
}) => {
  const [selectedSector, setSelectedSector] = useState<Sector | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredBeds = beds.filter((b) => {
    if (selectedSector !== 'all' && b.sector !== selectedSector) return false;
    return true;
  });

  const copyConsolidatedList = () => {
    if (!navigator?.clipboard) return;

    const today = new Date().toLocaleDateString('pt-BR');
    const lines: string[] = [];
    lines.push(`PASSAGEM DE PLANTÃO - MATERNIDADE (${today})`);
    lines.push(`================================================================`);

    filteredBeds
      .filter((b) => b.type !== 'vago')
      .forEach((b) => {
        const al = analyzeBedAlerts(b);
        const alertTag = al.length > 0 ? ` [⚠️ ${al.map((a) => a.title).join(', ')}]` : '';
        lines.push(
          `• Leito ${b.label}: ${b.patientName} (${b.age || 's/ idade'}) | Diag: ${b.diagnosis || b.type}${alertTag}`
        );
        if (b.pendencias) lines.push(`  Pendências: ${b.pendencias}`);
        if (b.intercorrencias) lines.push(`  Obs: ${b.intercorrencias}`);
        if (b.avpSite) lines.push(`  AVP: ${b.avpSite} (${b.avpDate || ''})`);
        lines.push(`----------------------------------------------------------------`);
      });

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => onShowToast('Resumo de plantão copiado!'))
      .catch(() => onShowToast('Erro ao copiar'));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <span>Passagem de Plantão - Maternidade</span>
          </h2>
          <p className="text-xs text-slate-500">
            Espelho do documento oficial com leitos ativos, diagnósticos, recém-nascidos, AVP e pendências.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value as Sector | 'all')}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Todas as Enfermarias ({beds.length})</option>
            {SECTORS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Visualização em Tabela (Documento Oficial)"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Visualização em Cards Rápidos"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={copyConsolidatedList}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Resumo</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="p-1.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-xs cursor-pointer"
            title="Imprimir Folha do Plantão"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW 1: TABLE FORMAT (Mirroring the Official PDF Sheet) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs print-area">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 border border-purple-800 text-center w-16">Leito</th>
                  <th className="p-3 border border-purple-800 min-w-[200px]">Nome / Admissão</th>
                  <th className="p-3 border border-purple-800 text-center w-12">Idade</th>
                  <th className="p-3 border border-purple-800 min-w-[170px]">Diagnóstico</th>
                  <th className="p-3 border border-purple-800 text-center w-16">SSVV</th>
                  <th className="p-3 border border-purple-800 min-w-[220px]">
                    Intercorrências / Observações / Exames
                  </th>
                  <th className="p-3 border border-purple-800 min-w-[140px]">RN</th>
                  <th className="p-3 border border-purple-800 min-w-[180px]">Pendências</th>
                  <th className="p-3 border border-purple-800 text-center w-24">AVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBeds.map((bed, idx) => {
                  const alerts = analyzeBedAlerts(bed);
                  const isVago = bed.type === 'vago';

                  return (
                    <tr
                      key={bed.id}
                      onClick={() => onSelectBed(bed.id)}
                      className={`hover:bg-teal-50/40 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      } ${alerts.length > 0 ? 'bg-rose-50/30' : ''}`}
                    >
                      {/* Leito */}
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-slate-900">
                        {bed.label}
                      </td>

                      {/* Nome / Admissão */}
                      <td className="p-2.5 border border-slate-200">
                        {isVago ? (
                          <span className="text-slate-400 italic">Leito Vago</span>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 block">{bed.patientName}</span>
                            {bed.admissionDate && (
                              <span className="text-[10px] text-slate-500 block">
                                Adm: {bed.admissionDate} {bed.admissionTime ? `às ${bed.admissionTime}` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Idade */}
                      <td className="p-2.5 border border-slate-200 text-center font-medium text-slate-700">
                        {bed.age || '-'}
                      </td>

                      {/* Diagnóstico & Paridade */}
                      <td className="p-2.5 border border-slate-200 font-semibold text-slate-800">
                        <div>{bed.diagnosis || (isVago ? '-' : bed.type)}</div>
                        {bed.obstetricHistory && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                            {bed.obstetricHistory}
                          </span>
                        )}
                      </td>

                      {/* SSVV Auto-Detectado */}
                      <td className="p-2.5 border border-slate-200 text-center text-slate-600 font-medium">
                        {(() => {
                          if (isVago) return '-';
                          const rawBP = getBedBP(bed);
                          const bp = parseAndEvaluateBP(rawBP);
                          if (bp.classification === 'vazio') return 'EST';
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-bold text-xs text-slate-800">{bp.shortFormatted || rawBP}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${bp.badgeColor}`}>
                                {bp.badgeLabel}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Intercorrências / Observações */}
                      <td className="p-2.5 border border-slate-200 text-slate-600">
                        <div className="space-y-1">
                          {bed.intercorrencias && <div>{bed.intercorrencias}</div>}
                          {alerts.length > 0 && (
                            <div className="text-[11px] font-bold text-rose-700 bg-rose-50 p-1 rounded border border-rose-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{alerts[0].title}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* RN */}
                      <td className="p-2.5 border border-slate-200 text-slate-700 text-[11px]">
                        {bed.rn ? (
                          <div className="space-y-0.5">
                            <div>Alimentação: <strong>{bed.rn.feeding}</strong></div>
                            {bed.rn.heartTest && (
                              <div className="text-purple-700 font-semibold">
                                Teste ❤: {bed.rn.heartTest.toUpperCase()} {bed.rn.heartTestDate || ''}
                              </div>
                            )}
                            {bed.rn.weight && <div>Peso: {bed.rn.weight}</div>}
                          </div>
                        ) : bed.type === 'puerpera' ? (
                          <span className="text-slate-500">AMEX | EF+</span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Pendências */}
                      <td className="p-2.5 border border-slate-200 text-slate-700 font-medium">
                        {bed.pendencias || (bed.isReviewed ? 'Nenhuma pendência' : 'Revisão do plantão')}
                      </td>

                      {/* AVP */}
                      <td className="p-2.5 border border-slate-200 text-center text-slate-700 font-medium">
                        {bed.avpSite ? `${bed.avpSite} ${bed.avpDate || ''}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: CARDS FORMAT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBeds.map((bed) => {
            const alerts = analyzeBedAlerts(bed);
            const hasAlerts = alerts.length > 0;

            return (
              <div
                key={bed.id}
                onClick={() => onSelectBed(bed.id)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md hover:border-teal-400 ${
                  hasAlerts
                    ? 'border-rose-300 ring-1 ring-rose-100'
                    : bed.isReviewed
                    ? 'border-slate-200'
                    : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{bed.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        bed.type === 'puerpera'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : bed.type === 'gestante'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : bed.type === 'curetagem'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {bed.type === 'puerpera'
                        ? 'Puérpera'
                        : bed.type === 'gestante'
                        ? 'Gestante'
                        : bed.type === 'curetagem'
                        ? 'Curetagem'
                        : 'Vago'}
                    </span>
                  </div>

                  {bed.isReviewed && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      OK
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 mb-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {bed.patientName} {bed.age && `(${bed.age})`}
                  </p>
                  {bed.obstetricHistory && (
                    <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                      {bed.obstetricHistory}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 gap-2">
                  <span className="truncate">{bed.diagnosis || 'Sem diagnóstico registrado'}</span>
                  {(() => {
                    const rawBP = getBedBP(bed);
                    const bp = parseAndEvaluateBP(rawBP);
                    if (bp.classification === 'vazio') return null;
                    return (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${bp.badgeColor}`}>
                        PA {bp.shortFormatted || rawBP}
                      </span>
                    );
                  })()}
                </div>

                {bed.pendencias && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/70 p-1.5 rounded-lg mb-2">
                    <strong>Pendência:</strong> {bed.pendencias}
                  </div>
                )}

                {hasAlerts && (
                  <div className="pt-2 border-t border-rose-100 flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">{alerts[0].title}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
