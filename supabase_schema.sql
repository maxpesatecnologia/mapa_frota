-- Execute este SQL no Supabase > SQL Editor
-- Cria a tabela principal de registros diários da frota

create table if not exists frota_diario (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),

  -- Identificação
  iso_date          text,
  data              text,
  mes               text,
  dia               text,
  placa             text,
  frota             text,
  equipamento       text,
  familia           text,

  -- Operação
  status            text,
  cliente           text,
  config_equipamento text,
  operador          text,
  parte_diaria      text,
  inicio_operacao   text,
  intervalo         text,
  fim_operacao      text,
  total_horas       numeric,

  -- Quebras / paradas
  houve_quebra      text,
  motivo            text,
  item_motivo       text,
  horas_paradas     numeric,

  -- Horímetro / Km
  hor_km_inicio     numeric,
  hor_km_final      numeric,
  hor_km_total      numeric
);

-- Índices para performance nos filtros mais comuns
create index if not exists idx_frota_diario_iso_date  on frota_diario (iso_date);
create index if not exists idx_frota_diario_cliente   on frota_diario (cliente);
create index if not exists idx_frota_diario_status    on frota_diario (status);
create index if not exists idx_frota_diario_familia   on frota_diario (familia);
create index if not exists idx_frota_diario_placa     on frota_diario (placa);

-- Habilita RLS (Row Level Security) — acesso público de leitura e escrita via anon key
alter table frota_diario enable row level security;

create policy "Leitura pública"
  on frota_diario for select using (true);

create policy "Inserção pública"
  on frota_diario for insert with check (true);

create policy "Exclusão pública"
  on frota_diario for delete using (true);
