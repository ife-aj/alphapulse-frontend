import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAnonymous, RequireAuth } from './auth/guards'
import { AppLayout } from './layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { RegisterPage } from './pages/RegisterPage'

/**
 * Route table.
 *
 * `/login` and `/register` are public-only (a signed-in user is sent on to the
 * dashboard); everything under `/app` requires a verified session and renders
 * inside the shared shell.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<RequireAnonymous />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="markets"
            element={
              <PlaceholderPage
                title="Markets"
                description="Quotes, candles and indicators for the symbols you care about."
              />
            }
          />
          <Route
            path="watchlists"
            element={
              <PlaceholderPage
                title="Watchlists"
                description="Collections of symbols you follow, with live pricing."
              />
            }
          />
          <Route
            path="portfolios"
            element={
              <PlaceholderPage
                title="Portfolios"
                description="Holdings, cost basis and live valuation."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
