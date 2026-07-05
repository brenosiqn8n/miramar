-- MIRAMAR — shared beach-flat booking. Run once (and after updates) in Supabase
-- → SQL Editor. Idempotent. Trusted small group with an admin approval gate:
-- the first person can mark themselves admin; everyone else stays "pending" until
-- the admin approves them, so a random link holder can't get in.

create extension if not exists pgcrypto with schema extensions;

-- ── Members ────────────────────────────────────────────────────────────────
create table if not exists miembros (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  color      text not null unique default '#0e7490',
  pin_hash   text not null,
  es_admin   boolean not null default false,
  aprobado   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Backfill for tables created before the approval columns existed.
alter table miembros add column if not exists es_admin boolean not null default false;
alter table miembros add column if not exists aprobado boolean not null default false;
create unique index if not exists uq_miembros_color on miembros (lower(color));

-- Grandfather existing members: approve everyone already created, and if there's
-- no admin yet, promote the earliest member so approvals aren't deadlocked.
update miembros set aprobado = true where aprobado = false;
update miembros set es_admin = true
 where id = (select id from miembros order by created_at asc limit 1)
   and not exists (select 1 from miembros where es_admin);

alter table miembros enable row level security;
drop policy if exists miembros_select on miembros;
create policy miembros_select on miembros for select to anon using (true);
revoke select on miembros from anon;
grant select (id, nombre, color, es_admin, aprobado, created_at) on miembros to anon;

-- ── Reservations ───────────────────────────────────────────────────────────
create table if not exists reservas (
  id           uuid primary key default gen_random_uuid(),
  miembro_id   uuid not null references miembros(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin    date not null,
  nota         text,
  created_at   timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);
create index if not exists idx_reservas_fechas on reservas (fecha_inicio, fecha_fin);

alter table reservas enable row level security;
drop policy if exists reservas_all on reservas;
create policy reservas_all on reservas for all to anon using (true) with check (true);

-- ── Auth RPCs (security definer → bypass RLS, hash never leaves the DB) ──────

-- Register a member. The FIRST member is auto-approved and may become admin;
-- everyone else starts unapproved (aprobado=false) and waits for the admin.
drop function if exists fn_registrar_miembro(text, text, text);
drop function if exists fn_registrar_miembro(text, text, text, boolean);
create function fn_registrar_miembro(p_nombre text, p_pin text, p_color text, p_es_admin boolean)
returns table (id uuid, nombre text, color text, es_admin boolean, aprobado boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_primero boolean;
begin
  if exists (select 1 from miembros m where lower(m.nombre) = lower(trim(p_nombre))) then
    raise exception 'Ese nombre ya existe';
  end if;
  if exists (select 1 from miembros m where lower(m.color) = lower(trim(p_color))) then
    raise exception 'Ese color ya está cogido';
  end if;
  select count(*) = 0 into v_primero from miembros;
  return query
  insert into miembros (nombre, color, pin_hash, es_admin, aprobado)
  values (
    trim(p_nombre),
    coalesce(nullif(trim(p_color), ''), '#0e7490'),
    crypt(p_pin, gen_salt('bf')),
    case when v_primero then coalesce(p_es_admin, true) else false end,
    v_primero
  )
  returning miembros.id, miembros.nombre, miembros.color, miembros.es_admin, miembros.aprobado;
end $$;

-- Verify a PIN. Returns the member (with admin/approval flags) on match.
drop function if exists fn_login(text, text);
create function fn_login(p_nombre text, p_pin text)
returns table (id uuid, nombre text, color text, es_admin boolean, aprobado boolean)
language sql
security definer
set search_path = public, extensions
as $$
  select m.id, m.nombre, m.color, m.es_admin, m.aprobado
  from miembros m
  where lower(m.nombre) = lower(trim(p_nombre))
    and m.pin_hash = crypt(p_pin, m.pin_hash);
$$;

-- Rename a member (requires their PIN). Name must stay unique.
drop function if exists fn_renombrar(uuid, text, text);
create function fn_renombrar(p_id uuid, p_pin text, p_nombre text)
returns table (id uuid, nombre text, color text, es_admin boolean, aprobado boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from miembros m where m.id = p_id and m.pin_hash = crypt(p_pin, m.pin_hash)) then
    raise exception 'PIN incorrecto';
  end if;
  if exists (select 1 from miembros m where lower(m.nombre) = lower(trim(p_nombre)) and m.id <> p_id) then
    raise exception 'Ese nombre ya existe';
  end if;
  return query
  update miembros set nombre = trim(p_nombre) where miembros.id = p_id
  returning miembros.id, miembros.nombre, miembros.color, miembros.es_admin, miembros.aprobado;
end $$;

-- Admin-only: approve a pending member. Verifies the admin's PIN.
create or replace function fn_aprobar(p_admin_id uuid, p_admin_pin text, p_miembro_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from miembros a
    where a.id = p_admin_id and a.es_admin and a.pin_hash = crypt(p_admin_pin, a.pin_hash)
  ) then
    raise exception 'Solo el admin puede aprobar';
  end if;
  update miembros set aprobado = true where id = p_miembro_id;
end $$;

-- Admin-only: reject (delete) a member. Cannot delete an admin.
create or replace function fn_rechazar(p_admin_id uuid, p_admin_pin text, p_miembro_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from miembros a
    where a.id = p_admin_id and a.es_admin and a.pin_hash = crypt(p_admin_pin, a.pin_hash)
  ) then
    raise exception 'Solo el admin puede rechazar';
  end if;
  delete from miembros where id = p_miembro_id and not es_admin;
end $$;

grant execute on function fn_registrar_miembro(text, text, text, boolean) to anon;
grant execute on function fn_login(text, text) to anon;
grant execute on function fn_renombrar(uuid, text, text) to anon;
grant execute on function fn_aprobar(uuid, text, uuid) to anon;
grant execute on function fn_rechazar(uuid, text, uuid) to anon;
