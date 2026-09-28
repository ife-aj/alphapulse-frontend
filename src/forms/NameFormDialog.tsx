import { useId } from 'react'
import { ApiErrorAlert } from '../components/Alert'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { TextField } from '../components/ui/TextField'
import { nameError, normalizeName } from './validators'
import { useForm } from './useForm'
import styles from './forms.module.css'

interface NameFormDialogProps {
  title: string
  description?: string
  label: string
  /** Pre-fills the field — used for renaming. */
  initialValue?: string
  submitLabel: string
  /** True while the request is in flight: blocks dismissal and double submits. */
  pending: boolean
  /** The mutation's error, shown inside the dialog so the form keeps its values. */
  error: unknown
  onSubmit: (name: string) => void
  onClose: () => void
}

/**
 * A single-field dialog for naming a watchlist or portfolio.
 *
 * Shared by both features because the backend takes the same payload for each
 * (`{ name }`, trimmed, 1–100 characters), so the rule and its message are
 * identical.
 *
 * The submit button lives in the dialog footer — outside the `<form>` — and is
 * wired to it with the `form` attribute, which keeps the footer layout while
 * leaving native submit behaviour (including Enter in the field) intact.
 */
export function NameFormDialog({
  title,
  description,
  label,
  initialValue = '',
  submitLabel,
  pending,
  error,
  onSubmit,
  onClose,
}: NameFormDialogProps) {
  const formId = useId()

  const form = useForm<{ name: string }>({
    initialValues: { name: initialValue },
    validate: (values) => {
      const message = nameError(values.name)
      return message === undefined ? {} : { name: message }
    },
    normalize: (values) => ({ name: normalizeName(values.name) }),
    onSubmit: (values) => onSubmit(values.name),
  })

  return (
    <Dialog
      title={title}
      description={description}
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {submitLabel}
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
          <ApiErrorAlert error={error} title="That name was not accepted" />
        ) : null}

        <TextField
          label={label}
          value={form.values.name}
          onChange={(event) => form.setField('name', event.target.value)}
          onBlur={() => form.handleBlur('name')}
          error={form.errors.name}
          autoComplete="off"
          autoFocus
          placeholder="Tech stocks"
          disabled={pending}
          required
        />
      </form>
    </Dialog>
  )
}
