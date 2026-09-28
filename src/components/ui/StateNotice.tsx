import type { ReactNode } from 'react'
import { Button } from './Button'
import { Spinner } from './Spinner'
import styles from './ui.module.css'

export type StateTone = 'loading' | 'error' | 'empty'

interface StateNoticeProps {
  tone?: StateTone
  title: string
  description?: string
  /** Shown as a button only for `error`, where a retry can help. */
  onRetry?: () => void
  retryLabel?: string
  children?: ReactNode
}

/**
 * The inline state block used inside panels and cards.
 *
 * Loading and empty announce politely (`role="status"`); an error interrupts
 * (`role="alert"`), because it is the state a user must act on.
 */
export function StateNotice({
  tone = 'empty',
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  children,
}: StateNoticeProps) {
  const toneClass =
    tone === 'error'
      ? styles.stateError
      : tone === 'loading'
        ? styles.stateLoading
        : ''

  return (
    <div
      className={`${styles.state} ${toneClass}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {tone === 'loading' ? <Spinner size="md" /> : null}
      <p className={styles.stateTitle}>{title}</p>
      {description !== undefined ? (
        <p className={styles.stateText}>{description}</p>
      ) : null}
      {children}
      {tone === 'error' && onRetry !== undefined ? (
        <div className={styles.stateActions}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
