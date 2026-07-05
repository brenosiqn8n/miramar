import { supabase, supabaseConfigurado } from './supabase'
import {
  localAprobar,
  localLogin,
  localMiembros,
  localRechazar,
  localRegistrar,
  localRenombrar,
} from './local'
import type { Miembro } from '../types'

const CLAVE = 'miramar-sesion'

export function sesionGuardada(): Miembro | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Miembro) : null
  } catch {
    return null
  }
}

export function guardarSesion(m: Miembro): void {
  localStorage.setItem(CLAVE, JSON.stringify(m))
}

export function cerrarSesion(): void {
  localStorage.removeItem(CLAVE)
}

// List members for the login picker.
export async function listarMiembros(): Promise<Miembro[]> {
  if (!supabaseConfigurado) return localMiembros()
  const { data } = await supabase
    .from('miembros')
    .select('id, nombre, color, es_admin, aprobado, created_at')
    .order('created_at')
  return (data as Miembro[]) ?? []
}

// Verify a PIN against a member. Throws on wrong credentials.
export async function login(nombre: string, pin: string): Promise<Miembro> {
  if (!supabaseConfigurado) return localLogin(nombre, pin)
  const { data, error } = await supabase.rpc('fn_login', { p_nombre: nombre, p_pin: pin })
  if (error) throw new Error(error.message)
  const fila = (data as Miembro[])?.[0]
  if (!fila) throw new Error('Nombre o PIN incorrectos')
  return fila
}

// Rename a member (requires their PIN).
export async function renombrar(id: string, pin: string, nuevo: string): Promise<Miembro> {
  if (!supabaseConfigurado) return localRenombrar(id, pin, nuevo)
  const { data, error } = await supabase.rpc('fn_renombrar', { p_id: id, p_pin: pin, p_nombre: nuevo })
  if (error) throw new Error(error.message.replace(/^.*:\s*/, ''))
  const fila = (data as Miembro[])?.[0]
  if (!fila) throw new Error('No se pudo cambiar el nombre')
  return fila
}

// Create a new member with a hashed PIN. The first member may become admin.
export async function registrar(
  nombre: string,
  pin: string,
  color: string,
  esAdmin: boolean,
): Promise<Miembro> {
  if (!supabaseConfigurado) return localRegistrar(nombre, pin, color, esAdmin)
  const { data, error } = await supabase.rpc('fn_registrar_miembro', {
    p_nombre: nombre,
    p_pin: pin,
    p_color: color,
    p_es_admin: esAdmin,
  })
  if (error) throw new Error(error.message.replace(/^.*:\s*/, ''))
  const fila = (data as Miembro[])?.[0]
  if (!fila) throw new Error('No se pudo crear el miembro')
  return fila
}

// Admin actions: approve or reject a pending member (verifies admin PIN).
export async function aprobarMiembro(adminId: string, adminPin: string, miembroId: string): Promise<void> {
  if (!supabaseConfigurado) return localAprobar(adminId, adminPin, miembroId)
  const { error } = await supabase.rpc('fn_aprobar', {
    p_admin_id: adminId,
    p_admin_pin: adminPin,
    p_miembro_id: miembroId,
  })
  if (error) throw new Error(error.message.replace(/^.*:\s*/, ''))
}

export async function rechazarMiembro(adminId: string, adminPin: string, miembroId: string): Promise<void> {
  if (!supabaseConfigurado) return localRechazar(adminId, adminPin, miembroId)
  const { error } = await supabase.rpc('fn_rechazar', {
    p_admin_id: adminId,
    p_admin_pin: adminPin,
    p_miembro_id: miembroId,
  })
  if (error) throw new Error(error.message.replace(/^.*:\s*/, ''))
}
