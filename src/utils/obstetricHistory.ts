export interface ObstetricHistoryData {
  g: number; // Gestações
  p: number; // Partos totais (n + c)
  n: number; // Partos Normais (vaginais)
  c: number; // Cesáreas
  a: number; // Abortos
  formatted: string; // Ex: "G03P03(n03 C 00)A00"
}

const pad2 = (num: number): string => String(Math.max(0, num || 0)).padStart(2, '0');

/**
 * Formata os dados da história obstétrica no modelo padrão oficial:
 * Exemplo: G03P03(n03 C 00)A00
 */
export function formatObstetricHistory(g: number, n: number, c: number, a: number): string {
  const p = (n || 0) + (c || 0);
  return `G${pad2(g)}P${pad2(p)}(n${pad2(n)} C ${pad2(c)})A${pad2(a)}`;
}

/**
 * Faz o parse de uma string de paridade obstétrica no formato:
 * G03P03(n03 C 00)A00 ou variações como G3P3, G3P2(N2C0)A1, etc.
 */
export function parseObstetricHistory(input?: string): ObstetricHistoryData {
  const defaultData: ObstetricHistoryData = {
    g: 1,
    p: 0,
    n: 0,
    c: 0,
    a: 0,
    formatted: 'G01P00(n00 C 00)A00'
  };

  if (!input || !input.trim()) return defaultData;

  const clean = input.trim();

  // Regex flexível para capturar G, P, (n, C), A
  const fullMatch = clean.match(/G(\d+)\s*P(\d+)\s*(?:\(\s*[nN](\d+)\s*[cC]\s*(\d+)\s*\))?\s*(?:[aA](\d+))?/i);
  if (fullMatch) {
    const g = parseInt(fullMatch[1], 10) || 0;
    let n = fullMatch[3] ? parseInt(fullMatch[3], 10) : 0;
    let c = fullMatch[4] ? parseInt(fullMatch[4], 10) : 0;
    const a = fullMatch[5] ? parseInt(fullMatch[5], 10) : 0;
    let p = parseInt(fullMatch[2], 10) || 0;

    // Se n e c não foram especificados na string, mas p foi
    if (!fullMatch[3] && !fullMatch[4]) {
      n = p;
      c = 0;
    } else {
      p = n + c;
    }

    return {
      g,
      p,
      n,
      c,
      a,
      formatted: formatObstetricHistory(g, n, c, a)
    };
  }

  // Fallback caso seja um texto livre
  return {
    g: 1,
    p: 0,
    n: 0,
    c: 0,
    a: 0,
    formatted: clean
  };
}

export const OBSTETRIC_PRESETS = [
  { label: 'Primigesta (G1 P0)', g: 1, n: 0, c: 0, a: 0, str: 'G01P00(n00 C 00)A00' },
  { label: 'G2 P1 (1 Cesárea)', g: 2, n: 0, c: 1, a: 0, str: 'G02P01(n00 C 01)A00' },
  { label: 'G2 P1 (1 Parto Normal)', g: 2, n: 1, c: 0, a: 0, str: 'G02P01(n01 C 00)A00' },
  { label: 'G3 P3 (3 Normais)', g: 3, n: 3, c: 0, a: 0, str: 'G03P03(n03 C 00)A00' },
  { label: 'G3 P3 (3 Cesáreas)', g: 3, n: 0, c: 3, a: 0, str: 'G03P03(n00 C 03)A00' },
  { label: 'G3 P2 (1 Normal, 1 Cesárea)', g: 3, n: 1, c: 1, a: 0, str: 'G03P02(n01 C 01)A00' },
  { label: 'G2 P0 A1 (1 Aborto prévio)', g: 2, n: 0, c: 0, a: 1, str: 'G02P00(n00 C 00)A01' },
  { label: 'Multípara (G4 P3 A1)', g: 4, n: 2, c: 1, a: 1, str: 'G04P03(n02 C 01)A01' }
];
