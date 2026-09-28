import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'
import styles from './NavLinks.module.css'

interface NavLinksProps {
  /** Called after a link is followed, so the mobile panel can close itself. */
  onNavigate?: () => void
}

/** The primary navigation list, shared by the desktop sidebar and the mobile panel. */
export function NavLinks({ onNavigate }: NavLinksProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <p className={styles.sectionLabel}>Workspace</p>
      {NAV_ITEMS.map(({ to, label, description, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={description}
          onClick={onNavigate}
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.linkActive}` : styles.link
          }
        >
          <Icon className={styles.icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
