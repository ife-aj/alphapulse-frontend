import type { RsiStatus, TechnicalAnalysis } from '../api/types'
import { formatIndicator } from './format'
import styles from './market.module.css'

const RSI_PILL: Record<RsiStatus, string> = {
  OVERSOLD: styles.pillOversold,
  NEUTRAL: styles.pillNeutral,
  OVERBOUGHT: styles.pillOverbought,
}

const RSI_LABEL: Record<RsiStatus, string> = {
  OVERSOLD: 'Oversold',
  NEUTRAL: 'Neutral',
  OVERBOUGHT: 'Overbought',
}

/**
 * The indicator readings from `GET /market/indicators/:symbol`.
 *
 * The periods are the backend's own and are not configurable — SMA and EMA are
 * 20 and 50 days, MACD is 12/26/9. RSI's period is not stated anywhere in the
 * API, so the card names the indicator without asserting one.
 *
 * Each figure is a description of past prices. Nothing here forecasts, and the
 * panel says so.
 */
export function IndicatorPanel({ analysis }: { analysis: TechnicalAnalysis }) {
  const { rsi, movingAverages, macd } = analysis

  return (
    <div className={styles.stack}>
      <div className={styles.indicatorGrid}>
        <article className={styles.indicatorCard}>
          <h3 className={styles.indicatorLabel}>RSI</h3>
          <p className={styles.indicatorValue}>{formatIndicator(rsi.value)}</p>
          <span className={`${styles.pill} ${RSI_PILL[rsi.status]}`}>
            {RSI_LABEL[rsi.status]}
          </span>
          <p className={styles.indicatorHint}>
            Momentum on a 0–100 scale. Readings above 70 are conventionally
            described as overbought and below 30 as oversold.
          </p>
        </article>

        <article className={styles.indicatorCard}>
          <h3 className={styles.indicatorLabel}>SMA 20</h3>
          <p className={styles.indicatorValue}>
            {formatIndicator(movingAverages.sma20)}
          </p>
          <p className={styles.indicatorHint}>
            Mean closing price over the last 20 trading days.
          </p>
        </article>

        <article className={styles.indicatorCard}>
          <h3 className={styles.indicatorLabel}>SMA 50</h3>
          <p className={styles.indicatorValue}>
            {formatIndicator(movingAverages.sma50)}
          </p>
          <p className={styles.indicatorHint}>
            Mean closing price over the last 50 trading days — slower to react
            than the 20-day average.
          </p>
        </article>

        <article className={styles.indicatorCard}>
          <h3 className={styles.indicatorLabel}>EMA 20</h3>
          <p className={styles.indicatorValue}>
            {formatIndicator(movingAverages.ema20)}
          </p>
          <p className={styles.indicatorHint}>
            Like the 20-day average, but recent days carry more weight.
          </p>
        </article>

        <article className={styles.indicatorCard}>
          <h3 className={styles.indicatorLabel}>EMA 50</h3>
          <p className={styles.indicatorValue}>
            {formatIndicator(movingAverages.ema50)}
          </p>
          <p className={styles.indicatorHint}>
            The 50-day exponential average.
          </p>
        </article>

        <article className={styles.indicatorCard}>
          <h3 className={styles.indicatorLabel}>MACD 12/26/9</h3>
          <div className={styles.indicatorRows}>
            <span>
              <span>MACD</span>
              <b>{formatIndicator(macd.value)}</b>
            </span>
            <span>
              <span>Signal</span>
              <b>{formatIndicator(macd.signal)}</b>
            </span>
            <span>
              <span>Histogram</span>
              <b>{formatIndicator(macd.histogram)}</b>
            </span>
          </div>
          <p className={styles.indicatorHint}>
            The gap between the 12- and 26-day exponential averages, its 9-day
            signal line, and the histogram between the two.
          </p>
        </article>
      </div>

      <p className={styles.disclaimer}>
        These are calculated summaries of past prices, not recommendations. They
        describe what has already happened and cannot predict what happens next.
      </p>
    </div>
  )
}
