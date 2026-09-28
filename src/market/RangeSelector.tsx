import styles from './market.module.css'

/**
 * Ranges offered by the backend's `days` parameter, which accepts 1–365.
 *
 * Kept in this module, apart from the chart itself, so that importing the range
 * control does not pull lightweight-charts into the bundle. The chart is loaded
 * on demand; this is not.
 */
const RANGE_OPTIONS: readonly { days: number; label: string }[] = [
  { days: 30, label: '1M' },
  { days: 90, label: '3M' },
  { days: 180, label: '6M' },
  { days: 365, label: '1Y' },
]

export const DEFAULT_RANGE_DAYS = 90

interface RangeSelectorProps {
  value: number
  onChange: (days: number) => void
  disabled?: boolean
}

/** Time-range picker. Every option is inside the API's 1–365 day bounds. */
export function RangeSelector({
  value,
  onChange,
  disabled = false,
}: RangeSelectorProps) {
  return (
    <div className={styles.rangeBar} role="group" aria-label="Chart time range">
      {RANGE_OPTIONS.map((option) => {
        const active = option.days === value
        return (
          <button
            key={option.days}
            type="button"
            className={
              active
                ? `${styles.rangeButton} ${styles.rangeButtonActive}`
                : styles.rangeButton
            }
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.days)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
