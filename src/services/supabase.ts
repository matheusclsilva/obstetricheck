import { createClient } from '@supabase/supabase-js';
import { Bed } from '../types/bed';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Normaliza a URL removendo sufixos acidentais como /rest/v1/ ou barras finais
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://seu-projeto.supabase.co' &&
    supabaseAnonKey !== 'sua-chave-anon-publica'
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const CLIENT_SESSION_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

/**
 * Converte um objeto Bed (camelCase) para o formato da tabela do Supabase (snake_case).
 */
export const bedToDbRow = (bed: Bed) => ({
  id: bed.id,
  label: bed.label,
  sector: bed.sector,
  patient_name: bed.patientName,
  age: bed.age,
  admission_date: bed.admissionDate,
  admission_time: bed.admissionTime,
  diagnosis: bed.diagnosis,
  type: bed.type,
  is_reviewed: bed.isReviewed,
  avp_site: bed.avpSite,
  avp_date: bed.avpDate,
  pendencias: bed.pendencias,
  intercorrencias: bed.intercorrencias,
  obstetric_history: bed.obstetricHistory,
  blood_pressure: bed.bloodPressure,
  hda: bed.hda,
  comorbidades: bed.comorbidades,
  muc: bed.muc,
  alergias: bed.alergias,
  internment_days: bed.internmentDays,
  exames_lab_text: bed.examesLabText,
  hd_text: bed.hdText,
  conduta_text: bed.condutaText,
  rn: bed.rn,
  data: {
    ...(bed.data || {}),
    hdaDetails: bed.hdaDetails || bed.data?.hdaDetails || '',
    _clientSessionId: CLIENT_SESSION_ID,
    _clientTimestamp: Date.now()
  }
});

/**
 * Converte uma linha do Supabase (snake_case) de volta para a interface Bed (camelCase).
 */
export const dbRowToBed = (row: any): Bed => ({
  id: row.id,
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
  hdaDetails: row.hda_details || row.data?.hdaDetails || '',
  comorbidades: row.comorbidades || '',
  muc: row.muc || '',
  alergias: row.alergias || '',
  internmentDays: row.internment_days || 1,
  examesLabText: row.exames_lab_text || '',
  hdText: row.hd_text || '',
  condutaText: row.conduta_text || '',
  rn: row.rn,
  data: row.data || {}
});

/**
 * Carrega todos os leitos cadastrados no Supabase.
 */
export const fetchBedsFromSupabase = async (): Promise<Bed[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Erro ao carregar leitos do Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(dbRowToBed);
    }
    return null;
  } catch (err) {
    console.warn('Falha na requisição ao Supabase:', err);
    return null;
  }
};

/**
 * Salva ou atualiza um leito no Supabase.
 */
export const saveBedToSupabase = async (bed: Bed): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const row = bedToDbRow(bed);
    const { error } = await supabase.from('beds').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao sincronizar leito no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao salvar leito no Supabase:', err);
    return false;
  }
};

/**
 * Salva uma lista completa de leitos (ex: no reset ou seed inicial).
 */
export const seedBedsToSupabase = async (beds: Bed[]): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const rows = beds.map(bedToDbRow);
    const { error } = await supabase.from('beds').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao salvar lista de leitos no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao sincronizar leitos no Supabase:', err);
    return false;
  }
};

/**
 * Remove um leito do Supabase pelo ID.
 */
export const deleteBedFromSupabase = async (bedId: number): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('beds').delete().eq('id', bedId);
    if (error) {
      console.warn('Erro ao remover leito do Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao deletar leito no Supabase:', err);
    return false;
  }
};

/**
 * Inscreve-se nas alterações em tempo real da tabela de leitos do Supabase.
 */
export const subscribeToBeds = (
  onBedChange: (bed: Bed) => void,
  onBedDelete?: (id: number) => void
) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime:beds')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'beds' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new && (payload.new as any).id) {
            const row = payload.new as any;
            // Se a alteração foi originada por esta mesma sessão/aba, ignora o eco
            // para não sobrescrever a digitação em andamento com dados defasados.
            if (row.data && row.data._clientSessionId === CLIENT_SESSION_ID) {
              return;
            }
            const bed = dbRowToBed(row);
            onBedChange(bed);
          }
        } else if (payload.eventType === 'DELETE' && onBedDelete && payload.old) {
          onBedDelete(Number((payload.old as any).id));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
