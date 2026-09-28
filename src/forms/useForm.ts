import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'

/** Per-field messages. An empty object means the form is valid. */
export type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>

/**
 * Drop entries that are not real messages.
 *
 * A validator written as `{ symbol: symbolInputError(...) }` produces a key
 * holding `undefined` when the field is fine, which would otherwise count as an
 * error and block submission. Normalising here means callers can write
 * validators either way.
 */
function definedErrors<TValues>(
  errors: FieldErrors<TValues>,
): FieldErrors<TValues> {
  const result: FieldErrors<TValues> = {}
  for (const [field, message] of Object.entries(errors)) {
    if (typeof message === 'string' && message !== '') {
      result[field as keyof TValues] = message
    }
  }
  return result
}

interface UseFormOptions<TValues extends object> {
  initialValues: TValues
  /** Returns the errors for the whole form; an empty object means valid. */
  validate: (values: TValues) => FieldErrors<TValues>
  /** Applied before validating and before submitting. */
  normalize?: (values: TValues) => TValues
  onSubmit: (values: TValues) => void
}

/**
 * Minimal controlled-form state, shared by every form in the app.
 *
 * Deliberately not a form library: it covers what these forms need — values,
 * per-field errors, validation on blur and on submit, clearing a field's error
 * as soon as it is edited, and moving focus to the first invalid field so the
 * keyboard flow stays on the field that needs attention.
 *
 * It holds no ref: the submit handler reads the form element off the event
 * itself, which is the only thing a ref would have been used for.
 */
export function useForm<TValues extends object>({
  initialValues,
  validate,
  normalize,
  onSubmit,
}: UseFormOptions<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors<TValues>>({})

  const setField = useCallback((field: keyof TValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (current[field] === undefined) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  const handleBlur = useCallback(
    (field: keyof TValues) => {
      const normalized = normalize ? normalize(values) : values
      const fieldError = definedErrors(validate(normalized))[field]
      setErrors((current) => {
        if (fieldError === undefined) return current
        return { ...current, [field]: fieldError }
      })
    },
    [values, validate, normalize],
  )

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      // Read now: React clears `currentTarget` once this handler returns.
      const formElement = event.currentTarget

      const normalized = normalize ? normalize(values) : values
      const nextErrors = definedErrors(validate(normalized))

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors)
        // Runs after React has committed the invalid state, so the field is
        // already marked `aria-invalid` and can be found and focused.
        requestAnimationFrame(() => {
          formElement
            .querySelector<HTMLElement>('[aria-invalid="true"]')
            ?.focus()
        })
        return
      }

      setErrors({})
      setValues(normalized)
      onSubmit(normalized)
    },
    [values, validate, normalize, onSubmit],
  )

  /** Return to the initial values and drop every error — e.g. after a create. */
  const reset = () => {
    setValues(initialValues)
    setErrors({})
  }

  return { values, errors, setField, handleBlur, handleSubmit, reset }
}
