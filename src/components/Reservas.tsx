import { useMemo } from 'react'
import { fechaCorta, hoyISO, noches, solapan } from '../lib/fechas'
import type { Miembro, ReservaCompleta } from '../types'

export function Reservas({
  reservas,
  miembro,
  onBorrar,
}: {
  reservas: ReservaCompleta[]
  miembro: Miembro
  onBorrar: (id: string) => void
}) {
  const hoy = hoyISO()

  // Upcoming or ongoing stays (ended ones drop off).
  const proximas = useMemo(
    () => reservas.filter((r) => r.fecha_fin >= hoy).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)),
    [reservas, hoy],
  )

  // For each stay, the OTHER overlapping reservations (kept whole, not just the
  // member, so we can compare created_at to know who booked first).
  const coincidenciasDe = useMemo(() => {
    const map = new Map<string, ReservaCompleta[]>()
    for (const r of proximas) {
      const otros = new Map<string, ReservaCompleta>()
      for (const o of reservas) {
        if (o.id === r.id || o.miembro.id === r.miembro.id) continue
        if (solapan(r.fecha_inicio, r.fecha_fin, o.fecha_inicio, o.fecha_fin)) otros.set(o.miembro.id, o)
      }
      map.set(r.id, [...otros.values()])
    }
    return map
  }, [proximas, reservas])

  // Who booked first within a stay's whole overlap cluster (this row + others).
  const primeroDe = useMemo(() => {
    const map = new Map<string, string>() // reserva.id -> miembro_id who was first
    for (const r of proximas) {
      const otros = coincidenciasDe.get(r.id) ?? []
      if (otros.length === 0) continue
      const cluster = [r, ...otros]
      const primero = cluster.reduce((a, b) =>
        (a.created_at ?? '') <= (b.created_at ?? '') ? a : b,
      )
      map.set(r.id, primero.miembro.id)
    }
    return map
  }, [proximas, coincidenciasDe])

  const hayCoincidencias = [...coincidenciasDe.values()].some((v) => v.length > 0)

  if (proximas.length === 0) {
    return (
      <section className="rounded-3xl border border-line bg-white p-5">
        <h3 className="font-display text-lg text-ink mb-1">Próximas estancias</h3>
        <p className="text-sm text-muted">Nadie tiene días reservados todavía. Reserva los tuyos arriba.</p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-line bg-white p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-lg text-ink">Próximas estancias</h3>
        {hayCoincidencias && (
          <span className="rounded-full bg-coral-soft px-2.5 py-0.5 text-xs font-medium text-coral">
            hay coincidencias
          </span>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {proximas.map((r) => {
          const otros = coincidenciasDe.get(r.id) ?? []
          const primeroId = primeroDe.get(r.id)
          const mio = r.miembro.id === miembro.id
          const n = noches(r.fecha_inicio, r.fecha_fin)
          return (
            <li key={r.id} className="flex items-start gap-3 py-3">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: r.miembro.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink">{r.miembro.nombre}</span>
                  {mio && <span className="text-[0.65rem] font-mono uppercase tracking-wide text-faint">tú</span>}
                  {primeroId === r.miembro.id && (
                    <span className="rounded-full bg-sea-soft px-2 py-0.5 text-[0.65rem] font-medium text-sea-deep">
                      reservó primero
                    </span>
                  )}
                </div>
                <div className="text-sm text-ink-soft">
                  {fechaCorta(r.fecha_inicio)} → {fechaCorta(r.fecha_fin)}{' '}
                  <span className="text-faint">· {n} {n === 1 ? 'noche' : 'noches'}</span>
                </div>
                {r.nota && <div className="text-sm text-muted italic">{r.nota}</div>}
                {otros.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-coral font-medium">coincide con</span>
                    {otros.map((o) => (
                      <span
                        key={o.miembro.id}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: o.miembro.color + '22', color: o.miembro.color }}
                      >
                        {o.miembro.nombre}
                        {primeroId === o.miembro.id && <span title="Reservó primero">★</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {mio && (
                <button
                  type="button"
                  onClick={() => onBorrar(r.id)}
                  aria-label="Borrar reserva"
                  className="shrink-0 grid place-items-center size-8 rounded-lg text-faint transition-colors hover:bg-coral-soft hover:text-coral"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
