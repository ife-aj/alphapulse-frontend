import { createContext, useContext } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { ApiError } from '../api/client'
import type {
  AuthResult,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
} from '../api/types'

/**
 * - `loading`       — a persisted token exists and is being verified.
 * - `authenticated` — the token was accepted and the profile is available.
 * - `anonymous`     — no usable session.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  /** The verified account, or null unless `status` is `authenticated`. */
  user: AuthUser | null
  /**
   * Sign in. Resolves with a session — the mutation rejects rather than
   * resolving without one.
   */
  login: UseMutationResult<AuthResult, ApiError, LoginCredentials>
  /**
   * Create an account. `data.session` is null when the backend requires email
   * confirmation; `data.user` is null in that same case.
   */
  register: UseMutationResult<AuthResult, ApiError, RegisterPayload>
  /**
   * Set only when the persisted token was *not* rejected (i.e. not a 401) but
   * the profile could not be loaded — a backend outage, say. The session is
   * kept so a retry can succeed.
   */
  profileError: ApiError | null
  /** Retry the profile lookup after a `profileError`. */
  refreshProfile: () => void
  /** Clear the local session. The backend has no logout endpoint to call. */
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>.')
  }
  return context
}
