import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { describeApiError } from '../api/errorState'
import type { Holding } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Dialog'
import { StateNotice } from '../components/ui/StateNotice'
import { toDecimalNumber } from '../forms/validators'
import { HoldingDialog } from '../portfolios/HoldingDialog'
import type { HoldingValues } from '../portfolios/HoldingDialog'
import { HoldingsTable } from '../portfolios/HoldingsTable'
import {
  usePortfolioDetail,
  usePortfolioMutations,
  usePortfolioValuation,
} from '../portfolios/hooks'
import { RealtimeIndicator, ValuationPanel } from '../portfolios/ValuationPanel'
import { usePortfolioValuationStream } from '../portfolios/usePortfolioValuationStream'
import listStyles from '../portfolios/portfolios.module.css'
import styles from './AppPages.module.css'

export function PortfolioDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''

  if (id === '') return <MissingPortfolio />

  // Remount per portfolio, so the socket, the dialogs and any in-flight
  // mutation state can never carry over from the previous one.
  return <PortfolioDetail key={id} id={id} />
}

function MissingPortfolio() {
  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Portfolio not found</h1>
        <p className={styles.subtitle}>
          That address does not name a portfolio.
        </p>
      </header>
      <p>
        <Link className={styles.link} to="/app/portfolios">
          Back to portfolios
        </Link>
      </p>
    </>
  )
}

function PortfolioDetail({ id }: { id: string }) {
  const { accessToken } = useAuth()

  const detail = usePortfolioDetail(accessToken, id)
  const valuation = usePortfolioValuation(accessToken, id)
  const realtime = usePortfolioValuationStream(id)
  const { addHolding, updateHolding, removeHolding } =
    usePortfolioMutations(accessToken)

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Holding | null>(null)
  const [removing, setRemoving] = useState<Holding | null>(null)

  const holdings = detail.data?.holdings ?? []
  const detailError =
    detail.error !== null ? describeApiError(detail.error) : null
  const valuationError =
    valuation.error !== null ? describeApiError(valuation.error) : null

  // A portfolio that is missing, or belongs to someone else, is reported the
  // same neutral way by the API — so there is nothing here to tell apart.
  if (detailError !== null && detailError.kind === 'not-found') {
    return (
      <>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>Portfolio not found</h1>
          <p className={styles.subtitle}>
            {detailError.description} It may have been deleted, or it may never
            have existed.
          </p>
        </header>
        <p>
          <Link className={styles.link} to="/app/portfolios">
            Back to portfolios
          </Link>
        </p>
      </>
    )
  }

  const headerError =
    detailError !== null && detailError.kind !== 'not-found'
      ? detailError
      : null

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>{detail.data?.name ?? 'Portfolio'}</h1>
        <p className={styles.subtitle}>
          Holdings valued against the live market, updated while this page is
          open.
        </p>
        <div className={listStyles.headerAction}>
          <Button onClick={() => setAdding(true)}>Add holding</Button>
        </div>
      </header>

      <div className={styles.stack}>
        <section className={styles.panel} aria-labelledby="valuation-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="valuation-heading">
              Valuation
            </h2>
            <RealtimeIndicator realtime={realtime} />
          </header>

          <ValuationPanel
            valuation={valuation.data}
            isPending={valuation.isPending}
            error={valuationError}
            onRetry={() => {
              void valuation.refetch()
            }}
            realtime={realtime}
          />
        </section>

        <section className={styles.panel} aria-labelledby="holdings-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="holdings-heading">
              Holdings
            </h2>
          </header>

          {detail.isPending ? (
            <StateNotice tone="loading" title="Loading holdings…" />
          ) : null}

          {headerError !== null ? (
            <StateNotice
              tone="error"
              title={headerError.title}
              description={headerError.description}
              onRetry={
                headerError.retryable
                  ? () => {
                      void detail.refetch()
                    }
                  : undefined
              }
            />
          ) : null}

          {holdings.length > 0 ? (
            <HoldingsTable
              holdings={holdings}
              valuation={valuation.data}
              busy={removeHolding.isPending || updateHolding.isPending}
              onEdit={setEditing}
              onRemove={setRemoving}
            />
          ) : null}

          {detail.isSuccess && holdings.length === 0 ? (
            <StateNotice
              title="No holdings yet"
              description="Add what you own — a symbol, a quantity and what you paid — to see this portfolio valued."
            />
          ) : null}
        </section>
      </div>

      {adding ? (
        <HoldingDialog
          pending={addHolding.isPending}
          error={addHolding.error}
          onClose={() => {
            addHolding.reset()
            setAdding(false)
          }}
          onSubmit={(values: HoldingValues) => {
            addHolding.mutate(
              {
                id,
                // `CreateHoldingDto` is exactly these three fields; anything
                // else is rejected by the whitelist.
                body: {
                  symbol: values.symbol,
                  quantity: toDecimalNumber(values.quantity),
                  averagePurchasePrice: toDecimalNumber(
                    values.averagePurchasePrice,
                  ),
                },
              },
              { onSuccess: () => setAdding(false) },
            )
          }}
        />
      ) : null}

      {editing !== null ? (
        <HoldingDialog
          holding={editing}
          pending={updateHolding.isPending}
          error={updateHolding.error}
          onClose={() => {
            updateHolding.reset()
            setEditing(null)
          }}
          onSubmit={(values: HoldingValues) => {
            updateHolding.mutate(
              {
                id,
                symbol: editing.symbol,
                // `UpdateHoldingDto` has no symbol field, and an empty body is a
                // 400 — both values are always sent.
                body: {
                  quantity: toDecimalNumber(values.quantity),
                  averagePurchasePrice: toDecimalNumber(
                    values.averagePurchasePrice,
                  ),
                },
              },
              { onSuccess: () => setEditing(null) },
            )
          }}
        />
      ) : null}

      {removing !== null ? (
        <ConfirmDialog
          title={`Remove ${removing.symbol}?`}
          description={`${removing.symbol} and its cost basis will be removed from this portfolio.`}
          confirmLabel="Remove holding"
          pending={removeHolding.isPending}
          onCancel={() => {
            removeHolding.reset()
            setRemoving(null)
          }}
          onConfirm={() => {
            removeHolding.mutate(
              { id, symbol: removing.symbol },
              { onSuccess: () => setRemoving(null) },
            )
          }}
        />
      ) : null}
    </>
  )
}
