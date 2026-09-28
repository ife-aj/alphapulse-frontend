import type { ApiErrorInfo } from '../api/errorState'
import type { PortfolioValuation } from '../api/types'
import { StateNotice } from '../components/ui/StateNotice'
import {
  decimalDirection,
  formatDecimal,
  formatDecimalPercent,
  formatDecimalSigned,
} from './format'
import type { DecimalDirection } from './format'
import type {
  PortfolioRealtimeState,
  RealtimeStatus,
} from './usePortfolioValuationStream'
import styles from './portfolios.module.css'

const DIRECTION_CLASS: Record<DecimalDirection, string> = {
  up: styles.up,
  down: styles.down,
  flat: styles.flat,
}

const STATUS_LABEL: Record<RealtimeStatus, string> = {
  idle: 'Live off',
  connecting: 'Connecting',
  live: 'Live',
  error: 'Live unavailable',
}

/** The socket's connection state, shown beside the panel title. */
export function RealtimeIndicator({
  realtime,
}: {
  realtime: PortfolioRealtimeState
}) {
  const chipClass =
    realtime.status === 'live'
      ? styles.chipLive
      : realtime.status === 'error'
        ? styles.chipError
        : ''

  return (
    <span className={`${styles.chip} ${chipClass}`} role="status">
      <span className={styles.chipDot} aria-hidden="true" />
      {STATUS_LABEL[realtime.status]}
    </span>
  )
}

interface ValuationPanelProps {
  valuation: PortfolioValuation | undefined
  isPending: boolean
  error: ApiErrorInfo | null
  onRetry: () => void
  realtime: PortfolioRealtimeState
}

/**
 * The portfolio's totals, exactly as the API computed them.
 *
 * Nothing is summed here: the API returns `totalCurrentValue`, `totalInvestedValue`,
 * `totalProfitLoss` and `totalReturnPercentage` together, and a portfolio it cannot
 * value in full comes back as a 422 rather than a partial total. So a
 * `market-unavailable` error shows an explanation, never a figure that silently
 * omits a holding.
 *
 * Realtime state is rendered alongside rather than around the figures, so a dead
 * socket never hides the last REST valuation.
 */
export function ValuationPanel({
  valuation,
  isPending,
  error,
  onRetry,
  realtime,
}: ValuationPanelProps) {
  const gainDirection =
    valuation === undefined
      ? 'flat'
      : decimalDirection(valuation.totalProfitLoss)
  const returnDirection =
    valuation === undefined
      ? 'flat'
      : decimalDirection(valuation.totalReturnPercentage)

  const hasHoldings = valuation !== undefined && valuation.holdings.length > 0

  return (
    <div>
      {realtime.notice !== null ? (
        <p className={styles.realtimeNotice} role="status">
          {realtime.notice.message}
        </p>
      ) : null}

      {isPending ? (
        <StateNotice tone="loading" title="Valuing this portfolio…" />
      ) : null}

      {error !== null ? (
        <StateNotice
          // A portfolio that cannot be valued is not a failure of the page, so
          // it reads as an empty state with the API's own explanation.
          tone={error.kind === 'market-unavailable' ? 'empty' : 'error'}
          title={error.title}
          description={error.description}
          onRetry={error.retryable ? onRetry : undefined}
        />
      ) : null}

      {valuation !== undefined && !hasHoldings ? (
        <StateNotice
          title="Nothing to value yet"
          description="Add a holding and its market value, cost and return will appear here."
        />
      ) : null}

      {hasHoldings ? (
        <div className={styles.totals}>
          <article className={styles.total}>
            <h3 className={styles.totalLabel}>Market value</h3>
            <p className={styles.totalValue}>
              {formatDecimal(valuation.totalCurrentValue)}
            </p>
          </article>

          <article className={styles.total}>
            <h3 className={styles.totalLabel}>Cost basis</h3>
            <p className={styles.totalValue}>
              {formatDecimal(valuation.totalInvestedValue)}
            </p>
          </article>

          <article className={styles.total}>
            <h3 className={styles.totalLabel}>Gain / loss</h3>
            <p
              className={`${styles.totalValue} ${DIRECTION_CLASS[gainDirection]}`}
            >
              {formatDecimalSigned(valuation.totalProfitLoss)}
            </p>
          </article>

          <article className={styles.total}>
            <h3 className={styles.totalLabel}>Return</h3>
            <p
              className={`${styles.totalValue} ${DIRECTION_CLASS[returnDirection]}`}
            >
              {formatDecimalPercent(valuation.totalReturnPercentage)}
            </p>
            <p className={styles.totalHint}>on cost basis</p>
          </article>
        </div>
      ) : null}
    </div>
  )
}
