import { useAuth } from '../auth/AuthContext'
import styles from './AppPages.module.css'

interface OverviewCard {
  id: string
  label: string
  caption: string
}

/**
 * Overview placeholders. Each one is a real metric slot with no data behind it
 * yet, so the value stays an em dash — nothing here is invented.
 */
const OVERVIEW_CARDS: readonly OverviewCard[] = [
  {
    id: 'portfolio-value',
    label: 'Portfolio value',
    caption: 'No portfolios yet',
  },
  { id: 'day-change', label: 'Day change', caption: 'No positions to value' },
  {
    id: 'tracked-symbols',
    label: 'Tracked symbols',
    caption: 'Nothing on a watchlist yet',
  },
  {
    id: 'open-positions',
    label: 'Open positions',
    caption: 'No holdings recorded',
  },
]

function firstNameOf(fullName: string | null): string | null {
  if (fullName === null) return null
  const words = fullName.trim().split(/\s+/)
  const first = words.length > 0 ? words[0] : ''
  return first === '' ? null : first
}

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = firstNameOf(user?.fullName ?? null)

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Welcome back{firstName !== null ? `, ${firstName}` : ''}
        </h1>
        <p className={styles.subtitle}>
          Your markets, watchlists and portfolios will come together here.
        </p>
      </header>

      {user !== null && !user.emailConfirmed ? (
        <p className={styles.notice}>
          Your email address is not confirmed yet. Confirm it to make sure you
          can always sign back in.
        </p>
      ) : null}

      <section className={styles.statGrid} aria-label="Account overview">
        {OVERVIEW_CARDS.map((card) => (
          <article key={card.id} className={styles.card}>
            <h2 className={styles.cardLabel}>{card.label}</h2>
            <p className={styles.cardValue} aria-hidden="true">
              —
            </p>
            <p className={styles.cardCaption}>{card.caption}</p>
          </article>
        ))}
      </section>

      <section className={styles.panelGrid} aria-label="Detail panels">
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Watchlist overview</h2>
            <span className={styles.badge}>Coming soon</span>
          </header>
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nothing to show yet</p>
            <p className={styles.emptyText}>
              Quotes and signals for the symbols you follow will appear here
              once watchlists are available.
            </p>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Portfolio performance</h2>
            <span className={styles.badge}>Coming soon</span>
          </header>
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nothing to show yet</p>
            <p className={styles.emptyText}>
              Valuation over time, allocation and day change will appear here
              once portfolios are available.
            </p>
          </div>
        </article>
      </section>
    </>
  )
}
