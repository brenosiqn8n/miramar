# ESTADO — Miramar

> Última actualización: 2026-07-05

## Idea
Calendario compartido para reservar días en un piso de playa entre familia/amigos.
Cada persona entra con PIN, reserva **tramos (entrada→salida)**, y el calendario
muestra las estancias por color. Los solapamientos **no se bloquean** pero se
**resaltan** (día con número rojo + "coincide con X") para decidir si vais juntos
o quién se queda.

## Stack
Vite + React + TypeScript + Tailwind v4 (`@tailwindcss/vite`) + Supabase (Postgres
+ RLS + Realtime) + Vercel. Fuentes: Fraunces (display) + Instrument Sans (cuerpo).
Paleta costera (sand/sea/coral). Sin dependencias de iconos (SVG inline).

## Arquitectura
- `src/lib/supabase.ts` — cliente; `supabaseConfigurado` (si faltan env, muestra
  pantalla de config en vez de crashear).
- `src/lib/auth.ts` — login/registro vía RPC (`fn_login`, `fn_registrar_miembro`),
  sesión en `localStorage`. El PIN se hashea en la DB (pgcrypto), nunca sale al cliente.
- `src/sesion.tsx` — contexto de sesión (`useSesion`).
- `src/hooks/useDatos.ts` — miembros + reservas (join), realtime (postgres_changes),
  `crearReserva`/`borrarReserva`.
- `src/lib/fechas.ts` — utilidades ISO (sin drift de zona horaria), `matrizMes`, `solapan`.
- Componentes: `Login`, `Calendario` (mes, chips por miembro, solapamiento resaltado),
  `FormReserva` (tramo + avisa de coincidencias antes de reservar), `Reservas`
  (próximas estancias + con quién coincide + borrar las tuyas).

## Base de datos (`supabase/schema.sql`)
- `miembros` (id, nombre único, color, pin_hash) — RLS: lectura pública de columnas
  (id, nombre, color) **sin** pin_hash.
- `reservas` (miembro_id, fecha_inicio, fecha_fin, nota) — RLS abierta a `anon`
  (grupo de confianza).
- RPCs `security definer`: `fn_registrar_miembro`, `fn_login` (pgcrypto `crypt`).

## Pendiente — setup del usuario (manual)
1. Crear proyecto en **Supabase**. En SQL Editor, correr `supabase/schema.sql`.
2. Copiar `.env.example` a `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API).
3. `npm run dev`. Primer usuario → "crear acceso" (nombre + PIN + color).
4. En Supabase → Database → Replication, activar Realtime para la tabla `reservas`
   (y `miembros`) si se quiere actualización en vivo entre dispositivos.
5. Deploy en Vercel: importar repo, poner las dos env vars, deploy.

## Pendientes / ideas futuras
- Editar una reserva (ahora: borrar y recrear).
- Reset/cambio de PIN.
- Vista de lista por mes / exportar.
- Aforo o "camas" por si queréis un límite blando.
- Notas del piso (normas, wifi, etc.).
