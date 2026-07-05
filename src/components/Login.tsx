import { useEffect, useState } from 'react'
import { login, listarMiembros, registrar } from '../lib/auth'
import { useSesion } from '../sesion'
import { PALETA } from '../lib/colores'
import type { Miembro } from '../types'

export function Login() {
  const { entrar } = useSesion()
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [miembros, setMiembros] = useState<Miembro[]>([])

  useEffect(() => {
    listarMiembros().then((ms) => {
      setMiembros(ms)
      if (ms.length === 0) setModo('crear')
    })
  }, [])

  return (
    <div className="min-h-dvh grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sea-deep mb-3">
            <Ola />
            <span className="font-mono text-[0.7rem] tracking-[0.3em] uppercase text-muted">
              Piso de playa
            </span>
          </div>
          <h1 className="font-display text-5xl text-ink leading-none">Miramar</h1>
          <p className="mt-3 text-muted text-sm">Reserva tus días y cuadrad entre todos.</p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_20px_50px_-24px_rgba(11,85,103,0.35)]">
          {modo === 'entrar' ? (
            <FormEntrar miembros={miembros} onEntrar={entrar} onCrear={() => setModo('crear')} />
          ) : (
            <FormCrear
              miembros={miembros}
              onCreado={entrar}
              onVolver={miembros.length > 0 ? () => setModo('entrar') : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function FormEntrar({
  miembros,
  onEntrar,
  onCrear,
}: {
  miembros: Miembro[]
  onEntrar: (m: Miembro) => void
  onCrear: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      onEntrar(await login(nombre, pin))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div>
        <Etiqueta>¿Quién eres?</Etiqueta>
        {miembros.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {miembros.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setNombre(m.nombre)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  nombre === m.nombre
                    ? 'ring-2 ring-offset-1 ring-offset-white'
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  background: m.color + '22',
                  color: m.color,
                  boxShadow: nombre === m.nombre ? `0 0 0 2px ${m.color}` : undefined,
                }}
              >
                {m.nombre}
              </button>
            ))}
          </div>
        ) : (
          <Input value={nombre} onChange={setNombre} placeholder="Tu nombre" />
        )}
      </div>

      <div>
        <Etiqueta>PIN</Etiqueta>
        <Input
          value={pin}
          onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••"
          type="password"
          inputMode="numeric"
        />
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={cargando || !nombre || pin.length < 4}
        className="rounded-full bg-sea py-3 font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
      >
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>

      <button
        type="button"
        onClick={onCrear}
        className="text-sm text-muted hover:text-ink transition-colors"
      >
        Soy nuevo · crear mi acceso
      </button>
    </form>
  )
}

function FormCrear({
  miembros,
  onCreado,
  onVolver,
}: {
  miembros: Miembro[]
  onCreado: (m: Miembro) => void
  onVolver?: () => void
}) {
  const usados = new Set(miembros.map((m) => m.color.toLowerCase()))
  const primerLibre = PALETA.find((c) => !usados.has(c.toLowerCase())) ?? PALETA[0]
  const [nombre, setNombre] = useState('')
  const [pin, setPin] = useState('')
  const [color, setColor] = useState<string>(primerLibre)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      onCreado(await registrar(nombre, pin, color))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div>
        <Etiqueta>Tu nombre</Etiqueta>
        <Input value={nombre} onChange={setNombre} placeholder="Ej: Breno" />
      </div>
      <div>
        <Etiqueta>Elige un PIN (4–6 dígitos)</Etiqueta>
        <Input
          value={pin}
          onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••"
          type="password"
          inputMode="numeric"
        />
      </div>
      <div>
        <Etiqueta>Tu color (los usados no se pueden elegir)</Etiqueta>
        <div className="flex flex-wrap gap-2">
          {PALETA.map((c) => {
            const ocupado = usados.has(c.toLowerCase())
            return (
              <button
                key={c}
                type="button"
                disabled={ocupado}
                aria-label={ocupado ? `color ${c} ya usado` : `elegir color ${c}`}
                onClick={() => setColor(c)}
                className={`relative size-8 rounded-full transition-transform ${
                  ocupado ? 'cursor-not-allowed opacity-30' : 'hover:scale-110'
                }`}
                style={{
                  background: c,
                  boxShadow: color === c && !ocupado ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                }}
              >
                {ocupado && (
                  <span className="absolute inset-0 grid place-items-center text-white">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={cargando || nombre.trim().length < 2 || pin.length < 4}
        className="rounded-full bg-sea py-3 font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
      >
        {cargando ? 'Creando…' : 'Crear acceso'}
      </button>

      {onVolver && (
        <button
          type="button"
          onClick={onVolver}
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          ← Ya tengo acceso
        </button>
      )}
    </form>
  )
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-muted">{children}</span>
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'numeric'
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-sea placeholder:text-faint"
    />
  )
}

function Ola() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" strokeLinecap="round" />
      <path d="M2 19c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
