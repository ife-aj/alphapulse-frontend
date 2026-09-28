import { useState } from 'react'
import { TextField } from './TextField'
import type { TextFieldProps } from './TextField'
import { EyeIcon, EyeOffIcon } from '../icons'
import styles from './ui.module.css'

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>

/**
 * A password input with a show/hide toggle.
 *
 * The toggle is a real `<button type="button">` — reachable by keyboard, and
 * it never submits the form. `aria-pressed` reports the current state and
 * `aria-label` names the action, so screen-reader users get both.
 */
export function PasswordField({ label = 'Password', ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const toggleLabel = visible ? 'Hide password' : 'Show password'

  return (
    <TextField
      {...rest}
      label={label}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  )
}
