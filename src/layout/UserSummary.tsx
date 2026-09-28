import type { AuthUser } from '../api/types'
import styles from './UserSummary.module.css'

/** Two initials at most, from the full name when there is one. */
function initialsFor(user: AuthUser): string {
  const source = user.fullName ?? user.email ?? '?'
  const words = source.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

/**
 * The signed-in account, as shown in the sidebar footer and the mobile panel.
 *
 * The avatar is decorative — the name next to it already carries the meaning —
 * so it is hidden from assistive technology.
 */
export function UserSummary({ user }: { user: AuthUser }) {
  const name = user.fullName ?? user.email ?? 'Signed in'
  const showEmail = user.fullName !== null && user.email !== null

  return (
    <div className={styles.user}>
      <span className={styles.avatar} aria-hidden="true">
        {initialsFor(user)}
      </span>
      <span className={styles.text}>
        <span className={styles.name} title={name}>
          {name}
        </span>
        {showEmail ? (
          <span className={styles.email} title={user.email ?? undefined}>
            {user.email}
          </span>
        ) : null}
      </span>
    </div>
  )
}
