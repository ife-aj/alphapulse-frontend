import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'
import styles from './ui.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  danger: styles.variantDanger,
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the width of the container. */
  block?: boolean
  /** Show a spinner and block further clicks. */
  loading?: boolean
  children: ReactNode
}

/**
 * The app's button.
 *
 * Defaults to `type="button"` so a button inside a form never submits it by
 * accident; pass `type="submit"` explicitly for submit buttons. While
 * `loading`, the button is disabled and marked `aria-busy`.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  type = 'button',
  disabled = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? styles.block : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : null}
      <span>{children}</span>
    </button>
  )
}
