import { Bed } from '../types/bed';
import { isSupabaseConfigured, patchBedInSupabase, CLIENT_SESSION_ID } from './supabase';
import {
  BedPatch,
  ProtectedKeys,
  diffBeds,
  isPatchEmpty,
  mergePatches,
  mergeRemoteBed
} from './syncCore';

export { CLIENT_SESSION_ID };

/**
 * GERENCIADOR DE SINCRONIZAÇÃO
 *
 * 1. Cada edição local vira um "patch" só com os campos alterados (não o leito inteiro).
 * 2. Os patches ficam numa FILA (outbox) salva no localStorage: se a rede cair ou a
 *    página fechar antes do envio, nada se perde — é reenviado quando a conexão voltar.
 * 3. Atualizações vindas de outros aparelhos são MESCLADAS: só os campos que este
 *    aparelho ainda não enviou (ou que acabou de gravar DEPOIS daquela versão remota)
 *    ficam com o valor local. Todo o resto passa a valer o que veio do servidor.
 */

const OUTBOX_KEY = 'obstetricheck_outbox_v1';

const outbox = new Map<number, BedPatch>(); // aguardando envio
const inflight = new Map<number, BedPatch>(); // enviados, aguardando resposta
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>();
// Horário (no servidor) da última gravação DESTE aparelho em cada campo: 'f:campo' | 'd:chave' -> ms
const confirmedWrites = new Map<number, Map<string, number>>();
const latestLocal = new Map<number, Bed>(); // última versão local completa de cada leito
const listeners = new Set<(pending: number) => void>();

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 2000;

// ---------- Persistência da fila (sobrevive a recarregar/fechar a página) ----------

const persistOutbox = () => {
  try {
    const all: Record<string, BedPatch> = {};
    inflight.forEach((p, id) => (all[id] = p));
    outbox.forEach((p, id) => (all[id] = mergePatches(all[id], p)));
    if (Object.keys(all).length === 0) localStorage.removeItem(OUTBOX_KEY);
    else localStorage.setItem(OUTBOX_KEY, JSON.stringify(all));
  } catch (e) {}
};

const loadOutbox = () => {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, BedPatch>;
    Object.entries(parsed).forEach(([id, patch]) => {
      if (!isPatchEmpty(patch)) outbox.set(Number(id), patch);
    });
  } catch (e) {}
};

if (typeof window !== 'undefined' && isSupabaseConfigured()) loadOutbox();

const notify = () => {
  const n = getPendingSyncCount();
  listeners.forEach((cb) => cb(n));
};

/** Quantos leitos têm alterações ainda não confirmadas pelo servidor. */
export const getPendingSyncCount = (): number => {
  const ids = new Set<number>([...outbox.keys(), ...inflight.keys()]);
  return ids.size;
};

export const onPendingSyncChange = (cb: (pending: number) => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

// ---------- Proteção dos campos em edição ----------

const recordConfirmedWrite = (bedId: number, patch: BedPatch, serverTime?: string) => {
  const t = serverTime ? Date.parse(serverTime) : NaN;
  if (isNaN(t)) return;
  let m = confirmedWrites.get(bedId);
  if (!m) {
    m = new Map();
    confirmedWrites.set(bedId, m);
  }
  const keys = patch.replace
    ? diffBeds(undefined, latestLocal.get(bedId) || ({ data: {} } as any))
    : patch;
  Object.keys(keys.fields).forEach((k) => m!.set('f:' + k, t));
  Object.keys(keys.data).forEach((k) => m!.set('d:' + k, t));
};

/**
 * Campos deste leito que NÃO podem ser sobrescritos por uma versão remota:
 * - os que ainda estão na fila ou sendo enviados (o que o usuário está digitando);
 * - os que este aparelho gravou no servidor DEPOIS do horário daquela versão remota
 *   (evento atrasado de um colega não desfaz o que acabamos de salvar).
 */
export const getProtectedKeys = (bedId: number, remoteUpdatedAt?: string): ProtectedKeys => {
  const fields = new Set<string>();
  const data = new Set<string>();
  [outbox.get(bedId), inflight.get(bedId)].forEach((p) => {
    if (!p) return;
    Object.keys(p.fields).forEach((k) => fields.add(k));
    Object.keys(p.data).forEach((k) => data.add(k));
  });
  const remoteTime = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : NaN;
  confirmedWrites.get(bedId)?.forEach((t, key) => {
    // Sem horário remoto conhecido, ou versão remota mais antiga/igual à nossa gravação: protege
    if (!isNaN(remoteTime) && remoteTime > t) return;
    if (key.startsWith('f:')) fields.add(key.slice(2));
    else data.add(key.slice(2));
  });
  return { fields, data };
};

/** Aplica uma versão remota de um leito sobre a local, preservando o que está em edição. */
export const mergeIncomingBed = (local: Bed | undefined, remote: Bed): Bed => {
  // Leito com substituição pendente (ex.: alta dada offline): a versão local manda
  if (local && (outbox.get(remote.id)?.replace || inflight.get(remote.id)?.replace)) return local;
  const merged = mergeRemoteBed(local, remote, getProtectedKeys(remote.id, remote.updatedAt));
  latestLocal.set(merged.id, merged);
  return merged;
};

/**
 * Reconcilia a lista local com a lista completa do servidor (ressincronização).
 * Leitos apagados em outro aparelho somem; leitos criados aqui e ainda não enviados ficam.
 */
export const reconcileBedLists = (localBeds: Bed[], remoteBeds: Bed[]): Bed[] => {
  const localById = new Map(localBeds.map((b) => [b.id, b]));
  const merged = remoteBeds.map((r) => mergeIncomingBed(localById.get(r.id), r));
  const remoteIds = new Set(remoteBeds.map((b) => b.id));
  localBeds.forEach((b) => {
    if (!remoteIds.has(b.id) && (outbox.has(b.id) || inflight.has(b.id))) merged.push(b);
  });
  return merged.sort((a, b) => a.id - b.id);
};

// ---------- Fila de envio ----------

const scheduleFlush = (bedId: number, delayMs: number) => {
  const t = debounceTimers.get(bedId);
  if (t) clearTimeout(t);
  debounceTimers.set(
    bedId,
    setTimeout(() => {
      debounceTimers.delete(bedId);
      flushPendingBedSaves(bedId);
    }, delayMs)
  );
};

const scheduleRetry = () => {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    flushPendingBedSaves();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 60000);
};

