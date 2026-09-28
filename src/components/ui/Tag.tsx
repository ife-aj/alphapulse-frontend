import type { ReactNode } from 'react'
import { CloseIcon } from '../icons'
import styles from './ui.module.css'

interface TagProps {
  children: ReactNode
  /** When given, renders a remove button inside the tag. */
  onRemove?: () => void
  /** Accessible name for the remove button, e.g. `Remove AAPL from Tech`. */
  removeLabel?: string
  disabled?: boolean
}

/** A compact removable label, used for the symbols in a watchlist. */
export function Tag({
  children,
  onRemove,
  removeLabel,
  disabled = false,
}: TagProps) {
  const label = removeLabel ?? 'Remove'

  return (
    <span className={styles.tag}>
      <span className={styles.tagLabel}>{children}</span>
      {onRemove !== undefined ? (
        <button
          type="button"
          className={styles.tagRemove}
          onClick={onRemove}
          disabled={disabled}
          aria-label={label}
          title={label}
        >
          <CloseIcon width={13} height={13} />
        </button>
      ) : null}
    </span>
  )
}
