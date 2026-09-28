import type { ReactNode } from 'react'
import { Spinner } from './ui/Spinner'
import styles from './FullPageState.module.css'

interface FullPageStateProps {
  title: string
  description: string
  tone?: 'neutral' | 'error'
  actions?: ReactNode
}

/** Centred, full-viewport panel for states that replace the whole screen. */
export function FullPageState({
  title,
  description,
  tone = 'neutral',
  actions,
}: FullPageStateProps) {
  return (
    <div className={styles.shell}>
      <div
        className={`${styles.panel} ${tone === 'error' ? styles.panelError : ''}`}
        role={tone === 'error' ? 'alert' : undefined}
      >
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  )
}

/** Full-viewport loading state, used while the session is resolved. */
export function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className={styles.shell}>
      <div className={styles.spinnerWrap} role="status">
        <Spinner size="lg" />
        <p className={styles.spinnerLabel}>{label}</p>
      </div>
    </div>
  )
}
