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
