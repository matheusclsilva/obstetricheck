import { Bed } from '../types/bed';
import { INITIAL_BEDS } from '../constants/defaultBeds';

const STORAGE_KEY = 'obstetricheck_beds_v2';
const ACTIVE_BED_KEY = 'obstetricheck_active_bed_id';
const ACTIVE_TAB_KEY = 'obstetricheck_active_tab';

export const VALID_TABS = ['checklist', 'prescription', 'evolution', 'discharge', 'shift_summary'];

export const loadBedsFromStorage = (): Bed[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Falha ao ler leitos do localStorage', err);
  }
  return INITIAL_BEDS;
};

export const saveBedsToStorage = (beds: Bed[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(beds));
  } catch (err) {
    console.error('Falha ao salvar leitos no localStorage', err);
  }
};

/**
 * Obtém o ID do leito ativo ao carregar a página:
 * 1. Primeiro verifica se há parâmetro 'bed' na URL (ex: ?bed=5)
 * 2. Depois verifica no localStorage o último leito acessado
 * 3. Fallback para o primeiro leito disponível
 */
export const getInitialActiveBedId = (availableBeds: Bed[]): number => {
  if (typeof window !== 'undefined') {
    // 1. Tenta da URL
    try {
      const params = new URLSearchParams(window.location.search);
      const bedParam = params.get('bed');
      if (bedParam) {
        const id = Number(bedParam);
        if (!isNaN(id) && availableBeds.some((b) => b.id === id)) {
          return id;
        }
      }
    } catch (e) {}

    // 2. Tenta do localStorage
    try {
      const stored = localStorage.getItem(ACTIVE_BED_KEY);
      if (stored) {
        const id = Number(stored);
        if (!isNaN(id) && availableBeds.some((b) => b.id === id)) {
          return id;
        }
      }
    } catch (e) {}
  }

  return availableBeds[0]?.id || 1;
};

/**
 * Obtém a aba ativa ao carregar a página (URL -> localStorage -> 'checklist')
 */
export const getInitialActiveTab = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Tenta da URL
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && VALID_TABS.includes(tabParam)) {
        return tabParam;
      }
    } catch (e) {}

    // 2. Tenta do localStorage
    try {
      const stored = localStorage.getItem(ACTIVE_TAB_KEY);
      if (stored && VALID_TABS.includes(stored)) {
        return stored;
      }
    } catch (e) {}
  }

  return 'checklist';
};

export const saveActiveBedId = (bedId: number): void => {
  try {
    localStorage.setItem(ACTIVE_BED_KEY, String(bedId));
  } catch (e) {}
};

export const saveActiveTab = (tab: string): void => {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  } catch (e) {}
};

/**
 * Sincroniza a URL sem recarregar a página (replaceState) para que
 * se o usuário der F5 ou compartilhar a URL, o mesmo leito e aba permaneçam abertos.
 */
export const syncNavigationUrl = (bedId: number, tab: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('bed', String(bedId));
    url.searchParams.set('tab', tab);
    window.history.replaceState({ bedId, tab }, '', url.toString());
  } catch (e) {}
};

