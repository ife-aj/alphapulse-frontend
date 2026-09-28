import { errorMessage, isApiError } from './client'

/**
 * Turns an API failure into copy a state block can render.
 *
 * Used by the watchlist and portfolio features, whose error vocabularies are the
 * same handful of statuses. The backend's own message becomes the description,
 * so what a user reads is the API's wording rather than a paraphrase.
 *
 * The market feature keeps its own describer (`src/market/errors.ts`) because its
 * status-to-meaning mapping differs — 404 there means "no market data for this
 * symbol", not "not found".
 */
export type ApiErrorKind =
  | 'invalid-input'
  | 'not-found'
  | 'conflict'
  | 'market-unavailable'
  | 'rate-limited'
  | 'provider'
  | 'unavailable'
  | 'network'
  | 'unknown'

export interface ApiErrorInfo {
  kind: ApiErrorKind
  /** Short heading for the state block. */
  title: string
  /** The backend's message. */
  description: string
  /** Whether another attempt could plausibly succeed. */
  retryable: boolean
}

const TITLES: Record<ApiErrorKind, string> = {
  'invalid-input': 'That input was rejected',
  'not-found': 'Not found',
  conflict: 'That already exists',
  'market-unavailable': 'Cannot value this portfolio',
  'rate-limited': 'Market data is rate limited',
  provider: 'Market data provider error',
  unavailable: 'AlphaPulse is unavailable',
  network: "Can't reach AlphaPulse",
  unknown: 'Something went wrong',
}

function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'invalid-input'
    case 404:
      return 'not-found'
    case 409:
      return 'conflict'
    case 422:
      return 'market-unavailable'
    case 429:
      return 'rate-limited'
    case 502:
    case 504:
      return 'provider'
    case 503:
      return 'unavailable'
    default:
      return 'unknown'
  }
}

/**
 * Retrying a rejected input, a missing record, a conflict or an unvaluable
 * portfolio cannot succeed; retrying a rate limit only extends it.
 */
function isRetryable(kind: ApiErrorKind): boolean {
  return (
    kind === 'provider' ||
    kind === 'unavailable' ||
    kind === 'network' ||
    kind === 'unknown'
  )
}

export function describeApiError(error: unknown): ApiErrorInfo {
  if (!isApiError(error)) {
    return {
      kind: 'unknown',
      title: TITLES.unknown,
      description: errorMessage(error),
      retryable: true,
    }
  }

  const kind: ApiErrorKind = error.isNetworkError
    ? 'network'
    : kindForStatus(error.status)

  return {
    kind,
    title: TITLES[kind],
    description: error.message,
    retryable: isRetryable(kind),
  }
}
