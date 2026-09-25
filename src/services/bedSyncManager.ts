import { Bed } from '../types/bed';
import { saveBedToSupabase, isSupabaseConfigured, CLIENT_SESSION_ID } from './supabase';

export { CLIENT_SESSION_ID };

// Mapa de leitos aguardando persistência (debounce por leito)
const pendingBedSaves = new Map<number, Bed>();
// Timers ativos de debounce por leito
const debounceTimers = new Map<number, any>();
// Timestamp da última edição local por leito
const lastLocalEditTimestamps = new Map<number, number>();

/**
 * Retorna true se o leito possui salvamento pendente ou se foi editado localmente
 * nos últimos `thresholdMs` milissegundos.
 * Usado para evitar que eventos Realtime externos sobrescrevam o leito ativo
 * enquanto o usuário está no meio da digitação.
 */
export const isBedLockedForRemoteSync = (bedId: number, thresholdMs = 3000): boolean => {
  if (pendingBedSaves.has(bedId)) return true;
  const lastEdit = lastLocalEditTimestamps.get(bedId) || 0;
  return Date.now() - lastEdit < thresholdMs;
};

/**
 * Registra uma edição local no leito e agenda seu salvamento no Supabase via debounce.
 * Se o usuário continuar digitando no mesmo leito, o timer anterior é cancelado
 * e um novo timer é disparado com a versão mais recente do leito.
 */
export const queueBedSave = (bed: Bed, delayMs = 800): void => {
  lastLocalEditTimestamps.set(bed.id, Date.now());
  pendingBedSaves.set(bed.id, bed);

  // Cancela timer anterior se houver
  if (debounceTimers.has(bed.id)) {
    clearTimeout(debounceTimers.get(bed.id));
  }

  if (!isSupabaseConfigured()) {
    // Se o Supabase não estiver configurado, apenas remove após o delay
    const timer = setTimeout(() => {
      pendingBedSaves.delete(bed.id);
      debounceTimers.delete(bed.id);
    }, delayMs);
    debounceTimers.set(bed.id, timer);
    return;
  }

  const timer = setTimeout(async () => {
    debounceTimers.delete(bed.id);
    const bedToSave = pendingBedSaves.get(bed.id);
    if (bedToSave) {
      pendingBedSaves.delete(bed.id);
      await saveBedToSupabase(bedToSave);
    }
  }, delayMs);

  debounceTimers.set(bed.id, timer);
};

/**
 * Salva um leito no Supabase imediatamente, cancelando qualquer debounce pendente para ele.
 * Usado em ações explícitas (ex: marcar revisado, mudar tipo, dar alta).
 */
export const saveBedImmediately = async (bed: Bed): Promise<boolean> => {
  lastLocalEditTimestamps.set(bed.id, Date.now());

  if (debounceTimers.has(bed.id)) {
    clearTimeout(debounceTimers.get(bed.id));
    debounceTimers.delete(bed.id);
  }
  pendingBedSaves.delete(bed.id);

  if (!isSupabaseConfigured()) return true;
  return await saveBedToSupabase(bed);
};

/**
 * Força a execução imediata de todos os salvamentos pendentes ou de um leito específico.
 * Ideal para ser chamado ao trocar de leito, trocar de aba, ou fechar a janela.
 */
export const flushPendingBedSaves = async (bedId?: number): Promise<void> => {
  if (bedId !== undefined) {
    if (debounceTimers.has(bedId)) {
      clearTimeout(debounceTimers.get(bedId));
      debounceTimers.delete(bedId);
    }
    const bed = pendingBedSaves.get(bedId);
    if (bed) {
      pendingBedSaves.delete(bedId);
      if (isSupabaseConfigured()) {
        await saveBedToSupabase(bed);
      }
    }
    return;
  }

  // Flush de todos os leitos pendentes
  const promises: Promise<any>[] = [];
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();

  pendingBedSaves.forEach((bed, id) => {
    pendingBedSaves.delete(id);
    if (isSupabaseConfigured()) {
      promises.push(saveBedToSupabase(bed));
    }
  });

  if (promises.length > 0) {
    await Promise.allSettled(promises);
  }
};

// Registra listeners de ciclo de vida da janela para garantir persistência ao sair
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingBedSaves();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingBedSaves();
    }
  });
}
