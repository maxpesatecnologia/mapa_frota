-- Execute no Supabase > SQL Editor

-- Tabela de Clientes
create table if not exists clientes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nome       text not null,
  endereco   text,
  cidade     text,
  estado     text,
  lat        numeric,
  lng        numeric
);
alter table clientes enable row level security;
create policy "clientes_select" on clientes for select using (true);
create policy "clientes_insert" on clientes for insert with check (true);
create policy "clientes_update" on clientes for update using (true);
create policy "clientes_delete" on clientes for delete using (true);

-- Tabela de Operadores
create table if not exists operadores (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nome       text not null,
  funcao     text
);
alter table operadores enable row level security;
create policy "operadores_select" on operadores for select using (true);
create policy "operadores_insert" on operadores for insert with check (true);
create policy "operadores_update" on operadores for update using (true);
create policy "operadores_delete" on operadores for delete using (true);

-- Tabela de Equipamentos
create table if not exists equipamentos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  placa       text not null unique,
  equipamento text not null,
  frota       text,
  familia     text
);
alter table equipamentos enable row level security;
create policy "equipamentos_select" on equipamentos for select using (true);
create policy "equipamentos_insert" on equipamentos for insert with check (true);
create policy "equipamentos_update" on equipamentos for update using (true);
create policy "equipamentos_delete" on equipamentos for delete using (true);

-- Tabela de Programacao
create table if not exists programacao (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  data date,
  placa text,
  dia text,
  equipamento text,
  familia text,
  frota text,
  status text,
  cliente text,
  config_equipamento text,
  operador text,
  parte_diaria text,
  inicio_operacao text,
  intervalo text,
  fim_operacao text,
  total_horas text,
  houve_quebra boolean default false,
  motivo text,
  item_motivo text,
  horas_paradas text,
  km_inicial numeric,
  km_final numeric,
  km_total numeric
);
alter table programacao enable row level security;
create policy "programacao_select" on programacao for select using (true);
create policy "programacao_insert" on programacao for insert with check (true);
create policy "programacao_update" on programacao for update using (true);
create policy "programacao_delete" on programacao for delete using (true);

-- Tabela de Status Programacao
create table if not exists status_programacao (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nome text not null unique
);
alter table status_programacao enable row level security;
create policy "status_programacao_select" on status_programacao for select using (true);
create policy "status_programacao_insert" on status_programacao for insert with check (true);
create policy "status_programacao_update" on status_programacao for update using (true);
create policy "status_programacao_delete" on status_programacao for delete using (true);

-- Tabela de Motivos
create table if not exists motivos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nome text not null unique
);
alter table motivos enable row level security;
create policy "motivos_select" on motivos for select using (true);
create policy "motivos_insert" on motivos for insert with check (true);
create policy "motivos_update" on motivos for update using (true);
create policy "motivos_delete" on motivos for delete using (true);

-- Tabela de Itens Motivo
create table if not exists itens_motivo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nome text not null unique,
  motivo_id uuid references motivos(id),
  numero integer
);
alter table itens_motivo enable row level security;
create policy "itens_motivo_select" on itens_motivo for select using (true);
create policy "itens_motivo_insert" on itens_motivo for insert with check (true);
create policy "itens_motivo_update" on itens_motivo for update using (true);
create policy "itens_motivo_delete" on itens_motivo for delete using (true);

-- ══════════════════════════════════════════════════════
-- MIGRATION: Anotações e Anexos na Programação
-- Execute no Supabase > SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Coluna de anotação na tabela programacao
ALTER TABLE programacao ADD COLUMN IF NOT EXISTS anotacao text;

-- 2. Tabela de anexos vinculados a programações
CREATE TABLE IF NOT EXISTS programacao_anexos (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  programacao_id  uuid references programacao(id) on delete cascade,
  nome_arquivo    text not null,
  storage_path    text not null,
  tipo_arquivo    text,
  tamanho_bytes   bigint
);
ALTER TABLE programacao_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_select" ON programacao_anexos FOR SELECT USING (true);
CREATE POLICY "anexos_insert" ON programacao_anexos FOR INSERT WITH CHECK (true);
CREATE POLICY "anexos_update" ON programacao_anexos FOR UPDATE USING (true);
CREATE POLICY "anexos_delete" ON programacao_anexos FOR DELETE USING (true);

-- 3. Bucket de Storage para os arquivos (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('programacao-anexos', 'programacao-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de acesso ao Storage
CREATE POLICY "storage_prog_select" ON storage.objects FOR SELECT USING (bucket_id = 'programacao-anexos');
CREATE POLICY "storage_prog_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'programacao-anexos');

-- ══════════════════════════════════════════════════════
-- MIGRATION: Desmembra KM e Horímetro na Programação
-- Execute no Supabase > SQL Editor
-- ══════════════════════════════════════════════════════
ALTER TABLE programacao ADD COLUMN IF NOT EXISTS horimetro_inicial numeric;
ALTER TABLE programacao ADD COLUMN IF NOT EXISTS horimetro_final   numeric;
ALTER TABLE programacao ADD COLUMN IF NOT EXISTS horimetro_total   numeric;
CREATE POLICY "storage_prog_delete" ON storage.objects FOR DELETE USING (bucket_id = 'programacao-anexos');