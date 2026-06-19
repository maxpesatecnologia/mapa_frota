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
  matricula  text
);

alter table operadores enable row level security;
create policy "operadores_select" on operadores for select using (true);
create policy "operadores_insert" on operadores for insert with check (true);
create policy "operadores_update" on operadores for update using (true);
create policy "operadores_delete" on operadores for delete using (true);

-- Tabela de Equipamentos
create table if not exists equipamentos (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  placa      text not null unique,
  nome       text not null,
  familia    text,
  ano        text
);

alter table equipamentos enable row level security;
create policy "equipamentos_select" on equipamentos for select using (true);
create policy "equipamentos_insert" on equipamentos for insert with check (true);
create policy "equipamentos_update" on equipamentos for update using (true);
create policy "equipamentos_delete" on equipamentos for delete using (true);
