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

export default function App() {
  return <Puerta />
}

function Puerta() {
  const { miembro } = useSesion()
  if (!miembro) return <Login />
  return <Principal />
}

function Principal() {
  const { miembro, salir } = useSesion()
  const { reservas, miembros, cargando, error, crearReserva, borrarReserva } = useDatos()
  const [sel, setSel] = useState<Seleccion>({ inicio: null, fin: null })

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
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl text-ink leading-none">Miramar</span>
            <span className="hidden sm:block font-mono text-[0.6rem] tracking-[0.25em] uppercase text-faint">
              piso de playa
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: miembro.color + '22', color: miembro.color }}
            >
              {miembro.nombre}
            </span>
            <EditarNombre />
            <button
              type="button"
              onClick={salir}
              className="text-xs text-muted hover:text-ink transition-colors"
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

        {miembros.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
            {miembros.map((m) => (
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
          personas. Hablad para ir juntos o decidir quién se queda.
        </p>
      </main>
    </div>
  )
}

