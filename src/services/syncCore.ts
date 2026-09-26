import { Bed } from '../types/bed';

/**
 * Núcleo PURO da sincronização (sem acesso a rede) — fácil de testar.
 *
 * Ideia central: cada aparelho envia ao servidor apenas os CAMPOS que mudaram
 * (um "patch"), e o servidor mescla esse patch no leito. Assim, dois aparelhos
 * editando campos diferentes do mesmo leito não apagam o trabalho um do outro.
 */

/** Campos do leito que têm coluna própria na tabela `beds` (camelCase -> snake_case). */
export const COLUMN_MAP: Record<string, string> = {
  label: 'label',
  sector: 'sector',
  patientName: 'patient_name',
  age: 'age',
  admissionDate: 'admission_date',
  admissionTime: 'admission_time',
  diagnosis: 'diagnosis',
  type: 'type',
  isReviewed: 'is_reviewed',
  avpSite: 'avp_site',
  avpDate: 'avp_date',
  pendencias: 'pendencias',
  intercorrencias: 'intercorrencias',
  obstetricHistory: 'obstetric_history',
  bloodPressure: 'blood_pressure',
  hda: 'hda',
  comorbidades: 'comorbidades',
  muc: 'muc',
  alergias: 'alergias',
  internmentDays: 'internment_days',
  examesLabText: 'exames_lab_text',
  hdText: 'hd_text',
  condutaText: 'conduta_text',
  rn: 'rn'
};

/** Campos que existem só no aparelho e nunca são enviados como campo. */
const LOCAL_ONLY_FIELDS = new Set(['id', 'data', 'updatedAt']);

/**
 * Campos do leito SEM coluna própria (ex.: queixasAdicionais, atestados, alergiaStatus)
 * são guardados dentro do JSON `data` com este prefixo, para também sincronizarem.
 */
export const EXTRA_PREFIX = 'bed.';

/** Metadados internos gravados em `data` que não fazem parte do leito. */
const INTERNAL_DATA_KEYS = new Set(['_clientSessionId', '_clientTimestamp']);

export interface BedPatch {
  /** Campos de primeiro nível alterados (camelCase). */
  fields: Record<string, any>;
  /** Chaves de `bed.data` alteradas. */
  data: Record<string, any>;
  /** true = substituir o leito inteiro (alta, troca de perfil, leito novo). */
  replace?: boolean;
}

