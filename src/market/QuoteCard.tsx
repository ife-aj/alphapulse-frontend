import { Link } from 'react-router-dom'
import type { Quote } from '../api/types'
import { DIRECTION_TEXT_CLASS } from './direction'
import {
  directionOf,
  formatPrice,
  formatSigned,
  formatSignedPercent,
  formatTimestamp,
} from './format'
import { symbolPath } from './symbols'
import styles from './market.module.css'

/** A compact quote tile, linking through to the symbol's detail view. */
export function QuoteCard({ quote }: { quote: Quote }) {
  const direction = directionOf(quote.change)

  return (
    <Link className={styles.quoteCard} to={symbolPath(quote.symbol)}>
      <span className={styles.quoteSymbol}>{quote.symbol}</span>
      <span className={styles.quotePrice}>{formatPrice(quote.price)}</span>
      <span className={`${styles.quoteChange} ${DIRECTION_TEXT_CLASS[direction]}`}>
        {formatSigned(quote.change)} ({formatSignedPercent(quote.changePercent)})
      </span>
      <span className={styles.quoteTime}>
        {formatTimestamp(quote.timestamp)}
      </span>
    </Link>
  )
}

/**
 * The headline quote for a symbol's detail view.
 *
 * Only the fields the quote response actually carries are shown — price, change,
 * percentage change and timestamp. The API supplies no open, high, low or
 * previous close, so none are displayed rather than being filled with a
 * placeholder that would read as real data.
 */
export function QuoteSummary({ quote }: { quote: Quote }) {
  const direction = directionOf(quote.change)

  return (
    <div className={styles.summary}>
      <div className={styles.summaryTop}>
        <h2 className={styles.summarySymbol}>{quote.symbol}</h2>
        <span className={`${styles.summaryChange} ${DIRECTION_TEXT_CLASS[direction]}`}>
          {formatSignedPercent(quote.changePercent)}
        </span>
      </div>

      <p className={styles.summaryPrice}>{formatPrice(quote.price)}</p>

      <dl className={styles.summaryMeta}>
        <div>
          <dt className={styles.metaLabel}>Change</dt>
          <dd className={`${styles.metaValue} ${DIRECTION_TEXT_CLASS[direction]}`}>
            {formatSigned(quote.change)}
          </dd>
        </div>
        <div>
          <dt className={styles.metaLabel}>Quoted</dt>
          <dd className={styles.metaValue}>
            {formatTimestamp(quote.timestamp)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
