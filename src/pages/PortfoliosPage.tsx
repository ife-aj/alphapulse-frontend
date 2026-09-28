import { useState } from 'react'
import { Link } from 'react-router-dom'
import { describeApiError } from '../api/errorState'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Dialog'
import { StateNotice } from '../components/ui/StateNotice'
import { NameFormDialog } from '../forms/NameFormDialog'
import { formatDateTime } from '../lib/dates'
import { usePortfolioMutations, usePortfolios } from '../portfolios/hooks'
import listStyles from '../portfolios/portfolios.module.css'
import styles from './AppPages.module.css'

/** Route to a portfolio's detail view. */
function portfolioPath(id: string): string {
  return `/app/portfolios/${encodeURIComponent(id)}`
}

export function PortfoliosPage() {
  const { accessToken } = useAuth()
  const portfolios = usePortfolios(accessToken)
  const { create, rename, remove } = usePortfolioMutations(accessToken)

  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const list = portfolios.data ?? []
  const error =
    portfolios.error !== null ? describeApiError(portfolios.error) : null

  const renaming = list.find((item) => item.id === renamingId) ?? null
  const deleting = list.find((item) => item.id === deletingId) ?? null

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Portfolios</h1>
        <p className={styles.subtitle}>
          What you hold, what it cost, and what it is worth now.
        </p>
        <div className={listStyles.headerAction}>
          <Button onClick={() => setCreating(true)}>New portfolio</Button>
        </div>
      </header>

      {portfolios.isPending ? (
        <StateNotice tone="loading" title="Loading portfolios…" />
      ) : null}

      {error !== null ? (
        <StateNotice
          tone="error"
          title={error.title}
          description={error.description}
          onRetry={
            error.retryable
              ? () => {
                  void portfolios.refetch()
                }
              : undefined
          }
        />
      ) : null}

      {portfolios.isSuccess && list.length === 0 ? (
        <StateNotice
          title="No portfolios yet"
          description="Create one to track holdings and see them valued against the live market."
        />
      ) : null}

      {list.length > 0 ? (
        <div className={listStyles.list}>
          {list.map((portfolio) => (
            <article key={portfolio.id} className={listStyles.card}>
              <header className={listStyles.cardHead}>
                <div className={listStyles.cardIdentity}>
                  <h2 className={listStyles.cardName}>
                    <Link to={portfolioPath(portfolio.id)}>
                      {portfolio.name}
                    </Link>
                  </h2>
                  <p className={listStyles.cardMeta}>
                    created {formatDateTime(portfolio.createdAt)}
                  </p>
                </div>
                <div className={listStyles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRenamingId(portfolio.id)}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingId(portfolio.id)}
                  >
                    Delete
                  </Button>
                </div>
              </header>
              <p>
                <Link className={styles.link} to={portfolioPath(portfolio.id)}>
                  Open holdings and valuation
                </Link>
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {creating ? (
        <NameFormDialog
          title="New portfolio"
          description="Give it a name you will recognise later."
          label="Name"
          submitLabel="Create portfolio"
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

      {renaming !== null ? (
        <NameFormDialog
          title="Rename portfolio"
          label="Name"
          initialValue={renaming.name}
          submitLabel="Save name"
          pending={rename.isPending}
          error={rename.error}
          onClose={() => {
            rename.reset()
            setRenamingId(null)
          }}
          onSubmit={(name) => {
            rename.mutate(
              { id: renaming.id, name },
              { onSuccess: () => setRenamingId(null) },
            )
          }}
        />
      ) : null}

      {deleting !== null ? (
        <ConfirmDialog
          title={`Delete “${deleting.name}”?`}
          description="The portfolio and every holding in it will be removed. This cannot be undone."
          confirmLabel="Delete portfolio"
          pending={remove.isPending}
          onCancel={() => {
            remove.reset()
            setDeletingId(null)
          }}
          onConfirm={() => {
            remove.mutate(deleting.id, { onSuccess: () => setDeletingId(null) })
          }}
        />
      ) : null}
    </>
  )
}
