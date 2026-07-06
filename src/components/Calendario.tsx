import { useMemo, useState } from 'react'
import { hoyISO, matrizMes, nombreMes } from '../lib/fechas'
import { textoSobre } from '../lib/colores'
import type { Miembro, ReservaCompleta } from '../types'

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
type Vista = 'mes' | 'trimestre' | 'anual'

export interface Seleccion {
  inicio: string | null
  fin: string | null
}

function Caret({ dir }: { dir: 'izq' | 'der' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d={dir === 'izq' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ISO day → distinct members present that night.
function usarPorDia(reservas: ReservaCompleta[]) {
  return useMemo(() => {
    const map = new Map<string, Map<string, Miembro>>()
    for (const r of reservas) {
      let d = r.fecha_inicio
      while (d <= r.fecha_fin) {
        const m = map.get(d) ?? new Map<string, Miembro>()
        m.set(r.miembro.id, r.miembro)
        map.set(d, m)
        d = sig(d)
      }
    }
    return map
  }, [reservas])
}

export function Calendario({
  reservas,
  seleccion,
  onDia,
}: {
  reservas: ReservaCompleta[]
  seleccion: Seleccion
  onDia: (iso: string) => void
}) {
  const hoy = hoyISO()
  const [vista, setVista] = useState<Vista>('mes')
  const [ancla, setAncla] = useState(() => {
    const [y, m] = hoy.split('-').map(Number)
    return { y, m: m - 1 }
  })
  const porDia = usarPorDia(reservas)

  function mover(deltaMes: number) {
    setAncla((a) => {
      const m = a.m + deltaMes
      return { y: a.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
    })
  }
  function moverAnio(delta: number) {
    setAncla((a) => ({ ...a, y: a.y + delta }))
  }

  const enRango = (iso: string) => {
    const { inicio, fin } = seleccion
    if (!inicio) return false
    if (!fin) return iso === inicio
    return iso >= inicio && iso <= fin
  }
  const esExtremo = (iso: string) => iso === seleccion.inicio || iso === seleccion.fin

  const paso = vista === 'anual' ? 12 : vista === 'trimestre' ? 3 : 1
  const titulo =
    vista === 'anual'
      ? `${ancla.y}`
      : vista === 'trimestre'
        ? `${nombreMes(ancla.m).slice(0, 3)} – ${nombreMes((ancla.m + 2) % 12).slice(0, 3)} ${ancla.y}`
        : `${nombreMes(ancla.m)} ${ancla.y}`

  return (
    <section className="rounded-3xl border border-line bg-white p-4 sm:p-5">
      <header className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => (vista === 'anual' ? moverAnio(-1) : mover(-paso))}
          aria-label="Anterior"
          className="grid place-items-center size-9 rounded-full text-ink-soft transition-colors hover:bg-sand-2"
        >
          <Caret dir="izq" />
        </button>
        <h2 className="font-display text-xl text-ink capitalize text-center">{titulo}</h2>
        <button
          type="button"
          onClick={() => (vista === 'anual' ? moverAnio(1) : mover(paso))}
          aria-label="Siguiente"
          className="grid place-items-center size-9 rounded-full text-ink-soft transition-colors hover:bg-sand-2"
        >
          <Caret dir="der" />
        </button>
      </header>

      {/* View switch */}
      <div className="mb-4 flex rounded-full border border-line p-0.5 text-sm">
        {(['mes', 'trimestre', 'anual'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`flex-1 rounded-full py-1.5 font-medium capitalize transition-colors ${
              vista === v ? 'bg-sea text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {vista === 'mes' ? (
        <MesGrande
          year={ancla.y}
          month={ancla.m}
          hoy={hoy}
          porDia={porDia}
          onDia={onDia}
          enRango={enRango}
          esExtremo={esExtremo}
        />
      ) : (
        <div className={vista === 'anual' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
          {mesesDe(vista, ancla).map(({ y, m }) => (
            <MiniMes
              key={`${y}-${m}`}
              year={y}
              month={m}
              hoy={hoy}
              porDia={porDia}
              onDia={(iso) => {
                onDia(iso)
                setAncla({ y, m })
                setVista('mes')
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function MesGrande({
  year,
  month,
  hoy,
  porDia,
  onDia,
  enRango,
  esExtremo,
}: {
  year: number
  month: number
  hoy: string
  porDia: Map<string, Map<string, Miembro>>
  onDia: (iso: string) => void
  enRango: (iso: string) => boolean
  esExtremo: (iso: string) => boolean
}) {
  const semanas = useMemo(() => matrizMes(year, month), [year, month])
  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d, i) => (
          <div key={i} className={`text-center text-[0.7rem] font-medium pb-1 ${i >= 5 ? 'text-coral' : 'text-faint'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {semanas.flat().map((iso) => {
          const delMes = Number(iso.slice(5, 7)) === month + 1
          const ms = [...(porDia.get(iso)?.values() ?? [])]
          const solapa = ms.length >= 2
          const esHoy = iso === hoy
          const rango = enRango(iso)
          const extremo = esExtremo(iso)
          const seleccionSolapa = rango && ms.length > 0 // picking days that already have someone
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDia(iso)}
              className={`relative aspect-square rounded-xl border p-1 text-left transition-colors ${
                extremo && seleccionSolapa
                  ? 'border-coral bg-coral-soft'
                  : seleccionSolapa
                    ? 'border-coral/60 bg-coral-soft/70'
                    : extremo
                      ? 'border-sea bg-sea-soft'
                      : rango
                        ? 'border-sea/30 bg-sea-soft/60'
                        : solapa
                          ? 'border-coral/50 bg-coral-soft/50'
                          : 'border-transparent hover:border-line'
              } ${delMes ? '' : 'opacity-35'}`}
            >
              <span
                className={`inline-grid place-items-center size-5 rounded-full text-[0.72rem] leading-none ${
                  esHoy ? 'bg-ink text-white font-semibold' : 'text-ink-soft'
                }`}
              >
                {Number(iso.slice(8, 10))}
              </span>
              {ms.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                  {ms.slice(0, 4).map((m) => (
                    <span key={m.id} className="h-1.5 flex-1 min-w-1.5 rounded-full" style={{ background: m.color }} title={m.nombre} />
                  ))}
                </div>
              )}
              {solapa && (
                <span className="absolute top-0.5 right-0.5 grid place-items-center size-3.5 rounded-full bg-coral text-[0.55rem] font-bold text-white">
                  {ms.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

function MiniMes({
  year,
  month,
  hoy,
  porDia,
  onDia,
}: {
  year: number
  month: number
  hoy: string
  porDia: Map<string, Map<string, Miembro>>
  onDia: (iso: string) => void
}) {
  const semanas = useMemo(() => matrizMes(year, month), [year, month])
  return (
    <div className="rounded-2xl border border-line p-2.5">
      <div className="text-center text-sm font-medium text-ink capitalize mb-1.5">{nombreMes(month)}</div>
      <div className="grid grid-cols-7 gap-px">
        {semanas.flat().map((iso) => {
          const delMes = Number(iso.slice(5, 7)) === month + 1
          const ms = [...(porDia.get(iso)?.values() ?? [])]
          const solapa = ms.length >= 2
          const esHoy = iso === hoy
          if (!delMes) return <span key={iso} />
          const reservado = ms.length > 0
          const fondo = reservado ? (solapa ? 'var(--color-coral)' : ms[0].color) : undefined
          const texto = reservado ? textoSobre(solapa ? '#e26d5c' : ms[0].color) : undefined
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDia(iso)}
              className={`grid place-items-center aspect-square rounded-md text-[0.6rem] transition-colors ${
                reservado ? '' : 'text-ink-soft hover:bg-sand-2'
              } ${esHoy && !reservado ? 'ring-1 ring-ink' : ''}`}
              style={reservado ? { background: fondo, color: texto } : undefined}
              title={ms.map((m) => m.nombre).join(', ')}
            >
              {Number(iso.slice(8, 10))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function mesesDe(vista: Vista, ancla: { y: number; m: number }) {
  if (vista === 'anual') return Array.from({ length: 12 }, (_, i) => ({ y: ancla.y, m: i }))
  return Array.from({ length: 3 }, (_, i) => {
    const m = ancla.m + i
    return { y: ancla.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
  })
}

function sig(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d) + 86400000
  const nd = new Date(t)
  return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, '0')}-${String(nd.getUTCDate()).padStart(2, '0')}`
}
