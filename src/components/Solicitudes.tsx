import { useState } from 'react'
import { aprobarMiembro, rechazarMiembro } from '../lib/auth'
import type { Miembro } from '../types'

// Admin-only panel: approve or reject people waiting to join.
export function Solicitudes({
  admin,
  pendientes,
  onCambio,
}: {
  admin: Miembro
  pendientes: Miembro[]
  onCambio: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  if (pendientes.length === 0) return null

  async function actuar(id: string, accion: 'aprobar' | 'rechazar') {
    if (pin.length < 4) {
      setError('Escribe tu PIN de admin arriba.')
      return
    }
    setError(null)
    setOcupado(id)
    try {
      if (accion === 'aprobar') await aprobarMiembro(admin.id, pin, id)
      else await rechazarMiembro(admin.id, pin, id)
      onCambio()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section className="rounded-3xl border border-coral/40 bg-coral-soft/40 p-5">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-display text-lg text-ink">Solicitudes pendientes</h3>
        <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-coral text-xs font-bold text-white">
          {pendientes.length}
        </span>
      </div>
      <p className="text-sm text-ink-soft mb-3">
        Estas personas han creado una cuenta y esperan tu visto bueno.
      </p>

      <label className="block mb-3">
        <span className="mb-1 block text-xs font-medium text-muted">Tu PIN de admin</span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          type="password"
          inputMode="numeric"
          placeholder="••••"
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-ink outline-none focus:border-sea placeholder:text-faint"
        />
      </label>

      {error && <p className="mb-2 text-sm text-coral">{error}</p>}

      <ul className="flex flex-col divide-y divide-coral/20">
        {pendientes.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5">
            <span className="size-3 shrink-0 rounded-full" style={{ background: m.color }} />
            <span className="flex-1 font-medium text-ink truncate">{m.nombre}</span>
            <button
              type="button"
              disabled={ocupado === m.id}
              onClick={() => actuar(m.id, 'rechazar')}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-coral hover:text-coral disabled:opacity-40"
            >
              Rechazar
            </button>
            <button
              type="button"
              disabled={ocupado === m.id}
              onClick={() => actuar(m.id, 'aprobar')}
              className="rounded-full bg-sea px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
            >
              Aprobar
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
