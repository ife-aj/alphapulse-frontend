import { Link } from 'react-router-dom'
import type { Quote } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { StateNotice } from '../components/ui/StateNotice'
import { DIRECTION_VALUE_CLASS } from '../market/direction'
import { describeMarketError } from '../market/errors'
import {
  directionOf,
  formatSignedPercent,
} from '../market/format'
import { useQuotes, useSignal } from '../market/hooks'
import { QuoteCard } from '../market/QuoteCard'
import { SignalPanel } from '../market/SignalPanel'
import marketStyles from '../market/market.module.css'
import styles from './AppPages.module.css'

function firstNameOf(fullName: string | null): string | null {
  if (fullName === null) return null
  const words = fullName.trim().split(/\s+/)
  const first = words.length > 0 ? words[0] : ''
  return first === '' ? null : first
}

/** The quote that gained the most, or null when there are none. */
function strongestOf(quotes: readonly Quote[]): Quote | null {
  return quotes.reduce<Quote | null>(
    (best, quote) =>
      best === null || quote.changePercent > best.changePercent ? quote : best,
    null,
  )
}

/**
 * The overview.
 *
 * Every figure is derived from the backend's own `/market/quotes` response for
 * its default symbol set — the counts, the strongest mover and the signal below.
 * Nothing is a placeholder, and when the provider fails the cards show an error
 * state rather than a stand-in number.
 *
 * The quotes query is the same one the markets index makes, under the same key,
 * so moving between the two pages reuses a single cached response.
 */
export function DashboardPage() {
  const { user } = useAuth()
  const firstName = firstNameOf(user?.fullName ?? null)

  const quotes = useQuotes()
  const list = quotes.data ?? []
  const featured = list.length > 0 ? list[0].symbol : null
  const signal = useSignal(featured)

  const quoteError =
    quotes.error !== null ? describeMarketError(quotes.error) : null
  const signalError =
    signal.error !== null ? describeMarketError(signal.error) : null

  const advancing = list.filter((q) => directionOf(q.change) === 'up').length
  const declining = list.filter((q) => directionOf(q.change) === 'down').length
  const strongest = strongestOf(list)

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Welcome back{firstName !== null ? `, ${firstName}` : ''}
        </h1>
        <p className={styles.subtitle}>
          A live read on the market the backend tracks by default.
        </p>
      </header>

      {user !== null && !user.emailConfirmed ? (
        <p className={styles.notice}>
          Your email address is not confirmed yet. Confirm it to make sure you
          can always sign back in.
        </p>
      ) : null}

      <section aria-label="Market overview">
        {quotes.isPending ? (
          <StateNotice tone="loading" title="Loading market overview…" />
        ) : null}

        {quoteError !== null ? (
          <StateNotice
            tone="error"
            title={quoteError.title}
            description={quoteError.description}
            onRetry={
              quoteError.retryable
                ? () => {
                    void quotes.refetch()
                  }
                : undefined
            }
          />
        ) : null}

        {quotes.isSuccess && list.length === 0 ? (
          <StateNotice
            title="No quotes available"
            description="The market data provider returned no quotes for its default symbols."
          />
        ) : null}

        {list.length > 0 ? (
          <div className={styles.statGrid}>
            <article className={styles.card}>
              <h2 className={styles.cardLabel}>Symbols tracked</h2>
              <p className={`${marketStyles.statValue} ${DIRECTION_VALUE_CLASS.flat}`}>
                {list.length}
              </p>
              <p className={styles.cardCaption}>
                In the backend's default market set
              </p>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardLabel}>Advancing</h2>
              <p className={`${marketStyles.statValue} ${DIRECTION_VALUE_CLASS.up}`}>
                {advancing}
              </p>
              <p className={styles.cardCaption}>Up on the day</p>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardLabel}>Declining</h2>
              <p
                className={`${marketStyles.statValue} ${DIRECTION_VALUE_CLASS.down}`}
              >
                {declining}
              </p>
              <p className={styles.cardCaption}>Down on the day</p>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardLabel}>Strongest</h2>
              <p
                className={`${marketStyles.statValue} ${
                  strongest === null
                    ? DIRECTION_VALUE_CLASS.flat
                    : DIRECTION_VALUE_CLASS[directionOf(strongest.changePercent)]
                }`}
              >
                {strongest === null
                  ? '—'
                  : formatSignedPercent(strongest.changePercent)}
              </p>
              <p className={styles.cardCaption}>
                {strongest === null ? 'No quotes' : strongest.symbol}
              </p>
            </article>
          </div>
        ) : null}
      </section>

      {list.length > 0 ? (
        <div className={marketStyles.split}>
          <section className={styles.panel} aria-labelledby="snapshot-heading">
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle} id="snapshot-heading">
                Market snapshot
              </h2>
            </header>

            <div className={marketStyles.quoteGrid}>
              {list.map((quote) => (
                <QuoteCard key={quote.symbol} quote={quote} />
              ))}
            </div>

            <p className={marketStyles.panelFooterLink}>
              <Link className={styles.link} to="/app/markets">
                Open Markets for charts, indicators and signals
              </Link>
            </p>
          </section>

          {featured !== null ? (
            <section className={styles.panel} aria-labelledby="signal-heading">
              <header className={styles.panelHeader}>
                <h2 className={styles.panelTitle} id="signal-heading">
                  Signal · {featured}
                </h2>
              </header>

              {signal.isPending ? (
                <StateNotice tone="loading" title="Loading signal…" />
              ) : null}

              {signalError !== null ? (
                <StateNotice
                  tone="error"
                  title={signalError.title}
                  description={signalError.description}
                  onRetry={
                    signalError.retryable
                      ? () => {
                          void signal.refetch()
                        }
                      : undefined
                  }
                />
              ) : null}

              {signal.data !== undefined ? (
                <SignalPanel result={signal.data} />
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
