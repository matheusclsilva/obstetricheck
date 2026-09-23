import { Bed } from '../types/bed';
import { INITIAL_BEDS } from '../constants/defaultBeds';

const STORAGE_KEY = 'obstetricheck_beds_v2';

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
