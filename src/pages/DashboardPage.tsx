import { Link } from 'react-router-dom'
import { describeApiError } from '../api/errorState'
import type { Quote } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { StateNotice } from '../components/ui/StateNotice'
import { Tag } from '../components/ui/Tag'
import { formatDateTime } from '../lib/dates'
import { DIRECTION_VALUE_CLASS } from '../market/direction'
import { describeMarketError } from '../market/errors'
import { directionOf, formatSignedPercent } from '../market/format'
import { useQuotes, useSignal } from '../market/hooks'
import { QuoteCard } from '../market/QuoteCard'
import { SignalPanel } from '../market/SignalPanel'
import { usePortfolios } from '../portfolios/hooks'
import { useWatchlists } from '../watchlists/hooks'
import watchlistStyles from '../watchlists/watchlists.module.css'
import marketStyles from '../market/market.module.css'
import styles from './AppPages.module.css'

/** How many symbols of a watchlist to show before it becomes a wall of tags. */
const TAG_LIMIT = 8

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
 * Every figure is derived from the API — the market counts and strongest mover
 * from `/market/quotes`, and the two summaries from the watchlist and portfolio
 * lists. Nothing is a placeholder, and when a request fails the panel shows an
 * error state rather than a stand-in number.
 *
 * The lists are queried under the same keys their own pages use, so opening the
 * dashboard and then Watchlists or Portfolios costs no extra request.
 */
export function DashboardPage() {
  const { user, accessToken } = useAuth()
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
          A live read on the market, plus what you are tracking.
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
              <p
                className={`${marketStyles.statValue} ${DIRECTION_VALUE_CLASS.flat}`}
              >
                {list.length}
              </p>
              <p className={styles.cardCaption}>
                In the backend's default market set
              </p>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardLabel}>Advancing</h2>
              <p
                className={`${marketStyles.statValue} ${DIRECTION_VALUE_CLASS.up}`}
              >
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

          <WatchlistSummary accessToken={accessToken} />
          <PortfolioSummary accessToken={accessToken} />
        </div>
      ) : null}
    </>
  )
}

/** How many watchlists and which symbols are being tracked. Two reads at most. */
function WatchlistSummary({ accessToken }: { accessToken: string | null }) {
  const watchlists = useWatchlists(accessToken)
  const list = watchlists.data ?? []
  const error =
    watchlists.error !== null ? describeApiError(watchlists.error) : null

  const first = list.length > 0 ? list[0] : null
  const symbols = first?.items ?? []

  return (
    <section className={styles.panel} aria-labelledby="watchlists-heading">
      <header className={styles.panelHeader}>
        <h2 className={styles.panelTitle} id="watchlists-heading">
          Your watchlists
        </h2>
      </header>

      {watchlists.isPending ? (
        <StateNotice tone="loading" title="Loading watchlists…" />
      ) : null}

      {error !== null ? (
        <StateNotice
          tone="error"
          title={error.title}
          description={error.description}
          onRetry={
            error.retryable
              ? () => {
                  void watchlists.refetch()
                }
              : undefined
          }
        />
      ) : null}

      {watchlists.isSuccess && list.length === 0 ? (
        <StateNotice
          title="No watchlists yet"
          description="Create one to start collecting the symbols you follow."
        />
      ) : null}

      {list.length > 0 && first !== null ? (
        <>
          <p className={styles.cardCaption}>
            {list.length === 1 ? '1 watchlist' : `${list.length} watchlists`} ·{' '}
            {first.name} holds{' '}
            {symbols.length === 1 ? '1 symbol' : `${symbols.length} symbols`}
          </p>

          {symbols.length > 0 ? (
            <div className={watchlistStyles.tags}>
              {symbols.slice(0, TAG_LIMIT).map((item) => (
                <Tag key={item.id}>{item.symbol}</Tag>
              ))}
              {symbols.length > TAG_LIMIT ? (
                <span className={styles.cardCaption}>
                  +{symbols.length - TAG_LIMIT} more
                </span>
              ) : null}
            </div>
          ) : null}

          <p className={marketStyles.panelFooterLink}>
            <Link className={styles.link} to="/app/watchlists">
              Open watchlists
            </Link>
          </p>
        </>
      ) : null}
    </section>
  )
}

/** The portfolios on file, linked to their detail views. */
function PortfolioSummary({ accessToken }: { accessToken: string | null }) {
  const portfolios = usePortfolios(accessToken)
  const list = portfolios.data ?? []
  const error =
    portfolios.error !== null ? describeApiError(portfolios.error) : null

  return (
    <section className={styles.panel} aria-labelledby="portfolios-heading">
      <header className={styles.panelHeader}>
        <h2 className={styles.panelTitle} id="portfolios-heading">
          Your portfolios
        </h2>
      </header>

      {portfolios.isPending ? (
        <StateNotice tone="loading" title="Loading portfolios…" />
      ) : null}

      {error !== null ? (
        <StateNotice
          tone="error"
          title={error.title}
          description={error.description}
          onRetry={
            error.retryable
              ? () => {
                  void portfolios.refetch()
                }
              : undefined
          }
        />
      ) : null}

      {portfolios.isSuccess && list.length === 0 ? (
        <StateNotice
          title="No portfolios yet"
          description="Create one to track holdings and see them valued."
        />
      ) : null}

      {list.length > 0 ? (
        <>
          <p className={styles.cardCaption}>
            {list.length === 1 ? '1 portfolio' : `${list.length} portfolios`} ·
            valued on the portfolio's own page
          </p>

          <ul className={styles.summaryLinks}>
            {list.map((portfolio) => (
              <li key={portfolio.id}>
                <Link
                  className={styles.link}
                  to={`/app/portfolios/${encodeURIComponent(portfolio.id)}`}
                >
                  {portfolio.name}
                </Link>{' '}
                <span className={styles.cardCaption}>
                  created {formatDateTime(portfolio.createdAt)}
                </span>
              </li>
            ))}
          </ul>

          <p className={marketStyles.panelFooterLink}>
            <Link className={styles.link} to="/app/portfolios">
              Open portfolios
            </Link>
          </p>
        </>
      ) : null}
    </section>
  )
}
