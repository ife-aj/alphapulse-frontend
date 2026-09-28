/** Router state set by `RequireAuth` when it bounces a visitor to `/login`. */
export interface RedirectState {
  from?: { pathname: string; search: string; hash: string }
}

/**
 * Where to send someone after a successful sign-in: back to the protected route
 * that bounced them, or the dashboard. The auth routes themselves are excluded
 * so a stale redirect can never loop.
 */
export function redirectTarget(state: unknown): string {
  const from = (state as RedirectState | null)?.from
  if (
    from === undefined ||
    from.pathname === '' ||
    from.pathname === '/login' ||
    from.pathname === '/register'
  ) {
    return '/app'
  }
  return `${from.pathname}${from.search}${from.hash}`
}
