import { createClient } from '@supabase/supabase-js';
import { Bed } from '../types/bed';
import { BedPatch, bedToDbRow as coreBedToDbRow, dbRowToBed, fieldsToColumnsAndData } from './syncCore';

export { dbRowToBed };

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

const clientMeta = () => ({
  _clientSessionId: CLIENT_SESSION_ID,
  _clientTimestamp: Date.now()
});

/**
 * Converte um objeto Bed (camelCase) para o formato da tabela do Supabase (snake_case).
 */
export const bedToDbRow = (bed: Bed) => coreBedToDbRow(bed, clientMeta());

export interface FetchBedsResult {
  /** false = falha de rede/servidor (NÃO confundir com banco vazio). */
  ok: boolean;
  beds: Bed[];
}

/**
 * Carrega todos os leitos cadastrados no Supabase.
 */
export const fetchBedsFromSupabase = async (): Promise<FetchBedsResult> => {
  if (!supabase) return { ok: false, beds: [] };
  try {
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Erro ao carregar leitos do Supabase:', error.message);
      return { ok: false, beds: [] };
    }
    return { ok: true, beds: (data || []).map(dbRowToBed) };
  } catch (err) {
    console.warn('Falha na requisição ao Supabase:', err);
    return { ok: false, beds: [] };
  }
};

/** Resultado de uma gravação: ok + horário em que o servidor gravou (quando disponível). */
export interface SaveResult {
  ok: boolean;
  serverTime?: string;
}

/**
 * Substitui o leito INTEIRO no Supabase (alta, troca de perfil, leito novo).
 */
export const replaceBedInSupabase = async (bed: Bed): Promise<SaveResult> => {
  if (!supabase) return { ok: false };
  try {
    const { data, error } = await supabase
      .from('beds')
      .upsert(bedToDbRow(bed), { onConflict: 'id' })
      .select('updated_at');
    if (error) {
      console.warn('Erro ao sincronizar leito no Supabase:', error.message);
      return { ok: false };
    }
    return { ok: true, serverTime: (data as any)?.[0]?.updated_at };
  } catch (err) {
    console.warn('Falha ao salvar leito no Supabase:', err);
    return { ok: false };
  }
};

/** Mantido por compatibilidade. */
export const saveBedToSupabase = async (bed: Bed): Promise<boolean> => (await replaceBedInSupabase(bed)).ok;

// null = ainda não sabemos; false = a função patch_bed não existe no banco (migração não aplicada)
let patchRpcAvailable: boolean | null = null;

/**
 * Envia SOMENTE os campos alterados de um leito. O servidor (função patch_bed)
 * mescla os campos e o JSON `data`, então edições simultâneas de campos
 * diferentes feitas em outros aparelhos são preservadas.
 */
export const patchBedInSupabase = async (
  bedId: number,
  patch: BedPatch,
  latestLocal?: Bed
): Promise<SaveResult> => {
  if (!supabase) return { ok: false };

  if (patch.replace) {
    if (!latestLocal) return { ok: true }; // leito removido localmente; nada a enviar
    return replaceBedInSupabase(latestLocal);
  }

  const { columns, dataExtras } = fieldsToColumnsAndData(patch.fields);
  const dataPatch = { ...patch.data, ...dataExtras, ...clientMeta() };

  try {
    if (patchRpcAvailable !== false) {
      const { data: serverTime, error } = await supabase.rpc('patch_bed', {
        p_id: bedId,
        p_fields: columns,
        p_data: dataPatch
      });

      if (!error) {
        patchRpcAvailable = true;
        // NULL = leito ainda não existe no servidor: cria com a versão local completa
        if (!serverTime) return latestLocal ? replaceBedInSupabase(latestLocal) : { ok: true };
        return { ok: true, serverTime: String(serverTime) };
      }

      const missingFn =
        error.code === 'PGRST202' || error.code === '42883' || /patch_bed/i.test(error.message || '');
      if (!missingFn) {
        console.warn('Erro ao sincronizar alterações do leito:', error.message);
        return { ok: false };
      }
      patchRpcAvailable = false;
      console.warn(
        '[ObstetriCheck] Função patch_bed não encontrada no Supabase. Rode o arquivo ' +
          'supabase_migration_002_patch_bed.sql no SQL Editor. Usando modo de compatibilidade.'
      );
    }

    // MODO DE COMPATIBILIDADE (migração ainda não aplicada):
    // atualiza só as colunas alteradas; o JSON `data` segue inteiro (menos seguro).
    const update: Record<string, any> = { ...columns };
    if (Object.keys(patch.data).length > 0 || Object.keys(dataExtras).length > 0) {
      update.data = latestLocal ? bedToDbRow(latestLocal).data : dataPatch;
    }
    const { data, error } = await supabase.from('beds').update(update).eq('id', bedId).select('updated_at');
    if (error) {
      console.warn('Erro ao sincronizar leito (compatibilidade):', error.message);
      return { ok: false };
    }
    return { ok: true, serverTime: (data as any)?.[0]?.updated_at };
  } catch (err) {
    console.warn('Falha de rede ao sincronizar leito:', err);
    return { ok: false };
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

export type RealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | string;

/**
 * Inscreve-se nas alterações em tempo real da tabela de leitos do Supabase.
 * `onStatus` informa quando o canal conecta, cai ou reconecta — usado para
 * ressincronizar tudo que pode ter sido perdido enquanto o aparelho estava offline.
 */
export const subscribeToBeds = (
  onBedChange: (bed: Bed) => void,
  onBedDelete?: (id: number) => void,
  onStatus?: (status: RealtimeStatus) => void
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
            // Eco da própria alteração deste aparelho: já está aplicada localmente.
            if (row.data && row.data._clientSessionId === CLIENT_SESSION_ID) {
              return;
            }
            onBedChange(dbRowToBed(row));
          }
        } else if (payload.eventType === 'DELETE' && onBedDelete && payload.old) {
          onBedDelete(Number((payload.old as any).id));
        }
      }
    )
    .subscribe((status) => {
      if (onStatus) onStatus(status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
};
