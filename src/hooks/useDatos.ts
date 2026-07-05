import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import {
  localBorrarReserva,
  localCrearReserva,
  localMiembros,
  localReservas,
  onCambioLocal,
} from '../lib/local'
import type { Miembro, Reserva, ReservaCompleta } from '../types'

function unir(ms: Miembro[], rs: Reserva[]): ReservaCompleta[] {
  const porId = new Map(ms.map((m) => [m.id, m]))
  return rs
    .map((r) => {
      const miembro = porId.get(r.miembro_id)
      return miembro ? ({ ...r, miembro } as ReservaCompleta) : null
    })
    .filter(Boolean) as ReservaCompleta[]
}

interface Datos {
  miembros: Miembro[]
  reservas: ReservaCompleta[]
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
}

export function useDatos(): Datos {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [reservas, setReservas] = useState<ReservaCompleta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      if (!supabaseConfigurado) {
        const ms = localMiembros()
        setMiembros(ms)
        setReservas(unir(ms, localReservas()).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)))
        setError(null)
        return
      }
      const [mRes, rRes] = await Promise.all([
        supabase
          .from('miembros')
          .select('id, nombre, color, es_admin, aprobado, created_at')
          .order('created_at'),
        supabase.from('reservas').select('*').order('fecha_inicio', { ascending: true }),
      ])
      if (mRes.error) throw mRes.error
      if (rRes.error) throw rRes.error
      const ms = (mRes.data as Miembro[]) ?? []
      setMiembros(ms)
      setReservas(unir(ms, (rRes.data as Reserva[]) ?? []))
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
      // Local mode: react to changes in this tab / other tabs.
      return onCambioLocal(() => recargar())
    }
    // Live updates so everyone sees the same bookings without refreshing.
    const canal = supabase
      .channel('reservas-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => recargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'miembros' }, () => recargar())
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [recargar])

  const crearReserva: Datos['crearReserva'] = useCallback(
    async (r) => {
      if (!supabaseConfigurado) {
        localCrearReserva(r)
        return
      }
      const { error } = await supabase.from('reservas').insert(r)
      if (error) throw new Error(error.message)
      await recargar()
    },
    [recargar],
  )

  const borrarReserva: Datos['borrarReserva'] = useCallback(
    async (id) => {
      if (!supabaseConfigurado) {
        localBorrarReserva(id)
        return
      }
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await recargar()
    },
    [recargar],
  )

  return { miembros, reservas, cargando, error, recargar, crearReserva, borrarReserva }
}
