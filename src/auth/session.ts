import type { AuthSession } from '../api/types'

/**
 * The only session state this client persists.
 *
 * `refreshToken` is deliberately absent: the backend exposes no refresh
 * endpoint, so storing it would be persisting a credential nothing can use.
 * `expiresAt` is kept so an already-dead token can be discarded at startup
 * instead of triggering a guaranteed-401 round trip to `GET /auth/me`.
 */
export interface StoredSession {
  accessToken: string
  /** Epoch **seconds**, exactly as the API reports `session.expiresAt`. */
  expiresAt: number
}

const STORAGE_KEY = 'alphapulse.session'

/**
 * Web storage can throw or be unavailable (private mode, blocked cookies,
 * disabled storage), so every access is guarded. A missing session simply
 * means "signed out", which is always a safe state.
 */
function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { accessToken?: unknown; expiresAt?: unknown }
  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken !== '' &&
    typeof candidate.expiresAt === 'number' &&
    Number.isFinite(candidate.expiresAt)
  )
}

/** Read the persisted session, or null when absent, unreadable, or malformed. */
export function readStoredSession(): StoredSession | null {
  const store = storage()
  if (store === null) return null
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoredSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Persist the access token and its expiry, and nothing else. */
export function writeStoredSession(session: AuthSession): void {
  const store = storage()
  if (store === null) return
  const payload: StoredSession = {
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Out of quota or storage disabled: the in-memory session still works for
    // this tab, the user just has to sign in again after a reload.
  }
}

export function clearStoredSession(): void {
  const store = storage()
  if (store === null) return
  try {
    store.removeItem(STORAGE_KEY)
  } catch {
    // Nothing useful to do; the in-memory session is cleared regardless.
  }
}

/** True when the access token's expiry has already passed. */
export function isSessionExpired(
  session: StoredSession,
  nowSeconds: number = Date.now() / 1000,
): boolean {
  return session.expiresAt <= nowSeconds
}
