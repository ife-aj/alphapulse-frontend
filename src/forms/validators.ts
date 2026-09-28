/**
 * Client-side mirrors of the backend's non-market validation rules, so a request
 * is only sent when it can plausibly succeed.
 *
 * Each rule is deliberately **no stricter** than the DTO it mirrors
 * (`docs/backend-contract.md` §7), or the client would reject payloads the API
 * accepts. The server stays the authority.
 */

/** `CreateWatchlistDto` / `UpdateWatchlistDto` / `PortfolioNameDto`. */
export const NAME_MAX_LENGTH = 100

/**
 * Name validation, mirroring the backend's
 * `@Transform(trim) @IsNotEmpty @MinLength(1) @MaxLength(100)`.
 *
 * Trimmed before measuring, exactly as the backend transforms before validating.
 */
export function nameError(raw: string): string | undefined {
  const trimmed = raw.trim()
  if (trimmed === '') return 'A name is required.'
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `A name must be at most ${NAME_MAX_LENGTH} characters long.`
  }
  return undefined
}

export function normalizeName(raw: string): string {
  return raw.trim()
}

/**
 * The shape `CreateHoldingDto` and `UpdateHoldingDto` accept for `quantity` and
 * `averagePurchasePrice`: a finite number greater than 0 with at most 12 integer
 * digits and 6 decimal places.
 *
 * Matched on the **text** the user typed rather than on a parsed number, so
 * "1e-7" or "0.1234567" is rejected here instead of being silently rounded into
 * something the backend would accept.
 */
const DECIMAL_INPUT_PATTERN = /^\d{1,12}(?:\.\d{1,6})?$/

export function decimalInputError(
  raw: string,
  label: string,
): string | undefined {
  const trimmed = raw.trim()
  if (trimmed === '') return `${label} is required.`

  if (!DECIMAL_INPUT_PATTERN.test(trimmed)) {
    return `${label} must be a number with up to 12 digits and 6 decimal places.`
  }
  if (Number(trimmed) <= 0) return `${label} must be greater than 0.`

  return undefined
}

/**
 * Convert validated form text to the number the API expects.
 *
 * The one place a decimal is parsed, and only at the wire boundary — everything
 * the API *returns* stays a string.
 */
export function toDecimalNumber(raw: string): number {
  return Number(raw.trim())
}
