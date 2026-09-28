import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { redirectTarget } from './redirect'
import { Button } from '../components/ui/Button'
import { FullPageSpinner, FullPageState } from '../components/FullPageState'

/**
 * Gate for everything under `/app`.
 *
 * While the stored token is being verified the guarded content is never
 * rendered, so a signed-out visitor cannot see a flash of the dashboard.
 */
export function RequireAuth() {
  const { status, profileError, refreshProfile, logout } = useAuth()
  const location = useLocation()

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (status === 'loading') {
    if (profileError !== null) {
      return (
        <FullPageState
          tone="error"
          title="Can't reach AlphaPulse"
          description={`${profileError.message} Your session is still saved — retry, or sign out and start again.`}
          actions={
            <>
              <Button onClick={refreshProfile}>Try again</Button>
              <Button variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </>
          }
        />
      )
    }
    return <FullPageSpinner label="Restoring your session…" />
  }

  return <Outlet />
}

/**
 * Gate for `/login` and `/register`.
 *
 * A signed-in user is sent on to the dashboard — or back to whatever protected
 * route bounced them here — instead of being shown a sign-in form.
 */
export function RequireAnonymous() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageSpinner label="Checking your session…" />
  }

  if (status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />
  }

  return <Outlet />
}
