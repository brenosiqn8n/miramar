import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import {
  localAnuncios,
  localBorrarAnuncio,
  localBorrarReserva,
  localCrearAnuncio,
  localCrearReserva,
  localMiembros,
  localReservas,
  onCambioLocal,
} from '../lib/local'
import type { Anuncio, AnuncioCompleto, Miembro, Reserva, ReservaCompleta } from '../types'

function unir(ms: Miembro[], rs: Reserva[]): ReservaCompleta[] {
  const porId = new Map(ms.map((m) => [m.id, m]))
  return rs
    .map((r) => {
      const miembro = porId.get(r.miembro_id)
      return miembro ? ({ ...r, miembro } as ReservaCompleta) : null
    })
    .filter(Boolean) as ReservaCompleta[]
}

function unirAnuncios(ms: Miembro[], as: Anuncio[]): AnuncioCompleto[] {
  const porId = new Map(ms.map((m) => [m.id, m]))
  return as
    .map((a) => {
      const miembro = porId.get(a.miembro_id)
      return miembro ? ({ ...a, miembro } as AnuncioCompleto) : null
    })
    .filter(Boolean) as AnuncioCompleto[]
}

interface Datos {
  miembros: Miembro[]
  reservas: ReservaCompleta[]
  anuncios: AnuncioCompleto[]
  cargando: boolean
  error: string | null
  recargar: () => Promise<void>
  crearReserva: (r: {
    miembro_id: string
    fecha_inicio: string
    fecha_fin: string
    nota: string | null
  }) => Promise<void>
  borrarReserva: (id: string) => Promise<void>
  crearAnuncio: (miembroId: string, texto: string) => Promise<void>
  borrarAnuncio: (id: string) => Promise<void>
}

export function useDatos(): Datos {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [reservas, setReservas] = useState<ReservaCompleta[]>([])
  const [anuncios, setAnuncios] = useState<AnuncioCompleto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      if (!supabaseConfigurado) {
        const ms = localMiembros()
        setMiembros(ms)
        setReservas(unir(ms, localReservas()).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)))
        setAnuncios(unirAnuncios(ms, localAnuncios()).sort((a, b) => b.created_at.localeCompare(a.created_at)))
        setError(null)
        return
      }
      const [mRes, rRes, aRes] = await Promise.all([
        supabase
          .from('miembros')
          .select('id, nombre, color, es_admin, aprobado, created_at')
          .order('created_at'),
        supabase.from('reservas').select('*').order('fecha_inicio', { ascending: true }),
        supabase.from('anuncios').select('*').order('created_at', { ascending: false }),
      ])
      if (mRes.error) throw mRes.error
      if (rRes.error) throw rRes.error
      if (aRes.error) throw aRes.error
      const ms = (mRes.data as Miembro[]) ?? []
      setMiembros(ms)
      setReservas(unir(ms, (rRes.data as Reserva[]) ?? []))
      setAnuncios(unirAnuncios(ms, (aRes.data as Anuncio[]) ?? []))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    recargar()
    if (!supabaseConfigurado) {
      return onCambioLocal(() => recargar())
    }
    // Live updates so everyone sees the same data without refreshing.
    const canal = supabase
      .channel('miramar-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => recargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'miembros' }, () => recargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anuncios' }, () => recargar())
      .subscribe()
    // Fallback in case Realtime isn't enabled: refetch when the tab regains focus.
    const alEnfocar = () => recargar()
    window.addEventListener('focus', alEnfocar)
    document.addEventListener('visibilitychange', alEnfocar)
    return () => {
      supabase.removeChannel(canal)
      window.removeEventListener('focus', alEnfocar)
      document.removeEventListener('visibilitychange', alEnfocar)
    }
  }, [recargar])

  const crearReserva: Datos['crearReserva'] = useCallback(
    async (r) => {
      if (!supabaseConfigurado) return localCrearReserva(r)
      const { error } = await supabase.from('reservas').insert(r)
      if (error) throw new Error(error.message)
      await recargar()
    },
    [recargar],
  )

  const borrarReserva: Datos['borrarReserva'] = useCallback(
    async (id) => {
      if (!supabaseConfigurado) return localBorrarReserva(id)
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await recargar()
    },
    [recargar],
  )

  const crearAnuncio: Datos['crearAnuncio'] = useCallback(
    async (miembroId, texto) => {
      if (!supabaseConfigurado) return localCrearAnuncio(miembroId, texto)
      const { error } = await supabase.from('anuncios').insert({ miembro_id: miembroId, texto })
      if (error) throw new Error(error.message)
      await recargar()
    },
    [recargar],
  )

  const borrarAnuncio: Datos['borrarAnuncio'] = useCallback(
    async (id) => {
      if (!supabaseConfigurado) return localBorrarAnuncio(id)
      const { error } = await supabase.from('anuncios').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await recargar()
    },
    [recargar],
  )

  return {
    miembros,
    reservas,
    anuncios,
    cargando,
    error,
    recargar,
    crearReserva,
    borrarReserva,
    crearAnuncio,
    borrarAnuncio,
  }
}
