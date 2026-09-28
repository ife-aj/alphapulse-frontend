import type { ReactNode } from 'react'
import { errorMessage, isApiError } from '../api/client'
import styles from './ui/ui.module.css'

type AlertTone = 'error' | 'info' | 'success'

const TONE_CLASS: Record<AlertTone, string> = {
  error: styles.alertError,
  info: styles.alertInfo,
  success: styles.alertSuccess,
}

interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
}

/** An inline message block, announced to assistive technology. */
export function Alert({ tone = 'error', title, children }: AlertProps) {
  return (
    <div
      className={`${styles.alert} ${TONE_CLASS[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {title !== undefined ? (
        <p className={styles.alertTitle}>{title}</p>
      ) : null}
      {children}
    </div>
  )
}

interface ApiErrorAlertProps {
  /** Anything thrown by the API layer; non-`ApiError` values are handled too. */
  error: unknown
  title?: string
}

/**
 * Renders a rejection from the API layer.
 *
 * Every message the backend produced is shown — a validation failure can carry
 * several — and each one is safe to display, because the backend never
 * forwards raw Supabase errors.
 */
export function ApiErrorAlert({
  error,
  title = 'Something went wrong',
}: ApiErrorAlertProps) {
  if (error === null || error === undefined) return null

  const messages = isApiError(error) ? error.messages : [errorMessage(error)]

  return (
    <Alert tone="error" title={title}>
      {messages.length === 1 ? (
        <p>{messages[0]}</p>
      ) : (
        <ul className={styles.alertList}>
          {messages.map((message, index) => (
            <li key={`${index}-${message}`}>{message}</li>
          ))}
        </ul>
      )}
    </Alert>
  )
}
