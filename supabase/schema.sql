-- MIRAMAR — shared beach-flat booking. Run once in Supabase → SQL Editor.
-- Trusted small group: reservations are readable/writable by anyone with the app
-- (anon). "Login" is a soft PIN just to attribute reservations to a person; the
-- pin hash is never exposed to the client (column-level grant + RPC login).

create extension if not exists pgcrypto;

-- ── Members ────────────────────────────────────────────────────────────────
create table if not exists miembros (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  color      text not null unique default '#0e7490',
  pin_hash   text not null,
  created_at timestamptz not null default now()
);

-- If the table already existed without the unique color rule, add it.
create unique index if not exists uq_miembros_color on miembros (lower(color));

alter table miembros enable row level security;

-- Anyone can read members, but NOT the pin hash (column-level grant hides it).
drop policy if exists miembros_select on miembros;
create policy miembros_select on miembros for select to anon using (true);
revoke select on miembros from anon;
grant select (id, nombre, color, created_at) on miembros to anon;

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

-- Register a member with a hashed PIN. Fails if the name already exists.
create or replace function fn_registrar_miembro(p_nombre text, p_pin text, p_color text)
returns table (id uuid, nombre text, color text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from miembros m where lower(m.nombre) = lower(trim(p_nombre))) then
    raise exception 'Ese nombre ya existe';
  end if;
  if exists (select 1 from miembros m where lower(m.color) = lower(trim(p_color))) then
    raise exception 'Ese color ya está cogido';
  end if;
  return query
  insert into miembros (nombre, color, pin_hash)
  values (trim(p_nombre), coalesce(nullif(trim(p_color), ''), '#0e7490'), crypt(p_pin, gen_salt('bf')))
  returning miembros.id, miembros.nombre, miembros.color;
end $$;

-- Verify a PIN. Returns the member row on match, nothing otherwise.
create or replace function fn_login(p_nombre text, p_pin text)
returns table (id uuid, nombre text, color text)
language sql
security definer
set search_path = public
as $$
  select m.id, m.nombre, m.color
  from miembros m
  where lower(m.nombre) = lower(trim(p_nombre))
    and m.pin_hash = crypt(p_pin, m.pin_hash);
$$;

-- Rename a member. Requires the correct PIN (soft auth). Name must stay unique.
create or replace function fn_renombrar(p_id uuid, p_pin text, p_nombre text)
returns table (id uuid, nombre text, color text)
language plpgsql
security definer
set search_path = public
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
  returning miembros.id, miembros.nombre, miembros.color;
end $$;

grant execute on function fn_registrar_miembro(text, text, text) to anon;
grant execute on function fn_login(text, text) to anon;
grant execute on function fn_renombrar(uuid, text, text) to anon;
