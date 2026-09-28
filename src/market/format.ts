/**
 * Display formatting for market values.
 *
 * Every function takes a number the API supplied and renders it — none invents,
 * rounds to a misleading precision, or substitutes a fallback value. A
 * non-finite input renders as an em dash so a bad payload is visible rather than
 * silently reading as a real number.
 */

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

export type Direction = 'up' | 'down' | 'flat'

export function directionOf(value: number): Direction {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

export function formatPrice(value: number): string {
  return Number.isFinite(value) ? priceFormatter.format(value) : '—'
}

export function formatIndicator(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—'
}

export function formatVolume(value: number): string {
  return Number.isFinite(value) ? compactFormatter.format(value) : '—'
}

/**
 * An explicit leading sign, so a gain and a loss are distinguishable without
 * relying on colour alone.
 */
export function formatSigned(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const magnitude = Math.abs(value).toFixed(digits)
  if (value > 0) return `+${magnitude}`
  if (value < 0) return `-${magnitude}`
  return magnitude
}

export function formatSignedPercent(value: number): string {
  return Number.isFinite(value) ? `${formatSigned(value)}%` : '—'
}

/**
 * `"2024-01-03"` → a readable date.
 *
 * Parsed as a UTC calendar day so the label never drifts to the previous day in
 * a timezone behind UTC — the trap when a date-only string goes through `Date`.
 */
export function formatTradingDay(date: string): string {
  const parts = date.split('-').map(Number)
  const [year, month, day] = parts
  if (
    parts.length !== 3 ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return date
  }

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** A quote's ISO timestamp, in the viewer's local time. */
export function formatTimestamp(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}
