import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  loadBedsFromStorage,
  saveBedsToStorage,
  getInitialActiveBedId,
  getInitialActiveTab,
  saveActiveBedId,
  saveActiveTab,
  syncNavigationUrl,
  VALID_TABS
} from './utils/storage';
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
  seedBedsToSupabase,
  deleteBedFromSupabase,
  subscribeToBeds
} from './services/supabase';
import {
  queueBedPatch,
  replaceBed,
  flushPendingBedSaves,
  mergeIncomingBed,
  reconcileBedLists,
  forgetBed,
  forgetAllBeds,
  getPendingSyncCount,
  onPendingSyncChange
} from './services/bedSyncManager';

/**
 * Campos zerados de um leito na alta / nova admissão.
 * TODOS os campos clínicos precisam ser limpos, senão a próxima paciente
 * do leito herdaria HDA, exames, conduta, PA etc. da anterior.
 */
const clearedPatientFields = (): Partial<Bed> => ({
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
  obstetricHistory: '',
  bloodPressure: '',
  hda: '',
  hdaDetails: '',
  comorbidades: '',
  muc: '',
  alergias: '',
  alergiaStatus: undefined,
  queixasAdicionais: '',
  internmentDays: 1,
  examesLabText: '',
  hdText: '',
  condutaText: '',
  rn: undefined,
  atestadoPaciente: 'nao',
  atestadoPacienteDias: '',
  atestadoAcompanhante: 'nao',
  atestadoAcompanhanteNome: '',
  atestadoAcompanhanteDias: '',
  data: createEmptyPuerpera()
});

