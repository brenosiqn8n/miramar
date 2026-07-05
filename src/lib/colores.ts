// Distinct, legible colors for member tags. Picked to stay apart from each other
// and readable as calendar chips on the sand background.
export const PALETA = [
  '#0e7490', // sea
  '#e26d5c', // coral
  '#3f7d4f', // pine
  '#b4763a', // amber
  '#7c5ca8', // plum
  '#c0567b', // rose
  '#2f6f8f', // steel blue
  '#5a8f6b', // sage
  '#d09a2c', // gold
  '#8a6d4b', // driftwood
  '#12897e', // teal
  '#b5462f', // terracotta
  '#45559c', // indigo
  '#6f8f2a', // olive
  '#a84a86', // magenta
] as const

// Readable text color (dark/light) over a given hex background.
export function textoSobre(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#16303b' : '#ffffff'
}
