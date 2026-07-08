# ESTADO — Miramar

> Última actualización: 2026-07-08 · **Proyecto dado por finalizado**

## Idea
Calendario compartido para reservar días en un piso de playa entre familia/amigos.
Cada persona entra con PIN, reserva **tramos (entrada→salida)**, y el calendario
muestra las estancias por color. Los solapamientos **no se bloquean** pero se
**resaltan** para decidir si vais juntos o quién se queda. Acceso controlado por
un **admin** que aprueba a quien crea cuenta nueva.

## Stack
Vite + React + TypeScript + Tailwind v4 (`@tailwindcss/vite`) + Supabase (Postgres
+ RLS + Realtime) + Vercel. Fuentes: Fraunces (display) + Instrument Sans (cuerpo).
Paleta costera (sand/sea/coral, 15 colores de miembro). Sin deps de iconos (SVG inline).

## Online
- **Producción:** https://miramar-flame.vercel.app (alias también en miramar-playa.vercel.app)
- **GitHub:** https://github.com/brenosiqn8n/miramar (**público**, para que otros grupos
  puedan hacer fork y desplegar su propia copia independiente)
- **Guía de usuario:** `GUIA.md` en el repo — cómo entrar, reservar, tablón, perfil, admin.

## Funciones completas
- **Login por PIN** + **gate de admin**: el primero en crear cuenta puede marcarse
  admin; el resto queda pendiente hasta que el admin aprueba/rechaza (`Solicitudes.tsx`).
- **Perfil editable**: pulsando el nombre (arriba izq.) se cambia nombre/color/PIN,
  confirmando con el PIN actual (`fn_editar_perfil`).
- **Colores únicos** por miembro (15 en paleta, no se puede repetir).
- **Calendario** con vistas mes/trimestre/año; selección de rango tocando dos días;
  solapamientos resaltados en coral (incluida la propia selección sobre días ya
  reservados); vista anual con rectángulo de color por día (no punto).
- **Reservar días**: no permite duplicar tus propios días ya reservados; nota
  opcional visualmente diferenciada; avisa de coincidencias antes de guardar.
- **Próximas estancias**: marca quién reservó primero cuando hay coincidencia (★).
- **Historial**: todas las reservas ordenadas por fecha de la estancia (no de creación).
- **Tablón de anuncios**: texto + autor + fecha; scroll a partir de 2 anuncios;
  borra el admin o el autor.
- **Tiempo real**: canal Supabase Realtime (reservas/miembros/anuncios) + refetch
  al recuperar el foco como red de seguridad.
- **Sin zoom en iOS** al escribir (inputs forzados a 16px).
- **Modo local** (localStorage) automático si faltan las env vars de Supabase —
  útil para probar sin nube.

## Base de datos (`supabase/schema.sql`, idempotente — se puede re-correr siempre)
- `miembros` (nombre único, color único, pin_hash, es_admin, aprobado).
- `reservas` (miembro_id, fecha_inicio, fecha_fin, nota).
- `anuncios` (miembro_id, texto, created_at).
- RPCs `security definer`: `fn_registrar_miembro`, `fn_login`, `fn_editar_perfil`,
  `fn_renombrar` (legado), `fn_aprobar`, `fn_rechazar`. PIN hasheado con pgcrypto,
  nunca sale al cliente.

## Deploy
- Git de Vercel quedó **desconectado** en el proyecto original (bloqueo por email
  del commit no verificado en GitHub) → deploys manuales vía CLI (`vercel deploy
  --prebuilt --prod`, build local con `.env` real para hornear las claves).
- Para reactivar auto-deploy: verificar el email del commit en GitHub → Settings →
  Emails, y reconectar Git en Vercel → Settings → Git.

## Para otra persona/grupo (repo público, ver GUIA.md)
1. Fork del repo a su cuenta GitHub.
2. Supabase propio + correr `schema.sql`.
3. Vercel propio, importar su fork, poner las 2 env vars, deploy.
4. Los forks son independientes: si se borra el repo original, el fork y su web
   desplegada siguen funcionando (solo se pierde el botón "Sync fork").

## Ideas futuras (no implementadas, sin urgencia)
- Editar una reserva existente (ahora: borrar y recrear).
- Reset de PIN si se olvida (hoy requiere el PIN actual para todo).
- Aforo/límite de camas.
- Notas fijas del piso (wifi, normas).
