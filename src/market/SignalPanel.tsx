import type { SignalResult, SignalType } from '../api/types'
import { formatIndicator } from './format'
import styles from './market.module.css'

/**
 * The five verdicts the API can return. The buy and sell sides each have a weak
 * variant, and they are styled differently on purpose: a weak signal is weaker
 * evidence, not a smaller gain.
 */
const SIGNAL_LABEL: Record<SignalType, string> = {
  BUY: 'Buy',
  WEAK_BUY: 'Weak buy',
  HOLD: 'Hold',
  WEAK_SELL: 'Weak sell',
  SELL: 'Sell',
}

const SIGNAL_CLASS: Record<SignalType, string> = {
  BUY: styles.signalBuy,
  WEAK_BUY: styles.signalWeakBuy,
  HOLD: styles.signalHold,
  WEAK_SELL: styles.signalWeakSell,
  SELL: styles.signalSell,
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/**
 * The signal from `GET /market/signals/:symbol`.
 *
 * `score` is the sum of four indicator votes, each worth ±25, so it runs from
 * -100 to +100; `confidence` is 0–100 and measures how strongly those indicators
 * agree. Both are shown with their range so the numbers are readable without
 * prior knowledge, and the panel states plainly that the verdict is not advice.
 */
export function SignalPanel({ result }: { result: SignalResult }) {
  const confidence = clampPercent(result.confidence)

  return (
    <div>
      <div className={styles.signalHead}>
        <span
          className={`${styles.signalBadge} ${SIGNAL_CLASS[result.signal]}`}
          data-signal={result.signal}
        >
          {SIGNAL_LABEL[result.signal]}
        </span>
        <span className={styles.signalSymbol}>{result.symbol}</span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Score</span>
          <span className={styles.metricValue}>
            {formatIndicator(result.score)}
          </span>
          <span className={styles.metricHint}>
            Sum of four indicator votes, each worth ±25. The scale runs from −100
            to +100.
          </span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Confidence</span>
          <span className={styles.metricValue}>
            {formatIndicator(confidence)}%
          </span>
          <span
            className={styles.confidenceTrack}
            role="img"
            aria-label={`Confidence ${formatIndicator(confidence)} out of 100`}
          >
            <span
              className={styles.confidenceFill}
              style={{ width: `${confidence}%` }}
            />
          </span>
          <span className={styles.metricHint}>
            How strongly the indicators agree with this verdict, from 0 to 100.
          </span>
        </div>
      </div>

      {result.reasons.length > 0 ? (
        <ul className={styles.reasons}>
          {result.reasons.map((reason, index) => (
            <li className={styles.reasonItem} key={`${index}-${reason}`}>
              {reason}
            </li>
          ))}
        </ul>
      ) : null}

      <p className={styles.disclaimer}>
        This verdict is generated automatically from historical price indicators.
        It is not financial advice, it does not account for your circumstances,
        and it does not predict future prices. Use it as one input among many, or
        not at all.
      </p>
    </div>
  )
}
