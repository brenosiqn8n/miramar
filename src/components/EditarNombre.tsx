import { useState } from 'react'
import { renombrar } from '../lib/auth'
import { useSesion } from '../sesion'

export function EditarNombre() {
  const { miembro, entrar } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(miembro?.nombre ?? '')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  if (!miembro) return null

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      const actualizado = await renombrar(miembro!.id, pin, nombre)
      entrar(actualizado) // refresh session with new name
      setPin('')
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
        onClick={() => {
          setNombre(miembro.nombre)
          setError(null)
          setAbierto(true)
        }}
        aria-label="Editar mi nombre"
        className="grid place-items-center size-7 rounded-full text-muted transition-colors hover:bg-sand-2 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5"
          onClick={() => setAbierto(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            className="w-full max-w-sm rounded-3xl border border-line bg-white p-6"
          >
            <h3 className="font-display text-xl text-ink mb-4">Editar mi nombre</h3>

            <label className="block mb-3">
              <span className="mb-1 block text-xs font-medium text-muted">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-ink outline-none focus:border-sea"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Tu PIN (para confirmar)</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="password"
                inputMode="numeric"
                placeholder="••••"
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
        </div>
      )}
    </>
  )
}
