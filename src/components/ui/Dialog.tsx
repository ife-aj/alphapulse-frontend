import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './ui.module.css'

interface DialogProps {
  title: string
  /** Rendered under the title and referenced by `aria-describedby`. */
  description?: string
  children?: ReactNode
  footer?: ReactNode
  onClose: () => void
  /** When false, Escape and a backdrop click do nothing — e.g. mid-request. */
  dismissible?: boolean
}

/**
 * A modal dialog built on the native `<dialog>` element.
 *
 * Mounting it *is* opening it: `showModal()` gives focus trapping, page inertness
 * and Escape handling for free, and the cleanup closes the dialog and returns
 * focus to whatever was focused before — the behaviour a hand-rolled modal
 * usually gets wrong. Callers render it conditionally, so unmounting is closing.
 */
export function Dialog({
  title,
  description,
  children,
  footer,
  onClose,
  dismissible = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = `${titleId}-description`

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    if (!dialog.open) dialog.showModal()

    return () => {
      if (dialog.open) dialog.close()
      returnFocusRef.current?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descriptionId : undefined}
      onCancel={(event) => {
        // Keep React the owner of "is it open": unmounting is what closes it.
        event.preventDefault()
        if (dismissible) onClose()
      }}
      onClick={(event) => {
        // A click landing on the dialog itself is a backdrop click; clicks on
        // its children bubble from inside the panel.
        if (dismissible && event.target === dialogRef.current) onClose()
      }}
    >
      <div className={styles.dialogPanel}>
        <h2 className={styles.dialogTitle} id={titleId}>
          {title}
        </h2>
        {description !== undefined ? (
          <p className={styles.dialogDescription} id={descriptionId}>
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {footer !== undefined ? (
        <div className={styles.dialogFooter}>{footer}</div>
      ) : null}
    </dialog>
  )
}

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  /** Shows a spinner on the confirm button and blocks dismissal. */
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation for a destructive action.
 *
 * Focus lands on Cancel, because the browser focuses the first focusable element
 * and Cancel comes first in the footer — the safe default when the other button
 * deletes something.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      description={description}
      onClose={onCancel}
      dismissible={!pending}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
