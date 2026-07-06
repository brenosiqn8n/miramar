import { useState } from 'react'
import { createPortal } from 'react-dom'
import { editarPerfil } from '../lib/auth'
import { useSesion } from '../sesion'
import { PALETA } from '../lib/colores'
import type { Miembro } from '../types'

// Click your own name badge to open this: change name, color, and (optionally)
// your PIN. Requires the current PIN to confirm any change.
export function EditarPerfil({ miembros }: { miembros: Miembro[] }) {
  const { miembro, entrar } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('')
  const [pin, setPin] = useState('')
  const [nuevoPin, setNuevoPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  if (!miembro) return null

  const usados = new Set(
    miembros.filter((m) => m.id !== miembro.id).map((m) => m.color.toLowerCase()),
  )

  function abrir() {
    setNombre(miembro!.nombre)
    setColor(miembro!.color)
    setPin('')
    setNuevoPin('')
    setError(null)
    setAbierto(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      const actualizado = await editarPerfil(miembro!.id, pin, nombre, color, nuevoPin)
      entrar(actualizado)
      setAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="group max-w-[7rem] inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: miembro.color + '22', color: miembro.color }}
      >
        <span className="truncate">{miembro.nombre}</span>
        <svg
          viewBox="0 0 24 24"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className="shrink-0 opacity-70 group-hover:opacity-100"
        >
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto &&
        createPortal(
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5 overflow-y-auto py-10"
            onClick={() => setAbierto(false)}
          >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            className="w-full max-w-sm rounded-3xl border border-line bg-white p-6"
          >
            <h3 className="font-display text-xl text-ink mb-4">Tu perfil</h3>

            <label className="block mb-3">
              <span className="mb-1 block text-xs font-medium text-muted">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-ink outline-none focus:border-sea"
              />
            </label>

            <div className="mb-3">
              <span className="mb-1 block text-xs font-medium text-muted">Color</span>
              <div className="flex flex-wrap gap-2">
                {PALETA.map((c) => {
                  const ocupado = usados.has(c.toLowerCase())
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={ocupado}
                      onClick={() => setColor(c)}
                      aria-label={ocupado ? `color ${c} ya usado` : `elegir color ${c}`}
                      className={`relative size-8 rounded-full transition-transform ${
                        ocupado ? 'cursor-not-allowed opacity-30' : 'hover:scale-110'
                      }`}
                      style={{
                        background: c,
                        boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                      }}
                    >
                      {ocupado && (
                        <span className="absolute inset-0 grid place-items-center text-white">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12h14" strokeLinecap="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block mb-3">
              <span className="mb-1 block text-xs font-medium text-muted">Tu PIN actual (para confirmar)</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="password"
                inputMode="numeric"
                placeholder="••••"
                className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-ink outline-none focus:border-sea placeholder:text-faint"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Nuevo PIN <span className="normal-case text-faint">(opcional, para cambiarlo)</span>
              </span>
              <input
                value={nuevoPin}
                onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="password"
                inputMode="numeric"
                placeholder="Déjalo vacío para no cambiarlo"
                className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-ink outline-none focus:border-sea placeholder:text-faint"
              />
            </label>

            {error && <p className="mt-3 text-sm text-coral">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex-1 rounded-full border border-line py-2.5 font-medium text-ink-soft transition-colors hover:bg-sand-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || nombre.trim().length < 2 || pin.length < 4}
                className="flex-1 rounded-full bg-sea py-2.5 font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
          </div>,
          document.body,
        )}
    </>
  )
}
