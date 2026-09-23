import React from 'react';
import { Copy, Printer, CheckSquare, FileCheck } from 'lucide-react';
import { Bed } from '../../types/bed';
import { generateDischargePaperwork } from '../../utils/evolutionGenerator';

interface DischargeTabProps {
  bed: Bed;
  onShowToast: (msg: string) => void;
}

export const DischargeTab: React.FC<DischargeTabProps> = ({ bed, onShowToast }) => {
  const dischargeText = generateDischargePaperwork(bed);

  const copyToClipboard = () => {
    if (!navigator?.clipboard) {
      onShowToast('Área de transferência indisponível');
      return;
    }
    navigator.clipboard
      .writeText(dischargeText)
      .then(() => {
        onShowToast('Documentos e receituário de alta copiados!');
      })
      .catch(() => {
        onShowToast('Erro ao copiar.');
      });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Alta Hospitalar & Receituário
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Documentos de Alta - {bed.label} ({bed.patientName})
            </h2>
            <p className="text-xs text-slate-500">
              Vias obrigatórias e receituário ambulatorial conforme protocolo de evolucao.txt.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Alta & Receituário</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-xs cursor-pointer"
              title="Imprimir Documentos de Alta"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200 whitespace-pre-wrap select-all print-area">
          {dischargeText}
        </div>
      </div>
    </div>
  );
};
