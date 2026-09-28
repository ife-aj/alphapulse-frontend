import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCurrentUser, loginRequest, registerRequest } from '../api/auth'
import { ApiError, isApiError, setUnauthorizedHandler } from '../api/client'
import type {
  AuthResult,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
} from '../api/types'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthStatus } from './AuthContext'
import {
  clearStoredSession,
  isSessionExpired,
  readStoredSession,
  writeStoredSession,
} from './session'
import type { StoredSession } from './session'

/** Cache key for the verified profile. The token is not part of it. */
const PROFILE_QUERY_KEY = ['auth', 'me'] as const

/** Read the persisted session once, discarding one that has already expired. */
function loadInitialSession(): StoredSession | null {
  const stored = readStoredSession()
  if (stored === null) return null
  if (isSessionExpired(stored)) {
    clearStoredSession()
    return null
  }
  return stored
}

/**
 * Owns the AlphaPulse session for the whole app.
 *
 * The persisted access token is the source of truth for *whether* someone is
 * signed in; `GET /auth/me` is the source of truth for *who* they are. The
 * profile is cached by React Query so route guards, the shell, and any later
 * page can read it without refetching.
 *
 * Signing out is local only: the backend exposes no logout endpoint, so there
 * is nothing to call — and no server-side revocation to wait for.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<StoredSession | null>(
    loadInitialSession,
  )

  /**
   * Mirror of `session` that is updated synchronously, so a 401 arriving twice
   * cannot clear the cache twice. React Query rebuilds an observed query when
   * its cache entry is removed, so a second `clear()` could refetch with the
   * stale token and 401 again — an endless chain. Clearing at most once per
   * session makes that impossible.
   */
  const sessionRef = useRef(session)

  const accessToken = session?.accessToken ?? null

  /** Drop every trace of the current session, locally. */
  const forgetSession = useCallback(() => {
    const hadSession = sessionRef.current !== null
    sessionRef.current = null
    clearStoredSession()
    setSession(null)
    if (hadSession) {
      queryClient.clear()
    }
  }, [queryClient])

  /** Persist a freshly issued session and seed the profile cache. */
  const rememberSession = useCallback(
    (next: AuthSession, user: AuthUser) => {
      writeStoredSession(next)
      const stored: StoredSession = {
        accessToken: next.accessToken,
        expiresAt: next.expiresAt,
      }
      sessionRef.current = stored
      setSession(stored)
      queryClient.setQueryData<AuthUser>(PROFILE_QUERY_KEY, user)
    },
    [queryClient],
  )

  const profileQuery = useQuery<AuthUser, ApiError>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      if (accessToken === null) {
        // Unreachable: `enabled` keeps the query idle without a token.
        throw new ApiError(401, ['Not signed in.'])
      }
      return fetchCurrentUser(accessToken)
    },
    enabled: accessToken !== null,
    // A rejected token will never succeed on retry; a 5xx might.
    retry: (failureCount, error) =>
      !error.isUnauthorized && error.status >= 500 && failureCount < 2,
    staleTime: 5 * 60 * 1000,
  })

  // A 401 from the profile lookup means the stored token is dead.
  const profileError = profileQuery.error

  // Any authenticated request that comes back 401 — the profile lookup above
  // included, since it carries the bearer token — invalidates the session
  // through this handler. Registering it is the effect's entire job: the state
  // change happens inside the callback, once a response has arrived, never
  // while the effect body runs.
  useEffect(() => {
    setUnauthorizedHandler(forgetSession)
    return () => setUnauthorizedHandler(null)
  }, [forgetSession])

  const loginMutation = useMutation<AuthResult, ApiError, LoginCredentials>({
    mutationFn: async (credentials) => {
      const result = await loginRequest(credentials)
      // The API contract guarantees a session and a user on login; an absent
      // one is a provider-side bug, so surface it instead of stranding the
      // user on a form that looks like it succeeded.
      if (result.session === null || result.user === null) {
        throw new ApiError(500, [
          'Sign in did not return a session. Please try again.',
        ])
      }
      return result
    },
    onSuccess: (result) => {
      if (result.session !== null && result.user !== null) {
        rememberSession(result.session, result.user)
      }
    },
  })

  const registerMutation = useMutation<AuthResult, ApiError, RegisterPayload>({
    mutationFn: registerRequest,
    onSuccess: (result) => {
      // No session means Supabase sent a confirmation email instead of signing
      // the user in. The register page reads `data.session` for that case.
      if (result.session !== null && result.user !== null) {
        rememberSession(result.session, result.user)
      }
    },
  })

  const status: AuthStatus =
    accessToken === null
      ? 'anonymous'
      : profileQuery.data !== undefined
        ? 'authenticated'
        : 'loading'

  const profileFailure =
    profileQuery.data === undefined &&
    profileError !== null &&
    isApiError(profileError) &&
    !profileError.isUnauthorized
      ? profileError
      : null

  const { refetch: refetchProfile } = profileQuery
  const refreshProfile = useCallback(() => {
    void refetchProfile()
  }, [refetchProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      // Never expose a cached profile while signed out.
      user: accessToken === null ? null : (profileQuery.data ?? null),
      accessToken,
      login: loginMutation,
      register: registerMutation,
      profileError: profileFailure,
      refreshProfile,
      logout: forgetSession,
    }),
    [
      status,
      accessToken,
      profileQuery.data,
      loginMutation,
      registerMutation,
      profileFailure,
      refreshProfile,
      forgetSession,
    ],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
