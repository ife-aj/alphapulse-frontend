/**
 * Wire types for the AlphaPulse API.
 *
 * These mirror the backend DTOs in `alphapulse/src/auth/dto/` exactly. The
 * backend is the source of truth; if a DTO changes there, change it here too.
 */

/** Safe public view of a user (`AuthUserDto`). Never includes tokens or provider internals. */
export interface AuthUser {
  /** Supabase user UUID. */
  id: string
  email: string | null
  /** True once the user has confirmed their email address. */
  emailConfirmed: boolean
  /** From `user_metadata.full_name`; null when never set. */
  fullName: string | null
  /** ISO timestamp, or null. */
  createdAt: string | null
}

/** Session tokens, returned only from register/login — never from GET /auth/me. */
export interface AuthSession {
  /** Bearer token (JWT) for authenticated requests. */
  accessToken: string
  /**
   * Refresh token. Persisted nowhere: the backend exposes no refresh endpoint,
   * so there is nothing this client could do with it.
   */
  refreshToken: string
  /** Epoch **seconds** at which the access token expires. */
  expiresAt: number
}

/** Payload of POST /auth/register and POST /auth/login. */
export interface AuthResult {
  /**
   * The active account. Null when registration requires email confirmation —
   * the body is then identical for new and already-registered addresses.
   */
  user: AuthUser | null
  /** Null when email confirmation is required. */
  session: AuthSession | null
}

/** Payload of GET /auth/me. */
export interface MeResult {
  user: AuthUser
}

/** POST /auth/login body (`AuthCredentialsDto`). */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * POST /auth/register body (`RegisterCredentialsDto`).
 *
 * The backend trims `fullName` before validating its 2–100 character length,
 * so callers may pass untrimmed input.
 */
export interface RegisterPayload {
  email: string
  password: string
  fullName: string
}

/**
 * NestJS error envelope, produced by the built-in exception filters:
 * `{ statusCode, message, error }`.
 *
 * `message` is a string for thrown exceptions and an array of strings when the
 * global ValidationPipe rejects a DTO.
 */
export interface NestErrorBody {
  statusCode?: number
  message?: string | string[]
  error?: string
}

/* ------------------------------------------------------------------ Market */

/**
 * Market wire types, mirroring `alphapulse/src/market/market.types.ts`,
 * `indicators.types.ts`, and `signal.types.ts`.
 *
 * The market routes are public (their controllers declare no guard), so these
 * requests carry no bearer token and a failure here can never invalidate the
 * session.
 */

/** `Quote` — one symbol's latest quote. */
export interface Quote {
  symbol: string
  price: number
  change: number
  changePercent: number
  /** ISO timestamp for the quote. */
  timestamp: string
}

/**
 * `Candle` — one trading day of OHLCV history.
 *
 * `date` is a **calendar date string** (`"2024-01-03"`), not an epoch value, and
 * the backend returns a series **oldest-first**.
 */
export interface Candle {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** `RsiStatus` — derived from the reading: <30 oversold, >70 overbought. */
export type RsiStatus = 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'

/** `RsiResult` — GET /market/indicators/rsi/:symbol */
export interface RsiResult {
  symbol: string
  /** 0..100, rounded to 2 dp. */
  rsi: number
  status: RsiStatus
}

/** The RSI reading nested inside {@link TechnicalAnalysis}. */
export interface RsiSummary {
  /** 0..100, rounded to 2 dp. */
  value: number
  status: RsiStatus
}

/** Latest moving averages. The periods are fixed by the backend. */
export interface MovingAverages {
  sma20: number
  sma50: number
  ema20: number
  ema50: number
}

/** Latest MACD components (12/26/9). */
export interface MacdSummary {
  /** MACD line. */
  value: number
  signal: number
  histogram: number
}

/** `TechnicalAnalysis` — GET /market/indicators/:symbol */
export interface TechnicalAnalysis {
  symbol: string
  rsi: RsiSummary
  movingAverages: MovingAverages
  macd: MacdSummary
}

/**
 * `SignalType` — five values, not three: the buy and sell sides each have a
 * weak variant that the UI must present distinctly.
 */
export type SignalType = 'BUY' | 'WEAK_BUY' | 'HOLD' | 'WEAK_SELL' | 'SELL'

/** `SignalResult` — GET /market/signals/:symbol */
export interface SignalResult {
  symbol: string
  signal: SignalType
  /** -100..+100: the sum of four indicator votes, each worth ±25. */
  score: number
  /** 0..100: how strongly the indicators agree with `signal`. */
  confidence: number
  /** One human-readable explanation per indicator. */
  reasons: string[]
}

