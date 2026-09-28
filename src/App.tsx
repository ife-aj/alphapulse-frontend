import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAnonymous, RequireAuth } from './auth/guards'
import { AppLayout } from './layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MarketsIndexPage, SymbolDetailPage } from './pages/MarketsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PortfolioDetailPage } from './pages/PortfolioDetailPage'
import { PortfoliosPage } from './pages/PortfoliosPage'
import { RegisterPage } from './pages/RegisterPage'
import { WatchlistsPage } from './pages/WatchlistsPage'

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
          {/* The URL carries the selected symbol, so a symbol view is linkable
              and survives a reload. */}
          <Route path="markets" element={<MarketsIndexPage />} />
          <Route path="markets/:symbol" element={<SymbolDetailPage />} />

          <Route path="watchlists" element={<WatchlistsPage />} />
          <Route path="portfolios" element={<PortfoliosPage />} />
          {/* The URL carries the portfolio id, so a portfolio is linkable and
              survives a reload. */}
          <Route path="portfolios/:id" element={<PortfolioDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
