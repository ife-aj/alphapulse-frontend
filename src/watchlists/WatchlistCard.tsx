import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fieldErrorFor } from '../api/client'
import type { Watchlist } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ApiErrorAlert } from '../components/Alert'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Dialog'
import { Tag } from '../components/ui/Tag'
import { TextField } from '../components/ui/TextField'
import { NameFormDialog } from '../forms/NameFormDialog'
import { useForm } from '../forms/useForm'
import { formatDateTime } from '../lib/dates'
import {
  normalizeSymbol,
  symbolInputError,
  symbolPath,
} from '../market/symbols'
import { useWatchlistMutations } from './hooks'
import styles from './watchlists.module.css'

/**
 * One watchlist: its symbols, and every action that changes it.
 *
 * Renaming and deleting are dialogs; adding a symbol is an inline form, because
 * it is the one action taken repeatedly. Removing a symbol is confirmed — it
 * destroys data the user entered, even though it is easy to undo by hand.
 *
 * A symbol's text links to its market-analysis page; the remove button beside it
 * is a separate control, so opening the symbol never risks deleting it.
 */
export function WatchlistCard({ watchlist }: { watchlist: Watchlist }) {
  const { accessToken } = useAuth()
  const { rename, remove, addItem, removeItem } =
    useWatchlistMutations(accessToken)

  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [symbolToRemove, setSymbolToRemove] = useState<string | null>(null)

  const items = watchlist.items ?? []

  const addForm = useForm<{ symbol: string }>({
    initialValues: { symbol: '' },
    validate: (values) => {
      const message = symbolInputError(values.symbol)
      return message === undefined ? {} : { symbol: message }
    },
    normalize: (values) => ({ symbol: normalizeSymbol(values.symbol) }),
    onSubmit: (values) => {
      addItem.mutate(
        { id: watchlist.id, symbol: values.symbol },
        // Clear the field only once the symbol is actually on the list.
        { onSuccess: () => addForm.reset() },
      )
    },
  })

  const itemCount = items.length === 1 ? '1 symbol' : `${items.length} symbols`

  return (
    <article className={styles.card}>
      <header className={styles.cardHead}>
        <div className={styles.cardIdentity}>
          <h3 className={styles.cardName}>{watchlist.name}</h3>
          <p className={styles.cardMeta}>
            {itemCount} · created {formatDateTime(watchlist.createdAt)}
          </p>
        </div>
        <div className={styles.cardActions}>
          <Button variant="ghost" size="sm" onClick={() => setRenaming(true)}>
            Rename
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleting(true)}>
            Delete
          </Button>
        </div>
      </header>

      {items.length > 0 ? (
        <div className={styles.tags}>
          {items.map((item) => (
            <Tag
              key={item.id}
              removeLabel={`Remove ${item.symbol} from ${watchlist.name}`}
              onRemove={() => setSymbolToRemove(item.symbol)}
            >
              <Link
                className={styles.symbolLink}
                to={symbolPath(item.symbol)}
                aria-label={`View market analysis for ${item.symbol}`}
              >
                {item.symbol}
              </Link>
            </Tag>
          ))}
        </div>
      ) : (
        <p className={styles.noTags}>No symbols yet.</p>
      )}

      {addItem.isError ? (
        <div className={styles.error}>
          <ApiErrorAlert
            error={addItem.error}
            title="Could not add that symbol"
          />
        </div>
      ) : null}

      <form
        className={styles.addForm}
        onSubmit={addForm.handleSubmit}
        noValidate
      >
        <TextField
          label="Add symbol"
          value={addForm.values.symbol}
          onChange={(event) => addForm.setField('symbol', event.target.value)}
          onBlur={() => addForm.handleBlur('symbol')}
          error={addForm.errors.symbol ?? fieldErrorFor(addItem.error, 'symbol')}
          hint="A ticker such as AAPL or BRK.B."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="AAPL"
          disabled={addItem.isPending}
        />
        <Button type="submit" size="sm" loading={addItem.isPending}>
          Add symbol
        </Button>
      </form>

      {renaming ? (
        <NameFormDialog
          title="Rename watchlist"
          label="Name"
          initialValue={watchlist.name}
          submitLabel="Save name"
          pending={rename.isPending}
          error={rename.error}
          onClose={() => {
            rename.reset()
            setRenaming(false)
          }}
          onSubmit={(name) => {
            rename.mutate(
              { id: watchlist.id, name },
              { onSuccess: () => setRenaming(false) },
            )
          }}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title={`Delete “${watchlist.name}”?`}
          description="The watchlist and every symbol on it will be removed. This cannot be undone."
          confirmLabel="Delete watchlist"
          pending={remove.isPending}
          onCancel={() => {
            remove.reset()
            setDeleting(false)
          }}
          onConfirm={() => {
            remove.mutate(watchlist.id, {
              onSuccess: () => setDeleting(false),
            })
          }}
        />
      ) : null}

      {symbolToRemove !== null ? (
        <ConfirmDialog
          title={`Remove ${symbolToRemove}?`}
          description={`${symbolToRemove} will be removed from ${watchlist.name}.`}
          confirmLabel="Remove symbol"
          pending={removeItem.isPending}
          onCancel={() => {
            removeItem.reset()
            setSymbolToRemove(null)
          }}
          onConfirm={() => {
            removeItem.mutate(
              { id: watchlist.id, symbol: symbolToRemove },
              { onSuccess: () => setSymbolToRemove(null) },
            )
          }}
        />
      ) : null}
    </article>
  )
}