export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return a == b; // null e undefined contam como iguais
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => a[k] !== undefined);
  const kb = Object.keys(b).filter((k) => b[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
};

const toWire = (v: any) => (v === undefined ? null : v);

/** Calcula o que mudou entre duas versões do mesmo leito. */
export function diffBeds(prev: Bed | undefined, next: Bed): BedPatch {
  const fields: Record<string, any> = {};
  const data: Record<string, any> = {};
  const p: any = prev || {};
  const n: any = next;

  const keys = new Set([...Object.keys(p), ...Object.keys(n)]);
  keys.forEach((k) => {
    if (LOCAL_ONLY_FIELDS.has(k)) return;
    if (!deepEqual(p[k], n[k])) fields[k] = toWire(n[k]);
  });

  const pd = p.data || {};
  const nd = n.data || {};
  const dataKeys = new Set([...Object.keys(pd), ...Object.keys(nd)]);
  dataKeys.forEach((k) => {
    if (INTERNAL_DATA_KEYS.has(k)) return;
    if (!deepEqual(pd[k], nd[k])) data[k] = toWire(nd[k]);
  });

  return { fields, data };
}

export const isPatchEmpty = (patch?: BedPatch | null): boolean =>
  !patch || (!patch.replace && Object.keys(patch.fields).length === 0 && Object.keys(patch.data).length === 0);

/** Junta dois patches do mesmo leito; em conflito vale o mais novo. */
export function mergePatches(older: BedPatch | undefined, newer: BedPatch | undefined): BedPatch {
  if (!older) return newer || { fields: {}, data: {} };
  if (!newer) return older;
  return {
    fields: { ...older.fields, ...newer.fields },
    data: { ...older.data, ...newer.data },
    replace: Boolean(older.replace || newer.replace)
  };
}

/** Converte campos alterados em colunas SQL + chaves extras para dentro de `data`. */
export function fieldsToColumnsAndData(fields: Record<string, any>): {
  columns: Record<string, any>;
  dataExtras: Record<string, any>;
} {
  const columns: Record<string, any> = {};
  const dataExtras: Record<string, any> = {};
  Object.entries(fields).forEach(([k, v]) => {
    if (LOCAL_ONLY_FIELDS.has(k)) return;
    if (COLUMN_MAP[k]) columns[COLUMN_MAP[k]] = toWire(v);
    else if (k === 'hdaDetails') dataExtras.hdaDetails = toWire(v);
    else dataExtras[EXTRA_PREFIX + k] = toWire(v);
  });
  return { columns, dataExtras };
}

/** Converte um leito completo em linha da tabela (usado ao substituir o leito inteiro). */
export function bedToDbRow(bed: Bed, meta: Record<string, any> = {}) {
  const b: any = bed;
  const row: Record<string, any> = { id: bed.id };
  Object.entries(COLUMN_MAP).forEach(([field, column]) => {
    // undefined vira null: numa substituição, o valor antigo precisa ser APAGADO no servidor
    row[column] = toWire(b[field]);
  });

  const extras: Record<string, any> = {};
  Object.keys(b).forEach((k) => {
    if (LOCAL_ONLY_FIELDS.has(k) || COLUMN_MAP[k] || k === 'hdaDetails') return;
    extras[EXTRA_PREFIX + k] = toWire(b[k]);
  });

  const cleanData: Record<string, any> = {};
  Object.entries(bed.data || {}).forEach(([k, v]) => {
    if (!INTERNAL_DATA_KEYS.has(k)) cleanData[k] = v;
  });

  row.data = {
    ...cleanData,
    ...extras,
    hdaDetails: b.hdaDetails || cleanData.hdaDetails || '',
    ...meta
  };
  return row;
}

/** Converte uma linha da tabela de volta para o formato do app. */
export function dbRowToBed(row: any): Bed {
  const rawData = row.data || {};
  const data: Record<string, any> = {};
  const extras: Record<string, any> = {};
  Object.entries(rawData).forEach(([k, v]) => {
    if (INTERNAL_DATA_KEYS.has(k)) return;
    if (k.startsWith(EXTRA_PREFIX)) extras[k.slice(EXTRA_PREFIX.length)] = v;
    else data[k] = v;
  });

  return {
    id: Number(row.id),
    label: row.label,
    sector: row.sector,
    patientName: row.patient_name || 'Vago',
    age: row.age || '',
    admissionDate: row.admission_date || '',
    admissionTime: row.admission_time || '',
    diagnosis: row.diagnosis || '',
    type: row.type || 'vago',
    isReviewed: Boolean(row.is_reviewed),
    avpSite: row.avp_site || '',
    avpDate: row.avp_date || '',
    pendencias: row.pendencias || '',
    intercorrencias: row.intercorrencias || '',
    obstetricHistory: row.obstetric_history || '',
    bloodPressure: row.blood_pressure || '',
    hda: row.hda || '',
    hdaDetails: row.hda_details || rawData.hdaDetails || '',
    comorbidades: row.comorbidades || '',
    muc: row.muc || '',
    alergias: row.alergias || '',
    internmentDays: row.internment_days || 1,
    examesLabText: row.exames_lab_text || '',
    hdText: row.hd_text || '',
    condutaText: row.conduta_text || '',
    rn: row.rn || undefined,
    ...extras,
    updatedAt: row.updated_at,
    data
  } as Bed;
}

export interface ProtectedKeys {
  fields: Set<string>;
  data: Set<string>;
}

const parseTime = (t?: string) => {
  const n = t ? Date.parse(t) : NaN;
  return isNaN(n) ? null : n;
};

/**
 * Mescla uma versão vinda do servidor com a versão local do leito.
 * - Evento mais ANTIGO que o que já temos é ignorado.
 * - Campos que ESTE aparelho está editando (ou ainda não enviou) são preservados.
 * - Todo o resto passa a valer a versão do servidor (edições dos colegas).
 */
export function mergeRemoteBed(local: Bed | undefined, remote: Bed, protectedKeys?: ProtectedKeys): Bed {
  if (!local) return remote;

  const lt = parseTime(local.updatedAt);
  const rt = parseTime(remote.updatedAt);
  if (lt !== null && rt !== null && rt < lt) return local;

  const l: any = local;
  const merged: any = { ...remote, data: { ...(remote.data || {}) } };

  // Campos extras (sem coluna) ainda não presentes no servidor: mantém o valor local
  Object.keys(l).forEach((k) => {
    if (LOCAL_ONLY_FIELDS.has(k) || COLUMN_MAP[k]) return;
    if (!(k in merged)) merged[k] = l[k];
  });

  protectedKeys?.fields.forEach((k) => {
    if (k in l) merged[k] = l[k];
  });
  protectedKeys?.data.forEach((k) => {
    if (l.data && k in l.data) merged.data[k] = l.data[k];
  });

  return merged as Bed;
}
