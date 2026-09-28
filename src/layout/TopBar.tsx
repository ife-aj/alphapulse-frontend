import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { CloseIcon, LogoutIcon, MenuIcon } from '../components/icons'
import { NavLinks } from './NavLinks'
import { UserSummary } from './UserSummary'
import styles from './TopBar.module.css'

const NAV_PANEL_ID = 'app-navigation'

interface TopBarProps {
  /** Nav item label for the current route. */
  title: string
  navOpen: boolean
  onToggleNav: () => void
  onCloseNav: () => void
}

/**
 * The app header.
 *
 * On desktop it shows the current section; below 1024px it shows the brand and
 * a disclosure button that reveals {@link MobileNav} directly beneath it.
 */
export function TopBar({
  title,
  navOpen,
  onToggleNav,
  onCloseNav,
}: TopBarProps) {
  const toggleLabel = navOpen ? 'Close navigation' : 'Open navigation'

  return (
    <div className={styles.topArea}>
      <header className={styles.topBar}>
        <div className={styles.mobileOnly}>
          <Brand />
        </div>

        <span className={styles.pageTitle}>{title}</span>

        <div className={styles.spacer} />

        <div className={styles.mobileOnly}>
          <Button
            variant="ghost"
            className={styles.iconButton}
            onClick={onToggleNav}
            aria-expanded={navOpen}
            // Only reference the panel while it is actually mounted.
            aria-controls={navOpen ? NAV_PANEL_ID : undefined}
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {navOpen ? <CloseIcon /> : <MenuIcon />}
          </Button>
        </div>
      </header>

      {navOpen ? <MobileNav onNavigate={onCloseNav} /> : null}
    </div>
  )
}

/**
 * The compact navigation panel for narrow viewports: the same destinations as
 * the sidebar, plus the account block and sign-out.
 */
function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout } = useAuth()

  return (
    <div className={styles.panel} id={NAV_PANEL_ID}>
      <NavLinks onNavigate={onNavigate} />
      <div className={styles.panelFooter}>
        {user !== null ? <UserSummary user={user} /> : null}
        <Button
          variant="secondary"
          size="sm"
          block
          onClick={() => {
            onNavigate()
            logout()
          }}
        >
          <LogoutIcon width={16} height={16} />
          Sign out
        </Button>
      </div>
    </div>
  )
}
