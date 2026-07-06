import { useMemo, useState } from 'react'
import { fechaCorta, hoyISO, noches } from '../lib/fechas'
import type { ReservaCompleta } from '../types'

// Full log of every booking (past and future), newest booking first.
export function Historial({ reservas }: { reservas: ReservaCompleta[] }) {
  const [abierto, setAbierto] = useState(false)
  const hoy = hoyISO()

  // Ordered by the stay date (fecha_inicio), newest first — not by when it was booked.
  const orden = useMemo(
    () => [...reservas].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)),
    [reservas],
  )

  if (reservas.length === 0) return null

  const visibles = abierto ? orden : orden.slice(0, 5)

  return (
    <section className="rounded-3xl border border-line bg-white p-5">
      <h3 className="font-display text-lg text-ink mb-3">Historial de reservas</h3>
      <ul className="flex flex-col divide-y divide-line">
        {visibles.map((r) => {
          const pasada = r.fecha_fin < hoy
          const n = noches(r.fecha_inicio, r.fecha_fin)
          return (
            <li key={r.id} className={`flex items-start gap-3 py-2.5 ${pasada ? 'opacity-60' : ''}`}>
              <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: r.miembro.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink">
                  <span className="font-medium">{r.miembro.nombre}</span>{' '}
                  <span className="text-muted">reservó</span> {fechaCorta(r.fecha_inicio)} → {fechaCorta(r.fecha_fin)}{' '}
                  <span className="text-faint">· {n} {n === 1 ? 'noche' : 'noches'}</span>
                </div>
                {r.nota && <div className="text-xs text-muted italic">{r.nota}</div>}
                {r.created_at && (
                  <div className="text-[0.7rem] text-faint">apuntado el {fechaCorta(r.created_at.slice(0, 10))}</div>
                )}
              </div>
              {pasada && (
                <span className="shrink-0 rounded-full bg-sand-2 px-2 py-0.5 text-[0.6rem] font-medium text-faint">
                  pasada
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {orden.length > 5 && (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          className="mt-3 text-sm font-medium text-sea hover:text-sea-deep transition-colors"
        >
          {abierto ? 'Ver menos' : `Ver todas (${orden.length})`}
        </button>
      )}
    </section>
  )
}
