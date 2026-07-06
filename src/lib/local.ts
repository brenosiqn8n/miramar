// Local (no-backend) mode. Used when Supabase env vars are missing so the app is
// fully testable offline. Data lives in localStorage on THIS browser only.
import type { Anuncio, Miembro, Reserva } from '../types'

type MiembroLocal = Miembro & { pin: string }

const K_MIEMBROS = 'miramar-local-miembros'
const K_RESERVAS = 'miramar-local-reservas'
const K_ANUNCIOS = 'miramar-local-anuncios'
const EVENTO = 'miramar-local-change'

function leer<T>(clave: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? '[]') as T[]
  } catch {
    return []
  }
}

function escribir<T>(clave: string, valor: T[]): void {
  localStorage.setItem(clave, JSON.stringify(valor))
  window.dispatchEvent(new Event(EVENTO))
}

export function onCambioLocal(cb: () => void): () => void {
  window.addEventListener(EVENTO, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENTO, cb)
    window.removeEventListener('storage', cb)
  }
}

const publico = (m: MiembroLocal): Miembro => ({
  id: m.id,
  nombre: m.nombre,
  color: m.color,
  es_admin: m.es_admin,
  aprobado: m.aprobado,
  created_at: m.created_at,
})

export function localMiembros(): Miembro[] {
  return leer<MiembroLocal>(K_MIEMBROS).map(publico)
}

export function localReservas(): Reserva[] {
  return leer<Reserva>(K_RESERVAS)
}

export function localRegistrar(nombre: string, pin: string, color: string, esAdmin: boolean): Miembro {
  const ms = leer<MiembroLocal>(K_MIEMBROS)
  if (ms.some((m) => m.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
    throw new Error('Ese nombre ya existe')
  }
  if (ms.some((m) => m.color.toLowerCase() === color.toLowerCase())) {
    throw new Error('Ese color ya está cogido')
  }
  const primero = ms.length === 0
  const nuevo: MiembroLocal = {
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    color: color || '#0e7490',
    pin,
    es_admin: primero ? esAdmin : false,
    aprobado: primero, // first person auto-approved; others wait for admin
    created_at: new Date().toISOString(),
  }
  escribir(K_MIEMBROS, [...ms, nuevo])
  return publico(nuevo)
}

export function localLogin(nombre: string, pin: string): Miembro {
  const m = leer<MiembroLocal>(K_MIEMBROS).find(
    (x) => x.nombre.toLowerCase() === nombre.trim().toLowerCase() && x.pin === pin,
  )
  if (!m) throw new Error('Nombre o PIN incorrectos')
  return publico(m)
}

function verificarAdmin(ms: MiembroLocal[], adminId: string, adminPin: string) {
  const admin = ms.find((m) => m.id === adminId)
  if (!admin || !admin.es_admin || admin.pin !== adminPin) throw new Error('Solo el admin puede hacer esto')
}

export function localAprobar(adminId: string, adminPin: string, miembroId: string): void {
  const ms = leer<MiembroLocal>(K_MIEMBROS)
  verificarAdmin(ms, adminId, adminPin)
  const m = ms.find((x) => x.id === miembroId)
  if (m) m.aprobado = true
  escribir(K_MIEMBROS, ms)
}

export function localRechazar(adminId: string, adminPin: string, miembroId: string): void {
  const ms = leer<MiembroLocal>(K_MIEMBROS)
  verificarAdmin(ms, adminId, adminPin)
  escribir(
    K_MIEMBROS,
    ms.filter((x) => x.id !== miembroId || x.es_admin),
  )
}

export function localRenombrar(id: string, pin: string, nuevo: string): Miembro {
  const ms = leer<MiembroLocal>(K_MIEMBROS)
  const yo = ms.find((m) => m.id === id)
  if (!yo || yo.pin !== pin) throw new Error('PIN incorrecto')
  if (ms.some((m) => m.id !== id && m.nombre.toLowerCase() === nuevo.trim().toLowerCase())) {
    throw new Error('Ese nombre ya existe')
  }
  yo.nombre = nuevo.trim()
  escribir(K_MIEMBROS, ms)
  return publico(yo)
}

export function localCrearReserva(r: {
  miembro_id: string
  fecha_inicio: string
  fecha_fin: string
  nota: string | null
}): void {
  const rs = leer<Reserva>(K_RESERVAS)
  escribir(K_RESERVAS, [
    ...rs,
    { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r },
  ])
}

export function localBorrarReserva(id: string): void {
  escribir(K_RESERVAS, leer<Reserva>(K_RESERVAS).filter((r) => r.id !== id))
}

export function localAnuncios(): Anuncio[] {
  return leer<Anuncio>(K_ANUNCIOS)
}

export function localCrearAnuncio(miembroId: string, texto: string): void {
  const as = leer<Anuncio>(K_ANUNCIOS)
  escribir(K_ANUNCIOS, [
    { id: crypto.randomUUID(), miembro_id: miembroId, texto, created_at: new Date().toISOString() },
    ...as,
  ])
}

export function localBorrarAnuncio(id: string): void {
  escribir(K_ANUNCIOS, leer<Anuncio>(K_ANUNCIOS).filter((a) => a.id !== id))
}
