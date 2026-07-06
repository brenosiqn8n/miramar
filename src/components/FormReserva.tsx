import { useEffect, useState } from 'react'
import { hoyISO, noches, solapan } from '../lib/fechas'
import type { Miembro, ReservaCompleta } from '../types'

export function FormReserva({
  miembro,
  reservas,
  seleccion,
  onCrear,
}: {
  miembro: Miembro
  reservas: ReservaCompleta[]
  seleccion: { inicio: string | null; fin: string | null }
  onCrear: (r: { miembro_id: string; fecha_inicio: string; fecha_fin: string; nota: string | null }) => Promise<void>
}) {
  const hoy = hoyISO()
  const [inicio, setInicio] = useState(hoy)
  const [fin, setFin] = useState(hoy)
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Selecting days on the calendar drives the range (start, then end).
  useEffect(() => {
    if (seleccion.inicio) {
      setInicio(seleccion.inicio)
      if (seleccion.fin) setFin(seleccion.fin)
      else setFin((f) => (f < seleccion.inicio! ? seleccion.inicio! : f))
    }
  }, [seleccion.inicio, seleccion.fin])

  const finValido = fin >= inicio
  const n = finValido ? noches(inicio, fin) : 0

  // Who else already overlaps this range (excluding myself).
  const coincidencias = reservas.filter(
    (r) => r.miembro.id !== miembro.id && solapan(inicio, fin, r.fecha_inicio, r.fecha_fin),
  )

  // My OWN reservations that already cover part of this range — block duplicates.
  const yaTengo = finValido
    ? reservas.filter((r) => r.miembro.id === miembro.id && solapan(inicio, fin, r.fecha_inicio, r.fecha_fin))
    : []

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!finValido) {
      setError('La salida no puede ser antes de la entrada.')
      return
    }
    if (yaTengo.length > 0) {
      setError('Ya tienes esos días reservados.')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      await onCrear({ miembro_id: miembro.id, fecha_inicio: inicio, fecha_fin: fin, nota: nota.trim() || null })
      setNota('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-3xl border border-line bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="size-3 rounded-full" style={{ background: miembro.color }} />
        <h3 className="font-display text-lg text-ink">Reservar días</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-muted">Entrada</span>
          <input
            type="date"
            value={inicio}
            onChange={(e) => {
              setInicio(e.target.value)
              if (fin < e.target.value) setFin(e.target.value)
            }}
            className="block w-full min-w-0 appearance-none rounded-xl border border-line bg-sand px-3 py-2.5 text-ink outline-none focus:border-sea"
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-muted">Salida</span>
          <input
            type="date"
            value={fin}
            min={inicio}
            onChange={(e) => setFin(e.target.value)}
            className="block w-full min-w-0 appearance-none rounded-xl border border-line bg-sand px-3 py-2.5 text-ink outline-none focus:border-sea"
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-faint">
        Truco: toca un día en el calendario para la entrada y otro para la salida.
      </p>

      {/* Optional note — visually set apart from the required fields. */}
      <div className="mt-3 rounded-xl border border-dashed border-line bg-sand-2/60 p-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-medium text-ink-soft">Nota</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-faint">
            opcional
          </span>
        </div>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej: con los niños, llego por la tarde…"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus:border-sea placeholder:text-faint"
        />
      </div>

      {finValido && (
        <p className="mt-3 text-sm text-ink-soft">
          {n} {n === 1 ? 'noche' : 'noches'}
          {coincidencias.length > 0 && (
            <span className="text-coral">
              {' '}· coincides con{' '}
              {[...new Set(coincidencias.map((c) => c.miembro.nombre))].join(', ')}
            </span>
          )}
        </p>
      )}

      {yaTengo.length > 0 && (
        <p className="mt-2 text-sm text-coral">Ya tienes esos días reservados.</p>
      )}

      {error && <p className="mt-2 text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={enviando || !finValido || yaTengo.length > 0}
        className="mt-4 w-full rounded-full bg-sea py-3 font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
      >
        {enviando ? 'Guardando…' : 'Reservar'}
      </button>
    </form>
  )
}
