import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/header/Header';
import { BedSelector } from './components/beds/BedSelector';
import { BedInfoCard } from './components/beds/BedInfoCard';
import { BedManagerModal } from './components/beds/BedManagerModal';
import { PuerperaChecklist } from './components/checklist/PuerperaChecklist';
import { GestanteChecklist } from './components/checklist/GestanteChecklist';
import { CuretagemChecklist } from './components/checklist/CuretagemChecklist';
import { VagoChecklist } from './components/checklist/VagoChecklist';
import { PrescriptionTab } from './components/prescription/PrescriptionTab';
import { EvolutionTab } from './components/evolution/EvolutionTab';
import { DischargeTab } from './components/discharge/DischargeTab';
import { ShiftSummaryTab } from './components/shiftSummary/ShiftSummaryTab';
import { Toast } from './components/common/Toast';
import { Bed, BedType } from './types/bed';
import { StatsSummary } from './types/clinical';
import { loadBedsFromStorage, saveBedsToStorage } from './utils/storage';
import { analyzeBedAlerts } from './utils/alertAnalyzer';
import {
  createEmptyPuerpera,
  createEmptyGestante,
  createEmptyCuretagem,
  INITIAL_BEDS
} from './constants/defaultBeds';
import {
  isSupabaseConfigured,
  fetchBedsFromSupabase,
  saveBedToSupabase,
  seedBedsToSupabase,
  deleteBedFromSupabase,
  subscribeToBeds
} from './services/supabase';

