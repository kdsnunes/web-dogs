-- Ninpozan Management System — Migração 0009 (Configurações: convite & membros)
-- Permite que funcionários criem o próprio login (signup) e entrem na
-- organização via CÓDIGO DE CONVITE, sem precisar de chave de serviço.
-- O administrador (owner/manager) gerencia papéis e pode regenerar o código.

-- ---------------------------------------------------------------------------
-- Código de convite por organização
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists invite_code text;

-- Gera códigos para organizações existentes
update public.organizations
  set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  where invite_code is null;

alter table public.organizations
  alter column invite_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

create unique index if not exists idx_organizations_invite_code
  on public.organizations (invite_code);

-- ---------------------------------------------------------------------------
-- RPC: entrar em uma organização pelo código (cria membership como 'staff')
-- ---------------------------------------------------------------------------
create or replace function public.join_organization(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'Sessão inválida.' using errcode = 'insufficient_privilege';
  end if;

  select id into v_org
  from public.organizations
  where invite_code = upper(trim(p_code));

  if v_org is null then
    raise exception 'Código de organização inválido.' using errcode = 'no_data_found';
  end if;

  -- Garante que o profile exista (normalmente criado pelo trigger de signup)
  insert into public.profiles (id) values (auth.uid())
    on conflict (id) do nothing;

  insert into public.memberships (organization_id, profile_id, role)
  values (v_org, auth.uid(), 'staff')
  on conflict (organization_id, profile_id) do nothing;

  return v_org;
end;
$$;

grant execute on function public.join_organization(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: regenerar o código de convite (somente admin)
-- ---------------------------------------------------------------------------
create or replace function public.regenerate_invite_code(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_org_admin(p_org) then
    raise exception 'Apenas administradores podem regenerar o código.'
      using errcode = 'insufficient_privilege';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update public.organizations set invite_code = v_code, updated_at = now() where id = p_org;
  return v_code;
end;
$$;

grant execute on function public.regenerate_invite_code(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas: admin edita a organização e gerencia membros
-- ---------------------------------------------------------------------------
drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

drop policy if exists "memberships_update_admin" on public.memberships;
create policy "memberships_update_admin" on public.memberships
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "memberships_delete_admin" on public.memberships;
create policy "memberships_delete_admin" on public.memberships
  for delete using (public.is_org_admin(organization_id));
