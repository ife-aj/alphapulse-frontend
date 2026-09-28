import { errorMessage, isApiError } from '../api/client'

/**
 * Turns a market failure into copy the UI can render.
 *
 * The kinds and their backend causes are all verified from
 * `alphapulse/src/market/provider-errors.ts`, which is the complete translation
 * layer for `/api/market`. Each kind carries the backend's own message as its
 * description, so what the user reads is the API's wording rather than a
 * paraphrase.
 */
export type MarketErrorKind =
  | 'invalid-symbol'
  | 'unknown-symbol'
  | 'not-enough-data'
  | 'rate-limited'
  | 'provider'
  | 'unavailable'
  | 'network'
  | 'unknown'

export interface MarketErrorInfo {
  kind: MarketErrorKind
  /** Short heading for the state block. */
  title: string
  /** The backend's message, plus any framing that helps. */
  description: string
  /** Whether another attempt could plausibly succeed. */
  retryable: boolean
}

const TITLES: Record<MarketErrorKind, string> = {
  'invalid-symbol': 'That symbol is not valid',
  'unknown-symbol': 'No market data',
  'not-enough-data': 'Not enough history',
  'rate-limited': 'Market data is rate limited',
  provider: 'Market data provider error',
  unavailable: 'Market data is unavailable',
  network: "Can't reach AlphaPulse",
  unknown: 'Could not load market data',
}

function kindForStatus(status: number): MarketErrorKind {
  switch (status) {
    case 400:
      return 'invalid-symbol'
    case 404:
      return 'unknown-symbol'
    case 429:
      return 'rate-limited'
    case 502:
    case 504:
      return 'provider'
    case 503:
      return 'unavailable'
    case 422:
      // Not produced by any file read in this project: provider-errors.ts
      // defines no insufficient-data exception, so how the indicator routes
      // report too little history is unverified. 422 is the status this backend
      // does use for "cannot compute from market data" (portfolio valuation), so
      // it is presented as an insufficient-history state while every other
      // status still falls through to the generic handling below.
      return 'not-enough-data'
    default:
      return 'unknown'
  }
}

/** Retrying a rejected symbol or a rate limit only wastes the provider's quota. */
function isRetryable(kind: MarketErrorKind): boolean {
  return (
    kind === 'provider' ||
    kind === 'unavailable' ||
    kind === 'network' ||
    kind === 'unknown'
  )
}

export function describeMarketError(error: unknown): MarketErrorInfo {
  if (!isApiError(error)) {
    return {
      kind: 'unknown',
      title: TITLES.unknown,
      description: errorMessage(error),
      retryable: true,
    }
  }

  const kind: MarketErrorKind = error.isNetworkError
    ? 'network'
    : kindForStatus(error.status)

  return {
    kind,
    title: TITLES[kind],
    description: error.message,
    retryable: isRetryable(kind),
  }
}
