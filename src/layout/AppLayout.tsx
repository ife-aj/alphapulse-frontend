import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { findNavItem } from './navItems'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import styles from './AppLayout.module.css'

/**
 * The shell for every authenticated route: persistent sidebar on desktop, a
 * compact disclosure navigation below 1024px, and a sticky top bar.
 */
export function AppLayout() {
  const { pathname } = useLocation()

  /**
   * The panel is open *for one route*, so following a link — or going back, or
   * any other navigation — closes it during render, with no effect that would
   * set state on every pathname change.
   */
  const [navOpenFor, setNavOpenFor] = useState<string | null>(null)
  const navOpen = navOpenFor === pathname

  // Escape closes the panel, as it would any other disclosure. The state change
  // happens in the key handler, not in the effect body.
  useEffect(() => {
    if (!navOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpenFor(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  const toggleNav = () => {
    setNavOpenFor((current) => (current === pathname ? null : pathname))
  }

  const closeNav = () => {
    setNavOpenFor(null)
  }

  const title = findNavItem(pathname)?.label ?? 'AlphaPulse'

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <Sidebar />

      <div className={styles.column}>
        <TopBar
          title={title}
          navOpen={navOpen}
          onToggleNav={toggleNav}
          onCloseNav={closeNav}
        />

        <main id="main-content" className={styles.content} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