export default function App() {
  const [beds, setBeds] = useState<Bed[]>(() => loadBedsFromStorage());
  const [activeBedId, setActiveBedId] = useState<number>(() => getInitialActiveBedId(beds));
  const [activeTab, setActiveTab] = useState<string>(() => getInitialActiveTab());
  const [isBedManagerOpen, setIsBedManagerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudActive, setIsCloudActive] = useState<boolean>(() => isSupabaseConfigured());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncCount());
  const bedsRef = useRef<Bed[]>(beds);

  useEffect(() => {
    bedsRef.current = beds;
  }, [beds]);

  // Contador de alterações ainda não confirmadas pelo servidor (exibido no cabeçalho).
  // Só aparece se a pendência durar mais de 2,5 s, para não piscar a cada tecla.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onPendingSyncChange((n) => {
      if (timer) clearTimeout(timer);
      if (n === 0) setPendingSyncCount(0);
      else timer = setTimeout(() => setPendingSyncCount(getPendingSyncCount()), 2500);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Sincroniza a URL inicial e dá suporte aos botões Voltar/Avançar do navegador
  useEffect(() => {
    syncNavigationUrl(activeBedId, activeTab);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const bedParam = params.get('bed');
      const tabParam = params.get('tab');
      if (bedParam) {
        const id = Number(bedParam);
        if (!isNaN(id)) {
          setActiveBedId(id);
          saveActiveBedId(id);
        }
      }
      if (tabParam && VALID_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
        saveActiveTab(tabParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sincronização com o Supabase: carga inicial, Realtime e ressincronização automática
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    let resyncRunning = false;
    let lastResync = 0;

    const resync = async (reason: 'initial' | 'reconnect' | 'visible' | 'online' | 'interval') => {
      if (!isMounted || resyncRunning) return;
      if (reason !== 'initial' && Date.now() - lastResync < 3000) return;
      resyncRunning = true;
      lastResync = Date.now();
      try {
        // 1. Envia primeiro o que ficou pendente neste aparelho (ex.: editado sem internet)
        await flushPendingBedSaves();
        // 2. Busca o estado completo e atual do servidor
        const result = await fetchBedsFromSupabase();
        if (!isMounted) return;
        if (!result.ok) {
          // Falha de rede: NÃO sobrescreve nada; tenta de novo no próximo gatilho
          setIsCloudActive(false);
          return;
        }
        if (result.beds.length === 0) {
          // Banco realmente vazio (primeiro uso): inicializa com os leitos deste aparelho
          if (reason === 'initial') await seedBedsToSupabase(bedsRef.current);
          setIsCloudActive(true);
          return;
        }
        // 3. Mescla: edições dos colegas entram; o que está sendo digitado aqui é preservado
        setBeds((prev) => reconcileBedLists(prev, result.beds));
        setIsCloudActive(true);
      } finally {
        resyncRunning = false;
      }
    };

    resync('initial');

    // Inscrição Realtime (alterações feitas em outro dispositivo chegam instantaneamente)
    let subscribedOnce = false;
    const unsubscribe = subscribeToBeds(
      (incomingBed) => {
        setBeds((prev) => {
          const index = prev.findIndex((b) => b.id === incomingBed.id);
          if (index >= 0) {
            const next = [...prev];
            // Mescla campo a campo em vez de descartar: só o que está em edição local é mantido
            next[index] = mergeIncomingBed(prev[index], incomingBed);
            return next;
          }
          return [...prev, mergeIncomingBed(undefined, incomingBed)].sort((a, b) => a.id - b.id);
        });
      },
      (deletedId) => {
        forgetBed(deletedId);
        setBeds((prev) => prev.filter((b) => b.id !== deletedId));
      },
      (status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          setIsCloudActive(true);
          // Reconectou após queda: recupera tudo que mudou enquanto estava desconectado
          if (subscribedOnce) resync('reconnect');
          subscribedOnce = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsCloudActive(false);
        }
      }
    );

    // Celular desbloqueado / aba reaberta / Wi-Fi voltou / checagem periódica
    const onVisible = () => {
      if (document.visibilityState === 'visible') resync('visible');
    };
    const onOnline = () => resync('online');
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') resync('interval');
    }, 120000);

    return () => {
      isMounted = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
      flushPendingBedSaves();
    };
  }, []);

  // Se o leito ativo foi removido (aqui ou em outro aparelho), seleciona outro
  useEffect(() => {
    if (beds.length > 0 && !beds.some((b) => b.id === activeBedId)) {
      const fallbackId = beds[0].id;
      setActiveBedId(fallbackId);
      saveActiveBedId(fallbackId);
      syncNavigationUrl(fallbackId, activeTab);
    }
  }, [beds, activeBedId]);

  // Sincronização em Cache Local (LocalStorage) com debounce de 400ms para manter a digitação fluida
  useEffect(() => {
    const timer = setTimeout(() => {
      saveBedsToStorage(beds);
    }, 400);

    return () => clearTimeout(timer);
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

  // Bed updates com digitação suave e debounced sync
  const handleUpdateBed = (updates: Partial<Bed>) => {
    setBeds((prev) => {
      const index = prev.findIndex((b) => b.id === activeBedId);
      if (index === -1) return prev;
      const updated = { ...prev[index], ...updates };
      queueBedPatch(prev[index], updated);
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleUpdateBedData = (updater: (prev: any) => any) => {
    setBeds((prev) => {
      const index = prev.findIndex((b) => b.id === activeBedId);
      if (index === -1) return prev;
      const b = prev[index];
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

      queueBedPatch(b, updatedBed);
      const next = [...prev];
      next[index] = updatedBed;
      return next;
    });
  };

  const handleSetBedType = (type: BedType) => {
    setBeds((prev) =>
      prev.map((current) => {
        if (current.id !== activeBedId) return current;
        // Alta (-> vago): leito totalmente limpo.
        // Admissão num leito vago: limpa dados clínicos que tenham sobrado, mas mantém a
        // identificação que já foi digitada para a NOVA paciente (nome, idade, entrada, AVP).
        let b: Bed = current;
        if (type === 'vago') {
          b = { ...current, ...clearedPatientFields() } as Bed;
        } else if (current.type === 'vago') {
          b = {
            ...current,
            ...clearedPatientFields(),
            patientName: current.patientName,
            age: current.age,
            admissionDate: current.admissionDate,
            admissionTime: current.admissionTime,
            avpSite: current.avpSite,
            avpDate: current.avpDate
          } as Bed;
        }
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
        replaceBed(updated);
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
        // Só o campo "revisado" é enviado (não apaga edições de colegas no mesmo leito)
        queueBedPatch(b, updated, 0);
        return updated;
      })
    );
  };

  const handleClearBed = (bedId: number) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        const cleared = { ...b, ...clearedPatientFields() } as Bed;
        replaceBed(cleared);
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
    saveActiveBedId(nextId);
    syncNavigationUrl(nextId, activeTab);
    replaceBed(bed);
    showToast(`Novo leito ${bed.label} adicionado com sucesso!`);
  };

  const handleRemoveBed = (bedId: number) => {
    if (beds.length <= 1) {
      showToast('O sistema precisa de pelo menos um leito cadastrado.');
      return;
    }
    forgetBed(bedId);
    setBeds((prev) => prev.filter((b) => b.id !== bedId));
    deleteBedFromSupabase(bedId);
    if (activeBedId === bedId) {
      const remaining = beds.filter((b) => b.id !== bedId);
      const nextId = remaining[0]?.id || 1;
      setActiveBedId(nextId);
      saveActiveBedId(nextId);
      syncNavigationUrl(nextId, activeTab);
    }
    showToast('Leito removido do sistema.');
  };

  const handleResetBeds = () => {
    forgetAllBeds();
    setBeds(INITIAL_BEDS);
    const firstId = INITIAL_BEDS[0].id;
    setActiveBedId(firstId);
    saveActiveBedId(firstId);
    syncNavigationUrl(firstId, activeTab);
    seedBedsToSupabase(INITIAL_BEDS);
    showToast('Leitos restaurados para o padrão oficial da maternidade (26 leitos).');
  };

  const handleSelectBed = (id: number) => {
    if (id !== activeBedId) {
      flushPendingBedSaves(activeBedId);
      setActiveBedId(id);
      saveActiveBedId(id);
      syncNavigationUrl(id, activeTab);
    }
  };

  const handleTabChange = (tab: string) => {
    flushPendingBedSaves(activeBedId);
    setActiveTab(tab);
    saveActiveTab(tab);
    syncNavigationUrl(activeBedId, tab);
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
        setActiveTab={handleTabChange}
        onOpenBedManager={() => setIsBedManagerOpen(true)}
        isCloudConnected={isCloudActive}
        isCloudConfigured={isSupabaseConfigured()}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Horizontal Beds Selector */}
      <BedSelector
        beds={beds}
        activeBedId={activeBedId}
        onSelectBed={(id) => {
          handleSelectBed(id);
          if (activeTab === 'shift_summary') handleTabChange('checklist');
        }}
      />

      {/* Active Bed Info Bar (When Not on Full Shift Summary Tab) */}
      {activeTab !== 'shift_summary' && (
        <BedInfoCard
          activeBed={activeBed}
          activeTab={activeTab}
          activeAlerts={activeAlerts}
          setActiveTab={handleTabChange}
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
                onNavigateToPrescription={() => handleTabChange('prescription')}
              />
            ) : activeBed.type === 'gestante' ? (
              <GestanteChecklist
                bed={activeBed}
                onUpdateBed={handleUpdateBed}
                onUpdateData={handleUpdateBedData}
                onNavigateToPrescription={() => handleTabChange('prescription')}
              />
            ) : (
              <CuretagemChecklist
                bed={activeBed}
                onUpdateBed={handleUpdateBed}
                onUpdateData={handleUpdateBedData}
                onNavigateToPrescription={() => handleTabChange('prescription')}
              />
            )}
          </div>
        )}

        {/* TAB 2: PRESCRIÇÃO */}
        {activeTab === 'prescription' && (
          <PrescriptionTab
            bed={activeBed}
            onShowToast={showToast}
            onNavigateToEvolution={() => handleTabChange('evolution')}
          />
        )}

        {/* TAB 3: EVOLUÇÃO (evolucao.txt) */}
        {activeTab === 'evolution' && (
          <EvolutionTab
            bed={activeBed}
            onUpdateBed={handleUpdateBed}
            onShowToast={showToast}
            onNavigateToDischarge={() => handleTabChange('discharge')}
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
              handleSelectBed(id);
              handleTabChange('checklist');
            }}
            onShowToast={showToast}
          />
        )}
      </main>
    </div>
  );
}
