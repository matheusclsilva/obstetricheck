import React, { useState } from 'react';
import { Copy, Printer, Edit3, Check, Info, FileText, ShieldAlert } from 'lucide-react';
import { Bed } from '../../types/bed';
import { generatePrescriptionText } from '../../utils/prescriptionGenerator';
import { parseAndEvaluateBP, getBedBP } from '../../utils/bpAnalyzer';

interface PrescriptionTabProps {
  bed: Bed;
  onShowToast: (msg: string) => void;
  onNavigateToEvolution: () => void;
}

export const PrescriptionTab: React.FC<PrescriptionTabProps> = ({
  bed,
  onShowToast,
  onNavigateToEvolution
}) => {
  const generatedText = generatePrescriptionText(bed);
  const [customText, setCustomText] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentBP = getBedBP(bed);
  const bpEval = parseAndEvaluateBP(currentBP);

  const displayText = customText !== null ? customText : generatedText;

  const copyToClipboard = () => {
    if (!navigator?.clipboard) {
      onShowToast('Área de transferência indisponível');
      return;
    }
    navigator.clipboard
      .writeText(displayText)
      .then(() => {
        onShowToast('Prescrição copiada com sucesso!');
      })
      .catch(() => {
        onShowToast('Erro ao copiar.');
      });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        {/* Tab Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              Prescrição Médica Obstétrica
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {bed.label} - {bed.patientName}
            </h2>
            <p className="text-xs text-slate-500">
              Ajustada conforme protocolos do posto (Retirada de SVD em 12h, via oral no D1, MATERGAN se Rh-).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Visualizar' : 'Editar'}</span>
            </button>

            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Prescrição</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-xs cursor-pointer"
              title="Imprimir Prescrição"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
 
        {/* Banner de Crise Hipertensiva Auto-detectada */}
        {bpEval.isHypertensiveCrisis && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
              <div>
                <strong className="font-bold text-rose-700">Crise Hipertensiva Auto-Detectada ({bpEval.shortFormatted} mmHg): </strong>
                <span>Risco de AVC / Eclâmpsia. Protocolo Zuspan (Sulfato de Magnésio) e Hidralazina EV prioritários.</span>
              </div>
            </div>
            <button
              onClick={() => {
                const zuspanText = `\n\n[EMERGÊNCIA OBSTÉTRICA - PROTOCOLO ZUSPAN / SULFATAÇÃO]:\n* CHAMAR PLANTONISTA IMEDIATAMENTE!\n* Sulfato de Magnésio 50% 4g (8ml) + 12ml SG 5% EV em 15 a 20 minutos (Ataque).\n* Sulfato de Magnésio 1g/h a 2g/h em BIC contínua por 24 horas (Manutenção).\n* Ter à beira do leito: Gluconato de Cálcio 10% 1 ampola (Antídoto).\n* Se PAS >= 160 ou PAD >= 110: Hidralazina 5mg EV lento em bolus (repetir se refratário).`;
                setCustomText((prev) => (prev ? `${prev}${zuspanText}` : `${generatedText}${zuspanText}`));
                setIsEditing(true);
                onShowToast('Protocolo Zuspan adicionado à prescrição!');
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
            >
              + Adicionar Zuspan
            </button>
          </div>
        )}

        {/* Content Box */}
        {isEditing ? (
          <textarea
            value={displayText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={18}
            className="w-full bg-slate-50 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        ) : (
          <div className="bg-slate-50/80 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200 whitespace-pre-wrap select-all print-area">
            {displayText}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            Clique em "Copiar Prescrição" e cole diretamente no Prontuário Eletrônico do Paciente (PEP).
          </span>

          <button
            onClick={onNavigateToEvolution}
            className="font-bold text-teal-700 hover:underline flex items-center gap-1 self-end sm:self-auto cursor-pointer"
          >
            <span>Ver Evolução Médica</span>
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
