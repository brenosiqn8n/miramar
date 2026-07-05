// All dates are handled as plain ISO strings (YYYY-MM-DD) in local calendar terms
// to avoid timezone drift. No Date-object arithmetic across DST.

export function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function isoAUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function sumarDias(iso: string, n: number): string {
  const t = isoAUTC(iso) + n * 86400000
  const d = new Date(t)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function diasEntre(a: string, b: string): number {
  return Math.round((isoAUTC(b) - isoAUTC(a)) / 86400000)
}

// Weekday Mon=0 … Sun=6.
export function diaSemana(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

export function esFinde(iso: string): boolean {
  return diaSemana(iso) >= 5
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS_LARGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

export function nombreMes(mesIndex: number): string {
  return MESES[mesIndex]
}

// "vie 8 ago"
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = DIAS_LARGO[diaSemana(iso)].slice(0, 3)
  return `${dow} ${d} ${MESES[m - 1].slice(0, 3)}${añoSufijo(y)}`
}

// "8 ago" (no weekday)
export function fechaMinima(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[m - 1].slice(0, 3)}`
}

function añoSufijo(y: number): string {
  const actual = new Date().getFullYear()
  return y === actual ? '' : ` ${String(y).slice(2)}`
}

// Two closed ranges [a1,a2] and [b1,b2] overlap?
export function solapan(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 <= b2 && b1 <= a2
}

// Number of nights in a stay (inicio..fin inclusive of both calendar days).
export function noches(inicio: string, fin: string): number {
  return diasEntre(inicio, fin) + 1
}

// Build a month grid (weeks × 7) of ISO dates, Monday-first. Trailing all-other-
// month weeks are trimmed so short months don't render an empty 6th row.
export function matrizMes(year: number, month: number): string[][] {
  const primero = `${year}-${pad(month + 1)}-01`
  const offset = diaSemana(primero)
  let cursor = sumarDias(primero, -offset)
  const semanas: string[][] = []
  for (let w = 0; w < 6; w++) {
    const fila: string[] = []
    for (let d = 0; d < 7; d++) {
      fila.push(cursor)
      cursor = sumarDias(cursor, 1)
    }
    const algunoDelMes = fila.some((iso) => Number(iso.slice(5, 7)) === month + 1)
    if (w >= 4 && !algunoDelMes) break
    semanas.push(fila)
  }
  return semanas
}
