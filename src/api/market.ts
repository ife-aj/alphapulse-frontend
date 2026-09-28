import { apiRequest } from './client'
import type {
  Candle,
  Quote,
  RsiResult,
  SignalResult,
  TechnicalAnalysis,
} from './types'

/**
 * Market endpoints, matching `alphapulse/src/market/*.controller.ts`:
 *
 * - `GET /market/quotes?symbols=A,B`  → `Quote[]`
 * - `GET /market/candles/:symbol?days=N` → `Candle[]`, oldest-first
 * - `GET /market/indicators/:symbol`  → `TechnicalAnalysis`
 * - `GET /market/indicators/rsi/:symbol` → `RsiResult`
 * - `GET /market/signals/:symbol`     → `SignalResult`
 *
 * All five are **public** — none of the market, indicators, or signals
 * controllers declares a guard — so no access token is sent. A failure here
 * therefore never trips the session-invalidating 401 handler.
 *
 * `symbol` values must already be normalized (trimmed, upper-cased) and valid;
 * see `src/market/symbols.ts`. The backend rejects anything else with a 400.
 */

/** `days` bounds from `GetCandlesQueryDto` — `@Min(1)`, `@Max(365)`. */
export const CANDLE_DAYS_MIN = 1
export const CANDLE_DAYS_MAX = 365

/**
 * Latest quotes.
 *
 * Omitting `symbols` entirely lets the backend return its own default set — the
 * market overview. Passing an **empty** array is different and is rejected with
 * a 400, so an empty array is treated as "no symbols given" here.
 */
export function fetchQuotes(
  symbols?: readonly string[],
  signal?: AbortSignal,
): Promise<Quote[]> {
  const query =
    symbols === undefined || symbols.length === 0
      ? ''
      : `?symbols=${symbols.join(',')}`

  return apiRequest<Quote[]>(`/market/quotes${query}`, { signal })
}

/** Daily OHLCV history for one symbol. */
export function fetchCandles(
  symbol: string,
  days: number,
  signal?: AbortSignal,
): Promise<Candle[]> {
  const bounded = Math.min(
    CANDLE_DAYS_MAX,
    Math.max(CANDLE_DAYS_MIN, Math.trunc(days)),
  )

  return apiRequest<Candle[]>(
    `/market/candles/${encodeURIComponent(symbol)}?days=${bounded}`,
    { signal },
  )
}

/** RSI, SMA 20/50, EMA 20/50 and MACD 12/26/9 in one response. */
export function fetchTechnicalAnalysis(
  symbol: string,
  signal?: AbortSignal,
): Promise<TechnicalAnalysis> {
  return apiRequest<TechnicalAnalysis>(
    `/market/indicators/${encodeURIComponent(symbol)}`,
    { signal },
  )
}

/** Just the RSI reading — cheaper than the full technical analysis. */
export function fetchRsi(
  symbol: string,
  signal?: AbortSignal,
): Promise<RsiResult> {
  return apiRequest<RsiResult>(
    `/market/indicators/rsi/${encodeURIComponent(symbol)}`,
    { signal },
  )
}

/** The discrete BUY/HOLD/SELL signal with its score, confidence and reasons. */
export function fetchSignal(
  symbol: string,
  signal?: AbortSignal,
): Promise<SignalResult> {
  return apiRequest<SignalResult>(
    `/market/signals/${encodeURIComponent(symbol)}`,
    { signal },
  )
}
