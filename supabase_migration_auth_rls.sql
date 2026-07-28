-- Migração: exige login para acessar os dados, e restringe escrita a 2 e-mails editores
-- Rodar no SQL Editor do Supabase.
--
-- Depois de rodar este SQL, crie os 3 usuários em Authentication > Users (Add user):
--   1. joaopedro.ti@maxpesa.com.br        -> editor (marcar "Auto Confirm User")
--   2. operacional.matriz@maxpesa.com.br  -> editor (marcar "Auto Confirm User")
--   3. um e-mail à sua escolha para o login compartilhado de somente-leitura
--      (ex: leitura@maxpesa.com.br)       -> qualquer usuário logado que NÃO seja
--                                             um dos 2 e-mails acima é somente-leitura.
--
-- Recomenda-se também desligar "Allow new users to sign up" em
-- Authentication > Settings, já que as contas são criadas manualmente por você.

create or replace function is_editor()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() ->> 'email') in ('joaopedro.ti@maxpesa.com.br', 'operacional.matriz@maxpesa.com.br'),
    false
  );
$$;

-- clientes
drop policy if exists "clientes_select" on clientes;
drop policy if exists "clientes_insert" on clientes;
drop policy if exists "clientes_update" on clientes;
drop policy if exists "clientes_delete" on clientes;
create policy "clientes_select" on clientes for select using (auth.role() = 'authenticated');
create policy "clientes_insert" on clientes for insert with check (is_editor());
create policy "clientes_update" on clientes for update using (is_editor());
create policy "clientes_delete" on clientes for delete using (is_editor());

-- operadores
drop policy if exists "operadores_select" on operadores;
drop policy if exists "operadores_insert" on operadores;
drop policy if exists "operadores_update" on operadores;
drop policy if exists "operadores_delete" on operadores;
create policy "operadores_select" on operadores for select using (auth.role() = 'authenticated');
create policy "operadores_insert" on operadores for insert with check (is_editor());
create policy "operadores_update" on operadores for update using (is_editor());
create policy "operadores_delete" on operadores for delete using (is_editor());

-- equipamentos
drop policy if exists "equipamentos_select" on equipamentos;
drop policy if exists "equipamentos_insert" on equipamentos;
drop policy if exists "equipamentos_update" on equipamentos;
drop policy if exists "equipamentos_delete" on equipamentos;
create policy "equipamentos_select" on equipamentos for select using (auth.role() = 'authenticated');
create policy "equipamentos_insert" on equipamentos for insert with check (is_editor());
create policy "equipamentos_update" on equipamentos for update using (is_editor());
create policy "equipamentos_delete" on equipamentos for delete using (is_editor());

-- programacao
drop policy if exists "programacao_select" on programacao;
drop policy if exists "programacao_insert" on programacao;
drop policy if exists "programacao_update" on programacao;
drop policy if exists "programacao_delete" on programacao;
create policy "programacao_select" on programacao for select using (auth.role() = 'authenticated');
create policy "programacao_insert" on programacao for insert with check (is_editor());
create policy "programacao_update" on programacao for update using (is_editor());
create policy "programacao_delete" on programacao for delete using (is_editor());

-- status_programacao
drop policy if exists "status_programacao_select" on status_programacao;
drop policy if exists "status_programacao_insert" on status_programacao;
drop policy if exists "status_programacao_update" on status_programacao;
drop policy if exists "status_programacao_delete" on status_programacao;
create policy "status_programacao_select" on status_programacao for select using (auth.role() = 'authenticated');
create policy "status_programacao_insert" on status_programacao for insert with check (is_editor());
create policy "status_programacao_update" on status_programacao for update using (is_editor());
create policy "status_programacao_delete" on status_programacao for delete using (is_editor());

-- motivos
drop policy if exists "motivos_select" on motivos;
drop policy if exists "motivos_insert" on motivos;
drop policy if exists "motivos_update" on motivos;
drop policy if exists "motivos_delete" on motivos;
create policy "motivos_select" on motivos for select using (auth.role() = 'authenticated');
create policy "motivos_insert" on motivos for insert with check (is_editor());
create policy "motivos_update" on motivos for update using (is_editor());
create policy "motivos_delete" on motivos for delete using (is_editor());

-- itens_motivo
drop policy if exists "itens_motivo_select" on itens_motivo;
drop policy if exists "itens_motivo_insert" on itens_motivo;
drop policy if exists "itens_motivo_update" on itens_motivo;
drop policy if exists "itens_motivo_delete" on itens_motivo;
create policy "itens_motivo_select" on itens_motivo for select using (auth.role() = 'authenticated');
create policy "itens_motivo_insert" on itens_motivo for insert with check (is_editor());
create policy "itens_motivo_update" on itens_motivo for update using (is_editor());
create policy "itens_motivo_delete" on itens_motivo for delete using (is_editor());

-- programacao_anexos
drop policy if exists "anexos_select" on programacao_anexos;
drop policy if exists "anexos_insert" on programacao_anexos;
drop policy if exists "anexos_update" on programacao_anexos;
drop policy if exists "anexos_delete" on programacao_anexos;
create policy "anexos_select" on programacao_anexos for select using (auth.role() = 'authenticated');
create policy "anexos_insert" on programacao_anexos for insert with check (is_editor());
create policy "anexos_update" on programacao_anexos for update using (is_editor());
create policy "anexos_delete" on programacao_anexos for delete using (is_editor());

-- storage: bucket programacao-anexos
drop policy if exists "storage_prog_select" on storage.objects;
drop policy if exists "storage_prog_insert" on storage.objects;
drop policy if exists "storage_prog_delete" on storage.objects;
create policy "storage_prog_select" on storage.objects for select using (bucket_id = 'programacao-anexos' and auth.role() = 'authenticated');
create policy "storage_prog_insert" on storage.objects for insert with check (bucket_id = 'programacao-anexos' and is_editor());
create policy "storage_prog_delete" on storage.objects for delete using (bucket_id = 'programacao-anexos' and is_editor());

-- frota_diario (Dashboard / Mapa)
drop policy if exists "Leitura pública" on frota_diario;
drop policy if exists "Inserção pública" on frota_diario;
drop policy if exists "Exclusão pública" on frota_diario;
create policy "frota_diario_select" on frota_diario for select using (auth.role() = 'authenticated');
create policy "frota_diario_insert" on frota_diario for insert with check (is_editor());
create policy "frota_diario_delete" on frota_diario for delete using (is_editor());