export default function App() {
  const [beds, setBeds] = useState<Bed[]>(() => loadBedsFromStorage());
  const [activeBedId, setActiveBedId] = useState<number>(() => beds[0]?.id || 1);
  const [activeTab, setActiveTab] = useState<string>('checklist'); // 'checklist', 'prescription', 'evolution', 'discharge', 'shift_summary'
  const [isBedManagerOpen, setIsBedManagerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudActive, setIsCloudActive] = useState<boolean>(() => isSupabaseConfigured());

  // Sincronização inicial e Realtime com o Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    fetchBedsFromSupabase()
      .then(async (remoteBeds) => {
        if (!isMounted) return;
        if (remoteBeds && remoteBeds.length > 0) {
          setBeds(remoteBeds);
          setIsCloudActive(true);
        } else {
          // Se o banco remoto ainda estiver vazio, inicializa com os leitos padrão
          await seedBedsToSupabase(beds);
          setIsCloudActive(true);
        }
      })
      .catch((err) => {
        console.warn('Erro ao conectar com Supabase:', err);
        setIsCloudActive(false);
      });

    // Inscrição Realtime (alterações feitas em outro dispositivo chegam instantaneamente)
    const unsubscribe = subscribeToBeds(
      (incomingBed) => {
        setBeds((prev) => {
          const index = prev.findIndex((b) => b.id === incomingBed.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = incomingBed;
            return next;
          }
          return [...prev, incomingBed];
        });
      },
      (deletedId) => {
        setBeds((prev) => prev.filter((b) => b.id !== deletedId));
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sincronização em Cache Local (LocalStorage)
  useEffect(() => {
    saveBedsToStorage(beds);
  }, [beds]);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const activeBed = useMemo(() => {
    return beds.find((b) => b.id === activeBedId) || beds[0] || INITIAL_BEDS[0];
  }, [beds, activeBedId]);

  const activeAlerts = useMemo(() => analyzeBedAlerts(activeBed), [activeBed]);

  // Statistics calculation
  const stats: StatsSummary = useMemo(() => {
    let puerperas = 0;
    let gestantes = 0;
    let curetagem = 0;
    let vagos = 0;
    let reviewed = 0;
    let alertCount = 0;

    beds.forEach((b) => {
      if (b.type === 'puerpera') puerperas++;
      else if (b.type === 'gestante') gestantes++;
      else if (b.type === 'curetagem') curetagem++;
      else vagos++;

      if (b.isReviewed) reviewed++;
      const al = analyzeBedAlerts(b);
      if (al.length > 0) alertCount++;
    });

    return {
      puerperas,
      gestantes,
      curetagem,
      vagos,
      reviewed,
      alertCount,
      total: beds.length
    };
  }, [beds]);

  // Bed updates
  const handleUpdateBed = (updates: Partial<Bed>) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== activeBedId) return b;
        const updated = { ...b, ...updates };
        saveBedToSupabase(updated);
        return updated;
      })
    );
  };

  const handleUpdateBedData = (updater: (prev: any) => any) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== activeBedId) return b;
        const currentData = b.data || {};
        const updatedData = updater(currentData);

        // Sincroniza bloodPressure do leito se vier valor numérico
        let nextBP = b.bloodPressure;
        if (typeof updatedData.bpValue === 'string' && /\d/.test(updatedData.bpValue)) {
          nextBP = updatedData.bpValue;
        } else if (typeof updatedData.bloodPressure === 'string' && /\d/.test(updatedData.bloodPressure)) {
          nextBP = updatedData.bloodPressure;
        }

        // Sincroniza história obstétrica se vier alterada
        let nextObst = b.obstetricHistory;
        if (typeof updatedData.obstetricHistory === 'string' && updatedData.obstetricHistory.trim()) {
          nextObst = updatedData.obstetricHistory;
        }

        const updatedBed = {
          ...b,
          bloodPressure: nextBP,
          obstetricHistory: nextObst,
          atestadoPaciente: updatedData.atestadoPaciente ?? b.atestadoPaciente,
          atestadoPacienteDias: updatedData.atestadoPacienteDias ?? b.atestadoPacienteDias,
          atestadoAcompanhante: updatedData.atestadoAcompanhante ?? b.atestadoAcompanhante,
          atestadoAcompanhanteNome: updatedData.atestadoAcompanhanteNome ?? b.atestadoAcompanhanteNome,
          atestadoAcompanhanteDias: updatedData.atestadoAcompanhanteDias ?? b.atestadoAcompanhanteDias,
          data: updatedData
        };
        saveBedToSupabase(updatedBed);
        return updatedBed;
      })
    );
  };

  const handleSetBedType = (type: BedType) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== activeBedId) return b;
        let newData = b.data;
        let diagnosis = b.diagnosis;

        if (type === 'puerpera' && b.type !== 'puerpera') {
          newData = createEmptyPuerpera();
          diagnosis = 'Puérpera (Pós-Parto)';
        } else if (type === 'gestante' && b.type !== 'gestante') {
          newData = createEmptyGestante();
          diagnosis = 'Gestante Internada';
        } else if (type === 'curetagem' && b.type !== 'curetagem') {
          newData = createEmptyCuretagem();
          diagnosis = 'Abortamento Incompleto (Curetagem)';
        } else if (type === 'vago') {
          newData = createEmptyPuerpera();
          diagnosis = 'Leito disponível';
        }

        const updated = {
          ...b,
          type,
          data: newData,
          diagnosis,
          patientName:
            type === 'vago'
              ? 'Vago'
              : b.patientName === 'Vago'
              ? `Paciente ${b.label}`
              : b.patientName
        };
        saveBedToSupabase(updated);
        return updated;
      })
    );
    showToast(`Leito ${activeBed.label} alterado para ${type.toUpperCase()}`);
  };

  const handleToggleReviewed = (bedId: number) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        const newStatus = !b.isReviewed;
        showToast(
          newStatus
            ? `${b.label} marcado como REVISADO`
            : `${b.label} marcado como PENDENTE`
        );
        const updated = { ...b, isReviewed: newStatus };
        saveBedToSupabase(updated);
        return updated;
      })
    );
  };

  const handleClearBed = (bedId: number) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        const cleared: Bed = {
          ...b,
          patientName: 'Vago',
          age: '',
          diagnosis: 'Leito disponível',
          admissionDate: '',
          admissionTime: '',
          type: 'vago',
          isReviewed: false,
          avpSite: '',
          avpDate: '',
          pendencias: '',
          intercorrencias: '',
          data: createEmptyPuerpera()
        };
        saveBedToSupabase(cleared);
        return cleared;
      })
    );
    showToast(`Alta registrada para o leito ${activeBed.label}.`);
  };

  // Dynamic Bed Management
  const handleAddBed = (newBedData: Partial<Bed>) => {
    const nextId = Math.max(...beds.map((b) => b.id), 0) + 1;
    const bed: Bed = {
      id: nextId,
      label: newBedData.label || `L-${nextId}`,
      sector: newBedData.sector || 'enf_08',
      patientName: newBedData.patientName || 'Vago',
      age: '',
      admissionDate: '',
      admissionTime: '',
      diagnosis: 'Leito disponível',
      type: 'vago',
      isReviewed: false,
      avpSite: '',
      avpDate: '',
      pendencias: '',
      intercorrencias: '',
      data: createEmptyPuerpera(),
      ...newBedData
    };

    setBeds((prev) => [...prev, bed]);
    setActiveBedId(nextId);
    saveBedToSupabase(bed);
    showToast(`Novo leito ${bed.label} adicionado com sucesso!`);
  };

  const handleRemoveBed = (bedId: number) => {
    if (beds.length <= 1) {
      showToast('O sistema precisa de pelo menos um leito cadastrado.');
      return;
    }
    setBeds((prev) => prev.filter((b) => b.id !== bedId));
    deleteBedFromSupabase(bedId);
    if (activeBedId === bedId) {
      const remaining = beds.filter((b) => b.id !== bedId);
      setActiveBedId(remaining[0]?.id || 1);
    }
    showToast('Leito removido do sistema.');
  };

  const handleResetBeds = () => {
    setBeds(INITIAL_BEDS);
    setActiveBedId(INITIAL_BEDS[0].id);
    seedBedsToSupabase(INITIAL_BEDS);
    showToast('Leitos restaurados para o padrão oficial da maternidade (26 leitos).');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Bed Manager Modal */}
      <BedManagerModal
        isOpen={isBedManagerOpen}
        onClose={() => setIsBedManagerOpen(false)}
        beds={beds}
        onAddBed={handleAddBed}
        onRemoveBed={handleRemoveBed}
        onResetBeds={handleResetBeds}
      />

      {/* Main Top Header */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBedManager={() => setIsBedManagerOpen(true)}
        isCloudConnected={isCloudActive}
      />

      {/* Horizontal Beds Selector */}
      <BedSelector
        beds={beds}
        activeBedId={activeBedId}
        onSelectBed={(id) => {
          setActiveBedId(id);
          if (activeTab === 'shift_summary') setActiveTab('checklist');
        }}
      />

      {/* Active Bed Info Bar (When Not on Full Shift Summary Tab) */}
      {activeTab !== 'shift_summary' && (
        <BedInfoCard
          activeBed={activeBed}
          activeTab={activeTab}
          activeAlerts={activeAlerts}
          setActiveTab={setActiveTab}
          onUpdateBed={handleUpdateBed}
          onSetBedType={handleSetBedType}
          onToggleReviewed={handleToggleReviewed}
          onClearBed={handleClearBed}
        />
      )}

      {/* Active Clinical Alerts Alert Box */}
      {activeAlerts.length > 0 && activeTab !== 'shift_summary' && (
        <div className="bg-rose-50 border-b border-rose-200 px-2.5 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto space-y-1.5">
            {activeAlerts.map((alt, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 text-xs text-rose-900 bg-white/90 p-2 sm:p-2.5 rounded-xl border border-rose-200 shadow-2xs"
              >
                <div>
                  <strong className="font-bold text-rose-700">{alt.title}: </strong>
                  <span>{alt.desc}</span>
                </div>
                {alt.actionRequired && (
                  <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md uppercase shrink-0">
                    {alt.actionRequired}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2.5 sm:py-4 flex-1 w-full">
        {/* TAB 1: CHECKLIST */}
        {activeTab === 'checklist' && (
          <div>
            {activeBed.type === 'vago' ? (
              <VagoChecklist
                bedLabel={activeBed.label}
                onAdmitPatient={handleSetBedType}
              />
            ) : activeBed.type === 'puerpera' ? (
              <PuerperaChecklist
                bed={activeBed}
                onUpdateBed={handleUpdateBed}
                onUpdateData={handleUpdateBedData}
                onNavigateToPrescription={() => setActiveTab('prescription')}
              />
            ) : activeBed.type === 'gestante' ? (
              <GestanteChecklist
                bed={activeBed}
                onUpdateBed={handleUpdateBed}
                onUpdateData={handleUpdateBedData}
                onNavigateToPrescription={() => setActiveTab('prescription')}
              />
            ) : (
              <CuretagemChecklist
                bed={activeBed}
                onUpdateBed={handleUpdateBed}
                onUpdateData={handleUpdateBedData}
                onNavigateToPrescription={() => setActiveTab('prescription')}
              />
            )}
          </div>
        )}

        {/* TAB 2: PRESCRIÇÃO */}
        {activeTab === 'prescription' && (
          <PrescriptionTab
            bed={activeBed}
            onShowToast={showToast}
            onNavigateToEvolution={() => setActiveTab('evolution')}
          />
        )}

        {/* TAB 3: EVOLUÇÃO (evolucao.txt) */}
        {activeTab === 'evolution' && (
          <EvolutionTab
            bed={activeBed}
            onUpdateBed={handleUpdateBed}
            onShowToast={showToast}
            onNavigateToDischarge={() => setActiveTab('discharge')}
          />
        )}

        {/* TAB 4: DOCUMENTOS DE ALTA & RECEITUÁRIO */}
        {activeTab === 'discharge' && (
          <DischargeTab bed={activeBed} onShowToast={showToast} />
        )}

        {/* TAB 5: FOLHA OFICIAL DO PLANTÃO */}
        {activeTab === 'shift_summary' && (
          <ShiftSummaryTab
            beds={beds}
            onSelectBed={(id) => {
              setActiveBedId(id);
              setActiveTab('checklist');
            }}
            onShowToast={showToast}
          />
        )}
      </main>
    </div>
  );
}
