import { useId } from 'react'
import type { Holding } from '../api/types'
import { ApiErrorAlert } from '../components/Alert'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { TextField } from '../components/ui/TextField'
import type { FieldErrors } from '../forms/useForm'
import { useForm } from '../forms/useForm'
import { decimalInputError } from '../forms/validators'
import { normalizeSymbol, symbolInputError } from '../market/symbols'
import styles from './portfolios.module.css'

export interface HoldingValues {
  symbol: string
  quantity: string
  averagePurchasePrice: string
}

interface HoldingDialogProps {
  /** Omitted to add a holding; given to edit that holding. */
  holding?: Holding
  pending: boolean
  error: unknown
  onSubmit: (values: HoldingValues) => void
  onClose: () => void
}

/**
 * Add or edit a holding.
 *
 * Both fields are validated as **text** against the API's rule — greater than
 * zero, at most 12 integer digits and 6 decimals — so a value the API would
 * round or reject is caught here first. The one conversion to a number happens
 * on submit, at the wire boundary.
 *
 * When editing, the symbol is shown but not editable: the API identifies a
 * holding by its symbol in the path, and `UpdateHoldingDto` has no symbol field.
 */
export function HoldingDialog({
  holding,
  pending,
  error,
  onSubmit,
  onClose,
}: HoldingDialogProps) {
  const formId = useId()
  const editing = holding !== undefined

  const form = useForm<HoldingValues>({
    initialValues: {
      symbol: holding?.symbol ?? '',
      quantity: holding?.quantity ?? '',
      averagePurchasePrice: holding?.averagePurchasePrice ?? '',
    },
    validate: (values) => {
      const errors: FieldErrors<HoldingValues> = {}

      if (!editing) {
        const message = symbolInputError(values.symbol)
        if (message !== undefined) errors.symbol = message
      }

      const quantity = decimalInputError(values.quantity, 'Quantity')
      if (quantity !== undefined) errors.quantity = quantity

      const price = decimalInputError(
        values.averagePurchasePrice,
        'Average purchase price',
      )
      if (price !== undefined) errors.averagePurchasePrice = price

      return errors
    },
    normalize: (values) => ({
      symbol: normalizeSymbol(values.symbol),
      quantity: values.quantity.trim(),
      averagePurchasePrice: values.averagePurchasePrice.trim(),
    }),
    onSubmit: (values) => {
      onSubmit({
        symbol: values.symbol,
        quantity: values.quantity,
        averagePurchasePrice: values.averagePurchasePrice,
      })
    },
  })

  return (
    <Dialog
      title={editing ? `Edit ${holding.symbol}` : 'Add a holding'}
      description={
        editing
          ? 'Update the quantity, the average price, or both.'
          : 'Record what you own so the portfolio can be valued.'
      }
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {editing ? 'Save holding' : 'Add holding'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.form}
        onSubmit={form.handleSubmit}
        noValidate
      >
        {error !== null && error !== undefined ? (
          <ApiErrorAlert error={error} title="That holding was not accepted" />
        ) : null}

        {editing ? (
          <div className={styles.readonlySymbol}>
            <span className={styles.totalLabel}>Symbol</span>
            <span className={styles.readonlyValue}>{holding.symbol}</span>
          </div>
        ) : (
          <TextField
            label="Symbol"
            value={form.values.symbol}
            onChange={(event) => form.setField('symbol', event.target.value)}
            onBlur={() => form.handleBlur('symbol')}
            error={form.errors.symbol}
            hint="A ticker such as AAPL or BRK.B."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="AAPL"
            disabled={pending}
            autoFocus
            required
          />
        )}

        <div className={styles.formRow}>
          <TextField
            label="Quantity"
            value={form.values.quantity}
            onChange={(event) => form.setField('quantity', event.target.value)}
            onBlur={() => form.handleBlur('quantity')}
            error={form.errors.quantity}
            inputMode="decimal"
            autoComplete="off"
            placeholder="12.5"
            disabled={pending}
            required
          />
          <TextField
            label="Average purchase price"
            value={form.values.averagePurchasePrice}
            onChange={(event) =>
              form.setField('averagePurchasePrice', event.target.value)
            }
            onBlur={() => form.handleBlur('averagePurchasePrice')}
            error={form.errors.averagePurchasePrice}
            inputMode="decimal"
            autoComplete="off"
            placeholder="152.3755"
            disabled={pending}
            required
          />
        </div>
      </form>
    </Dialog>
  )
}
