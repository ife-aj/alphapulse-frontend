import styles from './AppPages.module.css'

interface PlaceholderPageProps {
  title: string
  description: string
}

/**
 * Stand-in for a workspace section that has a route and a nav entry but no
 * features yet. Each one is replaced by its own page in a later batch.
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{description}</p>
      </header>

      <article className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{title}</h2>
          <span className={styles.badge}>Coming soon</span>
        </header>
        <div className={`${styles.empty} ${styles.emptyTall}`}>
          <p className={styles.emptyTitle}>Not built yet</p>
          <p className={styles.emptyText}>
            This section is reserved and wired into the navigation. Its data and
            controls arrive in a later release.
          </p>
        </div>
      </article>
    </>
  )
}
