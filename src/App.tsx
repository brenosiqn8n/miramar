import { useState } from 'react'
import { supabaseConfigurado } from './lib/supabase'
import { useSesion } from './sesion'
import { useDatos } from './hooks/useDatos'
import { Login } from './components/Login'
import { Calendario, type Seleccion } from './components/Calendario'
import { FormReserva } from './components/FormReserva'
import { Reservas } from './components/Reservas'
import { Historial } from './components/Historial'
import { EditarNombre } from './components/EditarNombre'
import { Solicitudes } from './components/Solicitudes'
import { Anuncios } from './components/Anuncios'
import { listarMiembros } from './lib/auth'
import { useEffect } from 'react'

export default function App() {
  return <Puerta />
}

function Ola() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" strokeLinecap="round" />
    </svg>
  )
}

function Puerta() {
  const { miembro } = useSesion()
  if (!miembro) return <Login />
  if (!miembro.aprobado) return <Pendiente />
  return <Principal />
}

function Pendiente() {
  const { miembro, entrar, salir } = useSesion()
  const [comprobando, setComprobando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function comprobar() {
    if (!miembro) return
    setComprobando(true)
    setAviso(null)
    try {
      const ms = await listarMiembros()
      const yo = ms.find((m) => m.id === miembro.id)
      if (yo?.aprobado) entrar(yo)
      else setAviso('Todavía no. El admin aún no te ha aprobado.')
    } finally {
      setComprobando(false)
    }
  }

  // Auto-check periodically so it unlocks without a manual tap.
  useEffect(() => {
    const id = setInterval(comprobar, 15000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="font-display text-4xl text-ink mb-3">Casi está</h1>
        <p className="text-ink-soft mb-1">
          Hola <b style={{ color: miembro?.color }}>{miembro?.nombre}</b>. Tu cuenta está creada y
          esperando el visto bueno del administrador.
        </p>
        <p className="text-sm text-muted mb-6">Avísale para que te apruebe. Se desbloquea solo al aceptarte.</p>
        {aviso && <p className="text-sm text-coral mb-3">{aviso}</p>}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={comprobar}
            disabled={comprobando}
            className="rounded-full bg-sea py-3 font-semibold text-white transition-colors hover:bg-sea-deep disabled:opacity-40"
          >
            {comprobando ? 'Comprobando…' : 'Ya me han aprobado'}
          </button>
          <button type="button" onClick={salir} className="text-sm text-muted hover:text-ink transition-colors">
            salir
          </button>
        </div>
      </div>
    </div>
  )
}

function Principal() {
  const { miembro, salir } = useSesion()
  const {
    reservas,
    miembros,
    anuncios,
    cargando,
    error,
    crearReserva,
    borrarReserva,
    crearAnuncio,
    borrarAnuncio,
    recargar,
  } = useDatos()
  const [sel, setSel] = useState<Seleccion>({ inicio: null, fin: null })
  const pendientes = miembros.filter((m) => !m.aprobado)
  const aprobados = miembros.filter((m) => m.aprobado)

  function clickDia(iso: string) {
    setSel((s) => {
      // No start yet, or a full range already picked → start over.
      if (!s.inicio || (s.inicio && s.fin)) return { inicio: iso, fin: null }
      // Start set, choosing the end. Earlier click becomes the new start.
      if (iso < s.inicio) return { inicio: iso, fin: null }
      return { inicio: s.inicio, fin: iso }
    })
  }

  if (!miembro) return null

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-sand/80 backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-2.5 relative flex items-center justify-center">
          <div className="flex flex-col items-center leading-none">
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.55rem] tracking-[0.28em] uppercase text-faint mb-0.5">
              <Ola />
              piso de playa
            </span>
            <span className="font-display text-2xl text-ink leading-none">Miramar</span>
          </div>
          <div className="absolute right-3 flex items-center gap-1">
            <span
              className="max-w-[6.5rem] truncate rounded-full px-2.5 py-1 text-sm font-medium"
              style={{ background: miembro.color + '22', color: miembro.color }}
            >
              {miembro.nombre}
            </span>
            <EditarNombre />
            <button
              type="button"
              onClick={salir}
              className="text-[0.7rem] text-muted hover:text-ink transition-colors"
            >
              salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5 flex flex-col gap-5 pb-16">
        {!supabaseConfigurado && (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink-soft">
            <b className="text-ink">Modo local.</b> Estás probando sin nube: los datos solo se
            guardan en este navegador y no se comparten. Conecta Supabase para compartirlo entre todos.
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-coral/40 bg-coral-soft px-4 py-3 text-sm text-coral">
            {error}
          </p>
        )}

        {miembro.es_admin && (
          <Solicitudes admin={miembro} pendientes={pendientes} onCambio={recargar} />
        )}

        <Anuncios
          anuncios={anuncios}
          miembro={miembro}
          onCrear={(t) => crearAnuncio(miembro.id, t)}
          onBorrar={borrarAnuncio}
        />

        {aprobados.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
            {aprobados.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                {m.nombre}
              </span>
            ))}
          </div>
        )}

        <Calendario reservas={reservas} onDia={clickDia} seleccion={sel} />

        <FormReserva
          miembro={miembro}
          reservas={reservas}
          seleccion={sel}
          onCrear={async (r) => {
            await crearReserva(r)
            setSel({ inicio: null, fin: null })
          }}
        />

        {cargando ? (
          <div className="h-24 rounded-3xl bg-white/60 animate-pulse" />
        ) : (
          <>
            <Reservas reservas={reservas} miembro={miembro} onBorrar={borrarReserva} />
            <Historial reservas={reservas} />
          </>
        )}

        <p className="text-center text-xs text-faint pt-2">
          Los días con <span className="text-coral font-medium">número en rojo</span> tienen varias
          personas. Hablad para ir juntos o decidid quién se queda.
        </p>
      </main>
    </div>
  )
}

