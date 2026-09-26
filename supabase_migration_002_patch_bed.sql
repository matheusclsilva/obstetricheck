-- ==============================================================================
-- MIGRAÇÃO 002 — OBSTETRICHECK: SALVAMENTO POR CAMPO (patch_bed)
--
-- Por quê: antes, cada aparelho gravava o leito INTEIRO. Se duas pessoas editavam
-- o mesmo leito ao mesmo tempo (ex.: residente na HDA e enfermeira no AVP), a
-- gravação de uma apagava a da outra.
--
-- Agora o app envia só os campos alterados e esta função os mescla no servidor.
-- O JSON `data` também é mesclado chave a chave (data = data || patch).
--
-- Como aplicar: Supabase -> SQL Editor -> cole este arquivo -> Run.
-- É seguro rodar mais de uma vez. Enquanto não for aplicada, o app funciona em
-- "modo de compatibilidade" (menos protegido contra edições simultâneas).
-- ==============================================================================

DROP FUNCTION IF EXISTS public.patch_bed(BIGINT, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.patch_bed(
    p_id BIGINT,
    p_fields JSONB DEFAULT '{}'::jsonb,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TIMESTAMPTZ     -- horário da gravação no servidor (NULL = leito não existe)
LANGUAGE plpgsql
SECURITY INVOKER          -- respeita as políticas RLS da tabela
SET search_path = public
AS $$
DECLARE
    merged public.beds;
    v_updated_at TIMESTAMPTZ;
BEGIN
    -- Trava a linha para que dois patches simultâneos sejam aplicados em sequência
    SELECT * INTO merged FROM public.beds WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;  -- o app então cria o leito com a versão completa
    END IF;

    -- Aplica só as colunas presentes em p_fields; as demais mantêm o valor atual
    merged := jsonb_populate_record(
        merged,
        COALESCE(p_fields, '{}'::jsonb) - 'id' - 'data' - 'updated_at'
    );

    UPDATE public.beds SET
        label             = merged.label,
        sector            = merged.sector,
        patient_name      = merged.patient_name,
        age               = merged.age,
        admission_date    = merged.admission_date,
        admission_time    = merged.admission_time,
        diagnosis         = merged.diagnosis,
        type              = merged.type,
        is_reviewed       = merged.is_reviewed,
        avp_site          = merged.avp_site,
        avp_date          = merged.avp_date,
        pendencias        = merged.pendencias,
        intercorrencias   = merged.intercorrencias,
        obstetric_history = merged.obstetric_history,
        blood_pressure    = merged.blood_pressure,
        hda               = merged.hda,
        comorbidades      = merged.comorbidades,
        muc               = merged.muc,
        alergias          = merged.alergias,
        internment_days   = merged.internment_days,
        exames_lab_text   = merged.exames_lab_text,
        hd_text           = merged.hd_text,
        conduta_text      = merged.conduta_text,
        rn                = merged.rn,
        data              = COALESCE(data, '{}'::jsonb) || COALESCE(p_data, '{}'::jsonb)
    WHERE id = p_id
    RETURNING updated_at INTO v_updated_at;

    RETURN v_updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.patch_bed(BIGINT, JSONB, JSONB) TO anon, authenticated;

-- Faz a API do Supabase enxergar a função nova imediatamente
NOTIFY pgrst, 'reload schema';
