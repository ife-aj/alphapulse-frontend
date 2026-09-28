import { useState } from 'react'
import { describeApiError } from '../api/errorState'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { StateNotice } from '../components/ui/StateNotice'
import { NameFormDialog } from '../forms/NameFormDialog'
import { WatchlistCard } from '../watchlists/WatchlistCard'
import { useWatchlists, useWatchlistMutations } from '../watchlists/hooks'
import listStyles from '../watchlists/watchlists.module.css'
import styles from './AppPages.module.css'

export function WatchlistsPage() {
  const { accessToken } = useAuth()
  const watchlists = useWatchlists(accessToken)
  const { create } = useWatchlistMutations(accessToken)
  const [creating, setCreating] = useState(false)

  const list = watchlists.data ?? []
  const error =
    watchlists.error !== null ? describeApiError(watchlists.error) : null

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Watchlists</h1>
        <p className={styles.subtitle}>
          Collections of symbols you follow, kept in one place for the markets
          view.
        </p>
        <div className={listStyles.headerAction}>
          <Button onClick={() => setCreating(true)}>New watchlist</Button>
        </div>
      </header>

      {watchlists.isPending ? (
        <StateNotice tone="loading" title="Loading watchlists…" />
      ) : null}

      {error !== null ? (
        <StateNotice
          tone="error"
          title={error.title}
          description={error.description}
          onRetry={
            error.retryable
              ? () => {
                  void watchlists.refetch()
                }
              : undefined
          }
        />
      ) : null}

      {watchlists.isSuccess && list.length === 0 ? (
        <StateNotice
          title="No watchlists yet"
          description="Create one to start collecting the symbols you follow."
        />
      ) : null}

      {list.length > 0 ? (
        <div className={listStyles.list}>
          {list.map((watchlist) => (
            <WatchlistCard key={watchlist.id} watchlist={watchlist} />
          ))}
        </div>
      ) : null}

      {creating ? (
        <NameFormDialog
          title="New watchlist"
          description="Give it a name you will recognise later."
          label="Name"
          submitLabel="Create watchlist"
          pending={create.isPending}
          error={create.error}
          onClose={() => {
            create.reset()
            setCreating(false)
          }}
          onSubmit={(name) => {
            create.mutate(name, { onSuccess: () => setCreating(false) })
          }}
        />
      ) : null}
    </>
  )
}
