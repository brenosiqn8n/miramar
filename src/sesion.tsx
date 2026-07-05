import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Miembro } from './types'
import { cerrarSesion, guardarSesion, sesionGuardada } from './lib/auth'

interface SesionCtx {
  miembro: Miembro | null
  entrar: (m: Miembro) => void
  salir: () => void
}

const Ctx = createContext<SesionCtx | null>(null)

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [miembro, setMiembro] = useState<Miembro | null>(() => sesionGuardada())

  const entrar = useCallback((m: Miembro) => {
    guardarSesion(m)
    setMiembro(m)
  }, [])

  const salir = useCallback(() => {
    cerrarSesion()
    setMiembro(null)
  }, [])

  const valor = useMemo(() => ({ miembro, entrar, salir }), [miembro, entrar, salir])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useSesion(): SesionCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSesion fuera de SesionProvider')
  return ctx
}
