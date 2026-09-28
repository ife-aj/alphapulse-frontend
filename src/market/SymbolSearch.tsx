import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { normalizeSymbol, symbolInputError } from './symbols'
import styles from './market.module.css'

interface SymbolSearchProps {
  /** Pre-fills the field, e.g. with the symbol currently being viewed. */
  initialValue?: string
  onSubmitSymbol: (symbol: string) => void
  label?: string
  submitLabel?: string
}

/**
 * Symbol entry with the backend's own validation.
 *
 * An invalid or empty symbol is rejected here with the message `ParseSymbolPipe`
 * would return, so the field never issues a request the API would 400.
 */
export function SymbolSearch({
  initialValue = '',
  onSubmitSymbol,
  label = 'Symbol',
  submitLabel = 'Load symbol',
}: SymbolSearchProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | undefined>(undefined)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = symbolInputError(value)
    if (message !== undefined) {
      setError(message)
      return
    }

    setError(undefined)
    onSubmitSymbol(normalizeSymbol(value))
  }

  return (
    <form className={styles.search} onSubmit={handleSubmit} noValidate>
      <TextField
        label={label}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          // Clear the complaint as soon as the input changes.
          if (error !== undefined) setError(undefined)
        }}
        error={error}
        hint="A ticker such as AAPL or BRK.B."
        placeholder="AAPL"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        required
      />
      <Button type="submit" block>
        {submitLabel}
      </Button>
    </form>
  )
}
