import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fieldErrorFor } from '../api/client'
import type { LoginCredentials } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { redirectTarget } from '../auth/redirect'
import { useAuthForm } from '../auth/useAuthForm'
import { normaliseLogin, validateLogin } from '../auth/validation'
import { ApiErrorAlert } from '../components/Alert'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { PasswordField } from '../components/ui/PasswordField'
import { TextField } from '../components/ui/TextField'
import styles from './auth.module.css'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const form = useAuthForm<LoginCredentials>({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    normalize: normaliseLogin,
    onSubmit: (credentials) => {
      login.mutate(credentials, {
        onSuccess: () => {
          // Back to whatever protected route bounced them here, else /app.
          navigate(redirectTarget(location.state), { replace: true })
        },
      })
    },
  })

  const pending = login.isPending
  const serverError = login.error

  /** Editing anything invalidates the previous attempt's error. */
  const changeField = (field: keyof LoginCredentials, value: string) => {
    if (login.isError) login.reset()
    form.setField(field, value)
  }

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Brand size="lg" subtitle="Markets, watchlists, portfolios" />
        </header>

        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Welcome back. Enter your credentials to reach your dashboard.
        </p>

        <form
          className={styles.form}
          onSubmit={form.handleSubmit}
          noValidate
        >
          {serverError !== null ? (
            <ApiErrorAlert error={serverError} title="Could not sign you in" />
          ) : null}

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
            autoComplete="current-password"
            placeholder="Your password"
            disabled={pending}
            required
          />

          <Button type="submit" block loading={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className={styles.footer}>
          New to AlphaPulse?{' '}
          <Link className={styles.link} to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
