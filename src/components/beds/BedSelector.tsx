import React, { useState } from 'react';
import { Check, Search, Filter } from 'lucide-react';
import { Bed, Sector } from '../../types/bed';
import { analyzeBedAlerts } from '../../utils/alertAnalyzer';
import { SECTORS } from '../../constants/defaultBeds';

interface BedSelectorProps {
  beds: Bed[];
  activeBedId: number;
  onSelectBed: (bedId: number) => void;
}

export const BedSelector: React.FC<BedSelectorProps> = ({
  beds,
  activeBedId,
  onSelectBed
}) => {
  const [selectedSector, setSelectedSector] = useState<Sector | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBeds = beds.filter((bed) => {
    if (selectedSector !== 'all' && bed.sector !== selectedSector) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchLabel = bed.label.toLowerCase().includes(term);
      const matchName = bed.patientName.toLowerCase().includes(term);
      const matchDiagnosis = bed.diagnosis?.toLowerCase().includes(term);
      return matchLabel || matchName || matchDiagnosis;
    }
    return true;
  });

  return (
    <div className="bg-slate-50 border-b border-slate-200/80 px-2.5 sm:px-6 py-2 space-y-1.5 sm:space-y-2">
      {/* Top Filter Bar: Sectors + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
        {/* Sector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedSector === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({beds.length})
          </button>
          {SECTORS.map((sec) => {
            const count = beds.filter((b) => b.sector === sec.key).length;
            const isSelected = selectedSector === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setSelectedSector(sec.key)}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sec.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar leito ou paciente..."
            className="w-full text-xs pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Horizontal Beds Carousel */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
        {filteredBeds.map((bed) => {
          const isSelected = bed.id === activeBedId;
          const alerts = analyzeBedAlerts(bed);
          const hasAlerts = alerts.length > 0;

          let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
          let dotColor = 'bg-slate-400';
          let badgeLabel = 'VAGO';

          if (bed.type === 'puerpera') {
            badgeColor = 'bg-purple-100 text-purple-700 border-purple-200';
            dotColor = 'bg-purple-500';
            badgeLabel = 'P';
          } else if (bed.type === 'gestante') {
            badgeColor = 'bg-sky-100 text-sky-700 border-sky-200';
            dotColor = 'bg-sky-500';
            badgeLabel = 'G';
          } else if (bed.type === 'curetagem') {
            badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';
            dotColor = 'bg-amber-500';
            badgeLabel = 'C';
          }

          return (
            <button
              key={bed.id}
              onClick={() => onSelectBed(bed.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-slate-900 shadow-sm text-slate-900 ring-2 ring-slate-900/10'
                  : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                <span className="font-bold">{bed.label}</span>
              </div>

              {bed.type !== 'vago' ? (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border ${badgeColor}`}>
                  {badgeLabel}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">vago</span>
              )}

              {bed.isReviewed && (
                <span title="Revisado no plantão">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </span>
              )}

              {hasAlerts && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="Alerta clínico"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
