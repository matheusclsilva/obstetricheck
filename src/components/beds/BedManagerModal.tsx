import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, BedDouble, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Bed, Sector } from '../../types/bed';
import { SECTORS, createEmptyPuerpera } from '../../constants/defaultBeds';

interface BedManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  beds: Bed[];
  onAddBed: (newBed: Partial<Bed>) => void;
  onRemoveBed: (bedId: number) => void;
  onResetBeds: () => void;
}

export const BedManagerModal: React.FC<BedManagerModalProps> = ({
  isOpen,
  onClose,
  beds,
  onAddBed,
  onRemoveBed,
  onResetBeds
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newSector, setNewSector] = useState<Sector>('enf_08');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    onAddBed({
      label: newLabel.trim().toUpperCase(),
      sector: newSector,
      patientName: 'Vago',
      type: 'vago',
      isReviewed: false,
      diagnosis: 'Leito disponível',
      admissionDate: '',
      admissionTime: '',
      avpSite: '',
      avpDate: '',
      pendencias: '',
      intercorrencias: '',
      data: createEmptyPuerpera()
    });

    setNewLabel('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciamento Dinâmico de Leitos da Maternidade">
      <div className="space-y-5">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-xs text-teal-900 flex items-start gap-2">
          <BedDouble className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            A quantidade de leitos varia diariamente conforme o fluxo do plantão. Aqui você pode <strong>adicionar novos leitos</strong> (ex: leitos extras, macas ou berços) ou <strong>remover leitos inativos</strong>.
          </div>
        </div>

        {/* Add Bed Form */}
        <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3">
          <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
            Adicionar Novo Leito
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-5">
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Identificação / Número:</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: 08/06, MACA 01, LÍRIO 03"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Enfermaria / Setor:</label>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value as Sector)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 font-medium"
              >
                {SECTORS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Beds List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
              Leitos Cadastrados no Sistema ({beds.length})
            </h4>
            <button
              type="button"
              onClick={onResetBeds}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              title="Restaurar os 26 leitos originais da Maternidade Promorar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão Hospitalar</span>
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
            {beds.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs hover:border-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 w-16">{b.label}</span>
                  <span className="text-slate-500 truncate max-w-[180px]">
                    {b.type === 'vago' ? 'Leito Vago' : b.patientName}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    {b.sector.replace('enf_', 'Enf ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveBed(b.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remover este leito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
