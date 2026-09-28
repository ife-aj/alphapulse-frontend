import { Link, useNavigate } from 'react-router-dom'
import { fieldErrorFor } from '../api/client'
import type { RegisterPayload } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useForm } from '../forms/useForm'
import {
  PASSWORD_MIN_LENGTH,
  normaliseRegister,
  validateRegister,
} from '../auth/validation'
import { ApiErrorAlert } from '../components/Alert'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { PasswordField } from '../components/ui/PasswordField'
import { TextField } from '../components/ui/TextField'
import styles from './auth.module.css'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const form = useForm<RegisterPayload>({
    initialValues: { fullName: '', email: '', password: '' },
    validate: validateRegister,
    normalize: normaliseRegister,
    onSubmit: (payload) => {
      register.mutate(payload, {
        onSuccess: (result) => {
          // A session means the account is live and the user is signed in.
          // No session means Supabase emailed a confirmation link instead —
          // the panel below explains that.
          if (result.session !== null) navigate('/app', { replace: true })
        },
      })
    },
  })

  const pending = register.isPending
  const serverError = register.error

  const changeField = (field: keyof RegisterPayload, value: string) => {
    if (register.isError) register.reset()
    form.setField(field, value)
  }

  if (register.isSuccess && register.data.session === null) {
    return <ConfirmationSentPanel email={register.variables?.email ?? ''} />
  }

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Brand size="lg" subtitle="Markets, watchlists, portfolios" />
        </header>

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>
          One account for your watchlists and portfolios.
        </p>

        <form
          className={styles.form}
          onSubmit={form.handleSubmit}
          noValidate
        >
          {serverError !== null ? (
            <ApiErrorAlert error={serverError} title="Could not create your account" />
          ) : null}

          <TextField
            label="Full name"
            name="fullName"
            value={form.values.fullName}
            onChange={(event) => changeField('fullName', event.target.value)}
            onBlur={() => form.handleBlur('fullName')}
            error={form.errors.fullName ?? fieldErrorFor(serverError, 'fullName')}
            autoComplete="name"
            placeholder="Ada Lovelace"
            maxLength={100}
            disabled={pending}
            required
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.values.email}
            onChange={(event) => changeField('email', event.target.value)}
            onBlur={() => form.handleBlur('email')}
            error={form.errors.email ?? fieldErrorFor(serverError, 'email')}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="you@example.com"
            disabled={pending}
            required
          />

          <PasswordField
            label="Password"
            name="password"
            value={form.values.password}
            onChange={(event) => changeField('password', event.target.value)}
            onBlur={() => form.handleBlur('password')}
            error={form.errors.password ?? fieldErrorFor(serverError, 'password')}
            hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            autoComplete="new-password"
            placeholder="Choose a password"
            disabled={pending}
            required
          />

          <Button type="submit" block loading={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link className={styles.link} to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

/**
 * Shown when registration succeeded but no session came back.
 *
 * The backend returns `{ user: null, session: null }` when Supabase requires
 * email confirmation, and — by design — returns that same body for an address
 * that already exists, so this copy must not imply the account is definitely
 * new.
 */
function ConfirmationSentPanel({ email }: { email: string }) {
  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Brand size="lg" subtitle="Markets, watchlists, portfolios" />
        </header>

        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          We sent a confirmation link to{' '}
          <span className={styles.emphasis}>{email}</span>. Open it to activate
          your account, then sign in. If the address already had an account,
          your existing password still applies.
        </p>

        <div className={styles.confirmationActions}>
          <Link className={styles.link} to="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
