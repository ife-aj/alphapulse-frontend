/**
 * Client mirror of `alphapulse/src/market/validation/symbol.validation.ts`.
 *
 * Kept in step with the backend so a symbol is rejected here for exactly the
 * reasons it would be rejected there. The backend's rule, which is the
 * authority:
 *
 *   - 1–5 uppercase letters (F, T, AAPL, GOOGL)
 *   - an optional dotted class suffix of 1–2 letters (BRK.B, BRK.A)
 *   - no digits, hyphens or slashes — those are other conventions (Yahoo writes
 *     BRK-B, Bloomberg BRK/B) or reserved by the provider for forex/crypto
 *     pairs, which AlphaPulse does not support
 */

export const SYMBOL_REGEX = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/

/** The backend's own wording, reused verbatim in validation messages. */
export const SYMBOL_FORMAT_HINT = 'Expected a ticker such as AAPL or BRK.B.'

/** Canonical form: trimmed and upper-cased. */
export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase()
}

/** True when an already-normalized symbol matches the supported format. */
export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_REGEX.test(symbol)
}

/**
 * The message for a symbol typed into the search field, or undefined when it is
 * acceptable. Mirrors `ParseSymbolPipe`, including its two distinct messages for
 * a missing symbol and a malformed one.
 */
export function symbolInputError(raw: string): string | undefined {
  if (raw.trim() === '') {
    return `A stock symbol is required. ${SYMBOL_FORMAT_HINT}`
  }

  const normalized = normalizeSymbol(raw)
  if (!isValidSymbol(normalized)) {
    return `Invalid symbol "${raw}". ${SYMBOL_FORMAT_HINT}`
  }

  return undefined
}

/** The route path for a symbol's detail view. */
export function symbolPath(symbol: string): string {
  return `/app/markets/${encodeURIComponent(symbol)}`
}