const enqueue = (bedId: number, patch: BedPatch, delayMs: number) => {
  outbox.set(bedId, mergePatches(outbox.get(bedId), patch));
  persistOutbox();
  notify();
  scheduleFlush(bedId, delayMs);
};

/**
 * Registra uma edição local (versão anterior -> nova) e agenda o envio só do que mudou.
 * Chamadas seguidas no mesmo leito são agrupadas (debounce).
 */
export const queueBedPatch = (prev: Bed | undefined, next: Bed, delayMs = 800): void => {
  latestLocal.set(next.id, next);
  const patch = diffBeds(prev, next);
  if (isPatchEmpty(patch)) return;
  if (!isSupabaseConfigured()) return;
  enqueue(next.id, patch, delayMs);
};

/** Compatibilidade com o nome antigo: envia o leito como novo patch. */
export const queueBedSave = (bed: Bed, delayMs = 800): void => {
  queueBedPatch(latestLocal.get(bed.id), bed, delayMs);
};

/**
 * Substitui o leito INTEIRO no servidor, imediatamente.
 * Para ações que reiniciam o leito: alta, troca de perfil, leito novo.
 */
export const replaceBed = async (bed: Bed): Promise<void> => {
  latestLocal.set(bed.id, bed);
  const full = diffBeds(undefined, bed);
  if (!isSupabaseConfigured()) return;
  // Descarta patches antigos deste leito: a substituição já contém o estado final
  outbox.set(bed.id, { ...full, replace: true });
  persistOutbox();
  notify();
  await flushPendingBedSaves(bed.id);
};

/** Compatibilidade com o nome antigo. */
export const saveBedImmediately = async (bed: Bed): Promise<boolean> => {
  await replaceBed(bed);
  return true;
};

/** Esquece um leito removido (cancela envios pendentes). */
export const forgetBed = (bedId: number) => {
  const t = debounceTimers.get(bedId);
  if (t) clearTimeout(t);
  debounceTimers.delete(bedId);
  outbox.delete(bedId);
  latestLocal.delete(bedId);
  confirmedWrites.delete(bedId);
  persistOutbox();
  notify();
};

/** Esquece tudo (ex.: restaurar leitos padrão). */
export const forgetAllBeds = () => {
  debounceTimers.forEach((t) => clearTimeout(t));
  debounceTimers.clear();
  outbox.clear();
  latestLocal.clear();
  confirmedWrites.clear();
  persistOutbox();
  notify();
};

const sendBed = async (bedId: number): Promise<void> => {
  const t = debounceTimers.get(bedId);
  if (t) {
    clearTimeout(t);
    debounceTimers.delete(bedId);
  }
  const patch = outbox.get(bedId);
  // Se já há um envio em andamento, este patch sai logo após a resposta
  if (!patch || inflight.has(bedId)) return;

  outbox.delete(bedId);
  inflight.set(bedId, patch);
  persistOutbox();
  notify();

  const result = await patchBedInSupabase(bedId, patch, latestLocal.get(bedId));
  inflight.delete(bedId);
  const ok = result.ok;
  if (ok) recordConfirmedWrite(bedId, patch, result.serverTime);

  if (!ok) {
    // Devolve à fila (edições feitas durante o envio têm prioridade) e tenta de novo depois
    outbox.set(bedId, mergePatches(patch, outbox.get(bedId)));
    scheduleRetry();
  } else {
    retryDelay = 2000;
    if (outbox.has(bedId)) scheduleFlush(bedId, 300);
  }
  persistOutbox();
  notify();
};

/**
 * Envia agora os patches pendentes de um leito específico, ou de todos.
 * Ideal ao trocar de leito, trocar de aba, voltar a ficar online ou fechar a janela.
 */
export const flushPendingBedSaves = async (bedId?: number): Promise<void> => {
  if (!isSupabaseConfigured()) {
    outbox.clear();
    persistOutbox();
    return;
  }
  if (bedId !== undefined) return sendBed(bedId);
  await Promise.allSettled([...outbox.keys()].map((id) => sendBed(id)));
};

/** Mantido por compatibilidade: agora a proteção é por campo, não pelo leito inteiro. */
export const isBedLockedForRemoteSync = (bedId: number): boolean => {
  const p = getProtectedKeys(bedId);
  return p.fields.size > 0 || p.data.size > 0;
};

// Registra listeners de ciclo de vida da janela para garantir persistência ao sair
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    persistOutbox();
    flushPendingBedSaves();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingBedSaves();
    }
  });

  window.addEventListener('online', () => {
    retryDelay = 2000;
    flushPendingBedSaves();
  });
}
