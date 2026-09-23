-- ==============================================================================
-- SCHEMA SUPABASE: OBSTETRICHECK (Passagem de Plantão e Evolução Obstétrica)
-- Cole este script no SQL Editor do seu projeto Supabase (https://supabase.com)
-- ==============================================================================

-- 1. Criação da tabela de leitos da maternidade
CREATE TABLE IF NOT EXISTS public.beds (
    id BIGINT PRIMARY KEY,
    label TEXT NOT NULL,
    sector TEXT NOT NULL,
    patient_name TEXT DEFAULT 'Vago',
    age TEXT,
    admission_date TEXT,
    admission_time TEXT,
    diagnosis TEXT,
    type TEXT NOT NULL DEFAULT 'vago',
    is_reviewed BOOLEAN DEFAULT FALSE,
    avp_site TEXT,
    avp_date TEXT,
    pendencias TEXT,
    intercorrencias TEXT,
    obstetric_history TEXT,
    blood_pressure TEXT,
    hda TEXT,
    comorbidades TEXT,
    muc TEXT,
    alergias TEXT,
    internment_days INTEGER DEFAULT 1,
    exames_lab_text TEXT,
    hd_text TEXT,
    conduta_text TEXT,
    rn JSONB,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Gatilho para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_beds_updated ON public.beds;
CREATE TRIGGER on_beds_updated
    BEFORE UPDATE ON public.beds
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 3. Habilita Row Level Security (RLS)
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso (Leitura e Escrita para a Equipe Médica/Assistencial)
CREATE POLICY "Permitir leitura de leitos para todos"
ON public.beds FOR SELECT
USING (true);

CREATE POLICY "Permitir modificação de leitos para todos"
ON public.beds FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Ativação do Supabase Realtime (Sincronização instantânea multi-dispositivo)
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;
