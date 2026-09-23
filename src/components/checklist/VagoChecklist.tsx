import React from 'react';
import { BedDouble, Baby, HeartPulse, ShieldCheck } from 'lucide-react';
import { BedType } from '../../types/bed';

interface VagoChecklistProps {
  bedLabel: string;
  onAdmitPatient: (type: BedType) => void;
}

export const VagoChecklist: React.FC<VagoChecklistProps> = ({
  bedLabel,
  onAdmitPatient
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 max-w-md mx-auto my-8 shadow-xs">
      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BedDouble className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-slate-800 text-base mb-1">
        Leito {bedLabel} - Desocupado
      </h3>
      <p className="text-xs text-slate-500 mb-6">
        Para iniciar o acompanhamento, selecione o perfil clínico da paciente a ser admitida:
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onAdmitPatient('puerpera')}
          className="px-4 py-3 rounded-2xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Baby className="w-4 h-4" />
          <span>Admitir Puérpera (Pós-Parto Normal / Cesárea)</span>
        </button>

        <button
          onClick={() => onAdmitPatient('gestante')}
          className="px-4 py-3 rounded-2xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <HeartPulse className="w-4 h-4" />
          <span>Admitir Gestante (Pré-Parto / Internação)</span>
        </button>

        <button
          onClick={() => onAdmitPatient('curetagem')}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admitir Curetagem (Pós-Aborto)</span>
        </button>
      </div>
    </div>
  );
};
