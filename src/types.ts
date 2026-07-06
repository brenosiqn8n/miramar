export interface Miembro {
  id: string
  nombre: string
  color: string
  es_admin: boolean
  aprobado: boolean
  created_at?: string
}

export interface Reserva {
  id: string
  miembro_id: string
  fecha_inicio: string // ISO date YYYY-MM-DD
  fecha_fin: string // ISO date (last night stay); inclusive
  nota: string | null
  created_at?: string
}

// Reserva joined with its member (for display).
export interface ReservaCompleta extends Reserva {
  miembro: Miembro
}

export interface Anuncio {
  id: string
  miembro_id: string
  texto: string
  created_at: string
}

export interface AnuncioCompleto extends Anuncio {
  miembro: Miembro
}
