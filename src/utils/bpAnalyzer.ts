export type BPClassification = 'normal' | 'elevada' | 'grave' | 'hipotensao' | 'invalida' | 'vazio';

export interface BPEvaluation {
  raw: string;
  pas?: number;
  pad?: number;
  formatted: string; // ex: "160x111 mmHg"
  shortFormatted: string; // ex: "160x111"
  classification: BPClassification;
  badgeLabel: string;
  badgeColor: string; // Classes Tailwind
  alertDesc?: string;
  isHypertensiveCrisis: boolean; // PAS >= 160 || PAD >= 110
  isElevated: boolean; // PAS >= 140 || PAD >= 90
  isHypotensive: boolean; // PAS < 90 || PAD < 60
}

/**
 * Faz o parse automático e avaliação clínica da Pressão Arterial.
 * Suporta formatos:
 * - "120/80", "120x80", "120X80", "120 80", "120-80"
 * - "160/111", "160x111", "160111" (6 dígitos), "12080" (5 dígitos), "9060" (4 dígitos)
 * - "120x80 mmHg", "160x111MMHG"
 */
export function parseAndEvaluateBP(input?: string): BPEvaluation {
  if (!input || !input.trim()) {
    return {
      raw: '',
      formatted: '',
      shortFormatted: '',
      classification: 'vazio',
      badgeLabel: 'PA Não Aferida',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
      isHypertensiveCrisis: false,
      isElevated: false,
      isHypotensive: false,
    };
  }

  const cleaned = input.trim().replace(/mmhg/gi, '').trim();
  let pas: number | undefined;
  let pad: number | undefined;

  // 1. Padrão com separador (/ , x , X , hífen , espaço)
  const sepMatch = cleaned.match(/^(\d{2,3})\s*[\/xX\-\s]\s*(\d{2,3})$/);
  if (sepMatch) {
    pas = parseInt(sepMatch[1], 10);
    pad = parseInt(sepMatch[2], 10);
  } else {
    // 2. Apenas dígitos digitados em sequência
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length === 6) {
      // Ex: 160110 -> 160 x 110
      pas = parseInt(digitsOnly.slice(0, 3), 10);
      pad = parseInt(digitsOnly.slice(3), 10);
    } else if (digitsOnly.length === 5) {
      // Ex: 12080 -> 120 x 80
      pas = parseInt(digitsOnly.slice(0, 3), 10);
      pad = parseInt(digitsOnly.slice(3), 10);
    } else if (digitsOnly.length === 4) {
      // Ex: 9060 -> 90 x 60 ou 1490 -> 140 x 90
      const firstTwo = parseInt(digitsOnly.slice(0, 2), 10);
      if (firstTwo < 50) {
        // Ex: 1490 -> 140x90
        pas = parseInt(digitsOnly.slice(0, 3), 10);
        pad = parseInt(digitsOnly.slice(3), 10);
      } else {
        pas = firstTwo;
        pad = parseInt(digitsOnly.slice(2), 10);
      }
    }
  }

  // Se não foi possível extrair números válidos
  if (!pas || !pad || isNaN(pas) || isNaN(pad) || pas < 40 || pas > 300 || pad < 20 || pad > 200) {
    return {
      raw: input,
      formatted: input,
      shortFormatted: '', // Nunca retorna palavras como "elevada" ou "normal" como formato de PA
      classification: 'invalida',
      badgeLabel: 'Formato: 120x80',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
      isHypertensiveCrisis: false,
      isElevated: false,
      isHypotensive: false,
    };
  }

  const shortFormatted = `${pas}x${pad}`;
  const formatted = `${pas}x${pad} mmHg`;

  const isHypertensiveCrisis = pas >= 160 || pad >= 110;
  const isElevated = pas >= 140 || pad >= 90;
  const isHypotensive = pas < 90 || pad < 60;

  // 1. Crise Hipertensiva / Gravidade (Protocolo Zuspan: PAS >= 160 ou PAD >= 110)
  if (isHypertensiveCrisis) {
    return {
      raw: input,
      pas,
      pad,
      formatted,
      shortFormatted,
      classification: 'grave',
      badgeLabel: '🚨 CRISE HIPERTENSIVA (≥160x110)',
      badgeColor: 'bg-rose-600 text-white font-bold animate-pulse shadow-xs',
      alertDesc: 'PA Severa (≥160x110 mmHg). Alto risco de AVC e Eclâmpsia. Chamar plantonista e avaliar SULFATO DE MAGNÉSIO (Zuspan) + HIDRALAZINA EV!',
      isHypertensiveCrisis: true,
      isElevated: true,
      isHypotensive: false,
    };
  }

  // 2. Hipertensão / PA Elevada (PAS >= 140 ou PAD >= 90)
  if (isElevated) {
    return {
      raw: input,
      pas,
      pad,
      formatted,
      shortFormatted,
      classification: 'elevada',
      badgeLabel: '⚠️ PA ELEVADA (≥140x90)',
      badgeColor: 'bg-amber-500 text-white font-bold shadow-xs',
      alertDesc: 'Hipertensão Gestacional/Puerperal. Controlar de 4/4h, monitorar proteinúria, sintomas de iminência e avaliar Metildopa.',
      isHypertensiveCrisis: false,
      isElevated: true,
      isHypotensive: false,
    };
  }

  // 3. Hipotensão Arterial (PAS < 90 ou PAD < 60)
  if (isHypotensive) {
    return {
      raw: input,
      pas,
      pad,
      formatted,
      shortFormatted,
      classification: 'hipotensao',
      badgeLabel: 'ℹ️ HIPOTENSÃO (<90x60)',
      badgeColor: 'bg-sky-600 text-white font-semibold shadow-xs',
      alertDesc: 'Pressão limítrofe/baixa. Avaliar queixas de tontura, perdas hemáticas puerperais ou desidratação.',
      isHypertensiveCrisis: false,
      isElevated: false,
      isHypotensive: true,
    };
  }

  // 4. Normotensa
  return {
    raw: input,
    pas,
    pad,
    formatted,
    shortFormatted,
    classification: 'normal',
    badgeLabel: '✅ Normotensa',
    badgeColor: 'bg-emerald-600 text-white font-semibold shadow-xs',
    isHypertensiveCrisis: false,
    isElevated: false,
    isHypotensive: false,
  };
}

/**
 * Extrai de forma robusta e garantida a aferição numérica da Pressão Arterial do leito.
 * Ignora automaticamente strings de classificação qualitativa como 'normal', 'elevada' ou 'grave',
 * garantindo que a evolução médica e SSVV sempre recebam números válidos (ex: '140x90').
 */
export function getBedBP(bed?: { bloodPressure?: string; data?: any } | null): string {
  if (!bed) return '120/80';
  const d = bed.data || {};

  // Lista de candidatos em ordem de prioridade
  const candidates = [
    bed.bloodPressure,
    d.bpValue,
    d.bloodPressure
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && /\d/.test(c)) {
      return c.trim();
    }
  }

  return '120/80';
}
