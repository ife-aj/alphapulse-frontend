import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './ui.module.css'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Field-level error. Also sets `aria-invalid` and the invalid styling. */
  error?: string
  /** Helper text shown below the input while there is no error. */
  hint?: ReactNode
  /** Rendered inside the input's right edge, e.g. a visibility toggle. */
  trailing?: ReactNode
}

/**
 * A labelled text input with hint and error slots.
 *
 * The hint is hidden whenever an error is shown, so `aria-describedby` only
 * ever points at elements that are actually in the DOM.
 */
export function TextField({
  label,
  error,
  hint,
  trailing,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const showHint = hint !== undefined && error === undefined
  const describedBy =
    [showHint ? hintId : null, error !== undefined ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined

  const inputClasses = [
    styles.input,
    error !== undefined ? styles.inputInvalid : '',
    trailing !== undefined ? styles.inputWithTrailing : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          className={inputClasses}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {trailing !== undefined ? (
          <div className={styles.trailing}>{trailing}</div>
        ) : null}
      </div>
      {showHint ? (
        <p className={styles.fieldHint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error !== undefined ? (
        <p className={styles.fieldError} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
