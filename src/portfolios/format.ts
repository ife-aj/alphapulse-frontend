/**
 * Display helpers for the portfolio API's decimal **strings**.
 *
 * Everything the API returns for money, quantities and percentages is a
 * canonical decimal string, and every function here works on that string. None
 * parses a value to a number — doing so would round it, and the API deliberately
 * never rounds `currentPrice`.
 *
 * The single parse in the feature happens in `src/forms/validators.ts`, at the
 * wire boundary where the request DTO demands a number.
 */

export type DecimalDirection = 'up' | 'down' | 'flat'

const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/

/**
 * Group the integer part for readability while leaving the fraction byte-for-byte
 * as the API wrote it: `"1904.69"` → `"1,904.69"`, `"182.7465"` → `"182.7465"`.
 *
 * Anything that is not a plain decimal is returned unchanged rather than guessed
 * at.
 */
export function formatDecimal(raw: string): string {
  const match = DECIMAL_PATTERN.exec(raw.trim())
  if (match === null) return raw

  const sign = match[1]
  const grouped = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fraction = match[3]

  return fraction === undefined
    ? `${sign}${grouped}`
    : `${sign}${grouped}.${fraction}`
}

/** Direction from the string's own sign — no numeric parse needed. */
export function decimalDirection(raw: string): DecimalDirection {
  const trimmed = raw.trim()
  if (trimmed.startsWith('-')) return 'down'
  // Zero in any spelling ("0", "0.00", "-0.00") is flat, not a gain.
  if (/^-?0*(?:\.0*)?$/.test(trimmed)) return 'flat'
  return 'up'
}

/** With an explicit leading `+` for gains, so direction survives without colour. */
export function formatDecimalSigned(raw: string): string {
  const formatted = formatDecimal(raw)
  return decimalDirection(raw) === 'up' ? `+${formatted}` : formatted
}

export function formatDecimalPercent(raw: string): string {
  return `${formatDecimalSigned(raw)}%`
}
