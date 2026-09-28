import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import {
  fetchCandles,
  fetchQuotes,
  fetchRsi,
  fetchSignal,
  fetchTechnicalAnalysis,
} from '../api/market'
import type {
  Candle,
  Quote,
  RsiResult,
  SignalResult,
  TechnicalAnalysis,
} from '../api/types'

/**
 * Stable query keys. The symbol list is sorted before it becomes part of a key,
 * so the same set of symbols always resolves to the same cache entry — which is
 * what lets the dashboard and the markets index share one `/market/quotes` call.
 */
export const marketKeys = {
  all: ['market'] as const,
  quotes: (symbols: string[] | null) => ['market', 'quotes', symbols] as const,
  candles: (symbol: string, days: number) =>
    ['market', 'candles', symbol, days] as const,
  analysis: (symbol: string) => ['market', 'analysis', symbol] as const,
  rsi: (symbol: string) => ['market', 'rsi', symbol] as const,
  signal: (symbol: string) => ['market', 'signal', symbol] as const,
}

/**
 * Daily candles change at most once a trading day, so they stay fresh far longer
 * than a live quote.
 */
const QUOTE_STALE_MS = 60_000
const CANDLE_STALE_MS = 5 * 60 * 1000
const DERIVED_STALE_MS = 60_000

/** Switching back to a previously viewed range should not refetch. */
const CANDLE_GC_MS = 30 * 60 * 1000

/**
 * Retry policy for every market query.
 *
 * A 4xx is terminal: a malformed or unknown symbol will never succeed on retry,
 * and a 429 must not be retried or it extends the rate limit. Only transport
 * failures (status 0) and 5xx are worth a second attempt.
 */
function shouldRetry(failureCount: number, error: ApiError): boolean {
  if (error.isNetworkError || error.status >= 500) return failureCount < 2
  return false
}

/**
 * Quotes for an explicit symbol list, or the backend's own default set when
 * `symbols` is omitted.
 */
export function useQuotes(symbols?: readonly string[]) {
  const key = symbols === undefined ? null : [...symbols].sort()

  return useQuery<Quote[], ApiError>({
    queryKey: marketKeys.quotes(key),
    queryFn: ({ signal }) => fetchQuotes(key ?? undefined, signal),
    staleTime: QUOTE_STALE_MS,
    retry: shouldRetry,
  })
}

/** Daily OHLCV history, oldest-first, for one symbol. */
export function useCandles(symbol: string, days: number) {
  return useQuery<Candle[], ApiError>({
    queryKey: marketKeys.candles(symbol, days),
    queryFn: ({ signal }) => fetchCandles(symbol, days, signal),
    staleTime: CANDLE_STALE_MS,
    gcTime: CANDLE_GC_MS,
    retry: shouldRetry,
  })
}

/** RSI, SMA, EMA and MACD for one symbol. */
export function useTechnicalAnalysis(symbol: string) {
  return useQuery<TechnicalAnalysis, ApiError>({
    queryKey: marketKeys.analysis(symbol),
    queryFn: ({ signal }) => fetchTechnicalAnalysis(symbol, signal),
    staleTime: DERIVED_STALE_MS,
    retry: shouldRetry,
  })
}

/** Just the RSI reading, for when the full analysis would be overkill. */
export function useRsi(symbol: string | null) {
  return useQuery<RsiResult, ApiError>({
    queryKey: marketKeys.rsi(symbol ?? ''),
    queryFn: ({ signal }) => {
      if (symbol === null) {
        // Unreachable: `enabled` keeps the query idle without a symbol.
        throw new ApiError(400, ['A stock symbol is required.'])
      }
      return fetchRsi(symbol, signal)
    },
    enabled: symbol !== null,
    staleTime: DERIVED_STALE_MS,
    retry: shouldRetry,
  })
}

/** The discrete signal for one symbol. */
export function useSignal(symbol: string | null) {
  return useQuery<SignalResult, ApiError>({
    queryKey: marketKeys.signal(symbol ?? ''),
    queryFn: ({ signal }) => {
      if (symbol === null) {
        // Unreachable: `enabled` keeps the query idle without a symbol.
        throw new ApiError(400, ['A stock symbol is required.'])
      }
      return fetchSignal(symbol, signal)
    },
    enabled: symbol !== null,
    staleTime: DERIVED_STALE_MS,
    retry: shouldRetry,
  })
}
