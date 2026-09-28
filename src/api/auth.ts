import { apiRequest } from './client'
import type {
  AuthResult,
  AuthUser,
  LoginCredentials,
  MeResult,
  RegisterPayload,
} from './types'

/**
 * Auth endpoints, matching `alphapulse/src/auth/auth.controller.ts`:
 *
 * - `POST /auth/register` → 201 `{ user, session }`, or `{ user: null, session:
 *   null }` when Supabase requires email confirmation (that body is identical
 *   for new and already-registered addresses, by design). 409 only when
 *   Supabase explicitly reports the email as taken. 400 on a bad payload.
 * - `POST /auth/login`    → 200 `{ user, session }`, both always present.
 *   401 on bad credentials, 403 when the email is unconfirmed.
 * - `GET  /auth/me`       → 200 `{ user }`. Requires `Authorization: Bearer`.
 *   401 on a missing/malformed header or an invalid/expired token.
 *
 * There is deliberately no `logout` call: the backend exposes no logout route
 * and no token-revocation endpoint, so signing out is purely local (see
 * `src/auth/AuthProvider.tsx`).
 */

export function loginRequest(
  credentials: LoginCredentials,
): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function registerRequest(payload: RegisterPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

/** Verify the stored access token and return the account it belongs to. */
export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const result = await apiRequest<MeResult>('/auth/me', { accessToken })
  return result.user
}
