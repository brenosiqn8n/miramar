import { useState } from 'react'
import { fechaCorta } from '../lib/fechas'
import type { AnuncioCompleto, Miembro } from '../types'

// Shared noticeboard: short messages with who wrote them and when.
export function Anuncios({
  anuncios,
  miembro,
  onCrear,
  onBorrar,
}: {
  anuncios: AnuncioCompleto[]
  miembro: Miembro
  onCrear: (texto: string) => Promise<void>
  onBorrar: (id: string) => void
}) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function publicar(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setEnviando(true)
    try {
      await onCrear(t)
      setTexto('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-white p-5">
      <h3 className="font-display text-lg text-ink mb-3">Tablón de anuncios</h3>

      <form onSubmit={publicar} className="flex gap-2 mb-4">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={280}
          placeholder="Escribe algo para todos…"
          className="flex-1 min-w-0 rounded-xl border border-line bg-sand px-3.5 py-2.5 text-ink outline-none focus:border-sea placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="shrink-0 rounded-xl bg-sea px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
        >
          Publicar
        </button>
      </form>

      {anuncios.length === 0 ? (
        <p className="text-sm text-muted">Sin anuncios. Sé el primero en escribir algo.</p>
      ) : (
        <ul
          className={`flex flex-col gap-3 ${
            anuncios.length > 1 ? 'max-h-[15rem] overflow-y-auto pr-1 -mr-1' : ''
          }`}
        >
          {anuncios.map((a) => {
            const mio = a.miembro.id === miembro.id
            const puedeBorrar = mio || miembro.es_admin
            return (
              <li key={a.id} className="rounded-2xl border border-line bg-sand/60 p-3">
                <p className="text-sm text-ink whitespace-pre-wrap break-words">{a.texto}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: a.miembro.color }}>
                    <span className="size-2 rounded-full" style={{ background: a.miembro.color }} />
                    {a.miembro.nombre}
                  </span>
                  <span className="text-faint">· {fechaCorta(a.created_at.slice(0, 10))}</span>
                  {puedeBorrar && (
                    <button
                      type="button"
                      onClick={() => onBorrar(a.id)}
                      className="ml-auto text-faint transition-colors hover:text-coral"
                      aria-label="Borrar anuncio"
                    >
                      borrar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
