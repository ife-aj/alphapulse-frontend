import styles from './Brand.module.css'

/** The AlphaPulse mark: a pulse trace inside a rounded tile. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className={styles.mark}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="AlphaPulse"
    >
      <rect width="32" height="32" rx="9" />
      <path d="M5.2 17.4h4.4l2.7-6.8 3.4 11.4 2.9-7.6 1.7 3h6.5" />
    </svg>
  )
}

interface BrandProps {
  size?: 'md' | 'lg'
  subtitle?: string
}

/** Mark plus wordmark, used in the auth header, the sidebar, and the top bar. */
export function Brand({ size = 'md', subtitle }: BrandProps) {
  return (
    <span className={styles.brand}>
      <BrandMark size={size === 'lg' ? 38 : 30} />
      <span className={styles.text}>
        <span
          className={`${styles.wordmark} ${size === 'lg' ? styles.wordmarkLg : ''}`}
        >
          Alpha<span className={styles.wordmarkAccent}>Pulse</span>
        </span>
        {subtitle !== undefined ? (
          <span className={styles.subtitle}>{subtitle}</span>
        ) : null}
      </span>
    </span>
  )
}
