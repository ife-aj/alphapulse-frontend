import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { LogoutIcon } from '../components/icons'
import { NavLinks } from './NavLinks'
import { UserSummary } from './UserSummary'
import styles from './Sidebar.module.css'

/**
 * Desktop navigation: brand, primary nav, and the account block.
 *
 * It is hidden below 1024px by CSS — the same content is offered by the mobile
 * panel in `TopBar` — so a single set of nav links is never announced twice.
 */
export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Brand subtitle="Trading workspace" />
      </div>

      <div className={styles.navArea}>
        <NavLinks />
      </div>

      <div className={styles.footer}>
        {user !== null ? <UserSummary user={user} /> : null}
        <Button variant="secondary" size="sm" block onClick={logout}>
          <LogoutIcon width={16} height={16} />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
