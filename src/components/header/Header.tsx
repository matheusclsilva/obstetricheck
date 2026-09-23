import React from 'react';
import {
  Stethoscope,
  ClipboardList,
  Printer,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudOff
} from 'lucide-react';
import { StatsSummary } from '../../types/clinical';

interface HeaderProps {
  stats: StatsSummary;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBedManager: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  setActiveTab,
  onOpenBedManager,
  isCloudConnected = false
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-xs">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base tracking-tight">ObstetriCheck</h1>
              <span className="hidden sm:inline-block bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                Posto Maternidade
              </span>
              {isCloudConnected ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200" title="Sincronização em tempo real via Supabase ativa">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  Nuvem
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200" title="Modo Local: Dados salvos no navegador">
                  <CloudOff className="w-3 h-3 text-slate-400" />
                  Local
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Enfermaria Obstétrica • Passagem de Leito, Prescrição & Evolução
            </p>
          </div>
        </div>

        {/* Quick Ward Statistics Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Puérperas: <strong className="text-slate-800">{stats.puerperas}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Gestantes: <strong className="text-slate-800">{stats.gestantes}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Vagos: <strong className="text-slate-800">{stats.vagos}</strong>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Revisados: <strong className="text-slate-800">{stats.reviewed}/{stats.total}</strong>
            </span>
            {stats.alertCount > 0 && (
              <span className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {stats.alertCount} Alertas
              </span>
            )}
          </div>

          {/* Dynamic Bed Manager Button */}
          <button
            onClick={onOpenBedManager}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs"
            title="Gerenciar leitos ativos da maternidade"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Gerenciar Leitos ({stats.total})</span>
            <span className="sm:hidden">Leitos</span>
          </button>

          {/* Shift Summary Toggle Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'shift_summary' ? 'checklist' : 'shift_summary')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeTab === 'shift_summary'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Folha do Plantão</span>
            <span className="sm:hidden">Plantão</span>
          </button>

          {/* Quick Print Button */}
          <button
            onClick={() => window.print()}
            title="Imprimir folha ou evolução"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all text-xs"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
