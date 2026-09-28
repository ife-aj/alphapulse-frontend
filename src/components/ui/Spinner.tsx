import styles from './ui.module.css'

export type SpinnerSize = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: styles.spinnerSm,
  md: styles.spinnerMd,
  lg: styles.spinnerLg,
}

/**
 * A decorative loading ring.
 *
 * It is hidden from assistive technology on purpose: the surrounding control
 * carries the state (`aria-busy` on a button, `role="status"` on a panel), so
 * announcing the ring itself would only duplicate that.
 */
export function Spinner({ size = 'md' }: { size?: SpinnerSize }) {
  return (
    <span
      className={`${styles.spinner} ${SIZE_CLASS[size]}`}
      aria-hidden="true"
    />
  )
}
