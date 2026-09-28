import { useMemo } from 'react'
import type { Holding, HoldingValuation, PortfolioValuation } from '../api/types'
import { Button } from '../components/ui/Button'
import {
  decimalDirection,
  formatDecimal,
  formatDecimalPercent,
  formatDecimalSigned,
} from './format'
import type { DecimalDirection } from './format'
import styles from './portfolios.module.css'

const DIRECTION_CLASS: Record<DecimalDirection, string> = {
  up: styles.up,
  down: styles.down,
  flat: styles.flat,
}

interface HoldingsTableProps {
  holdings: Holding[]
  /** Undefined while the valuation is loading or when it could not be produced. */
  valuation: PortfolioValuation | undefined
  busy: boolean
  onEdit: (holding: Holding) => void
  onRemove: (holding: Holding) => void
}

/**
 * The portfolio's holdings, with a valuation line per holding when one exists.
 *
 * Quantity and average price come from the holding itself, so they are always
 * shown. Current price, market value and gain/loss come from the valuation and
 * render as an em dash when it is unavailable — a price is never estimated, and
 * a total that omitted a holding is never shown as if it were complete.
 */
export function HoldingsTable({
  holdings,
  valuation,
  busy,
  onEdit,
  onRemove,
}: HoldingsTableProps) {
  const bySymbol = useMemo(() => {
    const map = new Map<string, HoldingValuation>()
    for (const line of valuation?.holdings ?? []) {
      map.set(line.symbol, line)
    }
    return map
  }, [valuation])

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="sr-only">
          Holdings with their quantity, cost and current valuation
        </caption>
        <thead>
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col" className={styles.numeric}>
              Quantity
            </th>
            <th scope="col" className={styles.numeric}>
              Avg price
            </th>
            <th scope="col" className={styles.numeric}>
              Current price
            </th>
            <th scope="col" className={styles.numeric}>
              Market value
            </th>
            <th scope="col" className={styles.numeric}>
              Gain / loss
            </th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const line = bySymbol.get(holding.symbol)
            const direction =
              line === undefined
                ? 'flat'
                : decimalDirection(line.profitLoss)

            return (
              <tr key={holding.id}>
                <th scope="row" className={styles.symbol}>
                  {holding.symbol}
                </th>
                <td className={styles.numeric}>
                  {formatDecimal(holding.quantity)}
                </td>
                <td className={styles.numeric}>
                  {formatDecimal(holding.averagePurchasePrice)}
                </td>
                <td className={styles.numeric}>
                  {line === undefined ? (
                    <span className={styles.muted}>—</span>
                  ) : (
                    formatDecimal(line.currentPrice)
                  )}
                </td>
                <td className={styles.numeric}>
                  {line === undefined ? (
                    <span className={styles.muted}>—</span>
                  ) : (
                    formatDecimal(line.currentValue)
                  )}
                </td>
                <td className={`${styles.numeric} ${DIRECTION_CLASS[direction]}`}>
                  {line === undefined ? (
                    <span className={styles.muted}>—</span>
                  ) : (
                    <>
                      {formatDecimalSigned(line.profitLoss)}
                      <br />
                      <span className={styles.muted}>
                        {formatDecimalPercent(line.returnPercentage)}
                      </span>
                    </>
                  )}
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(holding)}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(holding)}
                      disabled={busy}
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
