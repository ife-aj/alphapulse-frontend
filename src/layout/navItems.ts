import type { ComponentType, SVGProps } from 'react'
import {
  DashboardIcon,
  MarketsIcon,
  PortfoliosIcon,
  WatchlistsIcon,
} from '../components/icons'

export interface NavItem {
  to: string
  label: string
  /** Shown as a tooltip, and as the placeholder copy on not-yet-built pages. */
  description: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Match the path exactly — the dashboard is the `/app` index route. */
  end?: boolean
}

/**
 * The workspace navigation.
 *
 * Every destination is routable in this batch; Markets, Watchlists and
 * Portfolios render placeholder pages until their own batches land.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    to: '/app',
    label: 'Dashboard',
    description: 'Overview of everything you track',
    Icon: DashboardIcon,
    end: true,
  },
  {
    to: '/app/markets',
    label: 'Markets',
    description: 'Quotes, candles and indicators',
    Icon: MarketsIcon,
  },
  {
    to: '/app/watchlists',
    label: 'Watchlists',
    description: 'Symbols you follow',
    Icon: WatchlistsIcon,
  },
  {
    to: '/app/portfolios',
    label: 'Portfolios',
    description: 'Holdings and live valuation',
    Icon: PortfoliosIcon,
  },
]

/** The nav item a pathname belongs to, preferring the most specific match. */
export function findNavItem(pathname: string): NavItem | undefined {
  const matches = NAV_ITEMS.filter((item) =>
    item.end === true
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`),
  )

  return matches.sort((a, b) => b.to.length - a.to.length)[0]
}
