import type { LoginCredentials, RegisterPayload } from '../api/types'

/**
 * Client-side mirrors of the backend DTO constraints, so a request is only sent
 * when it can plausibly succeed. The server remains the authority — these rules
 * are deliberately no stricter than
 * `alphapulse/src/auth/dto/*.dto.ts`, or the client would reject payloads the
 * API accepts.
 */

/** `AuthCredentialsDto.password` — `@MinLength(8)`. */
export const PASSWORD_MIN_LENGTH = 8
/** `RegisterCredentialsDto.fullName` — `@MinLength(2)`. */
export const FULL_NAME_MIN_LENGTH = 2
/** `RegisterCredentialsDto.fullName` — `@MaxLength(100)`. */
export const FULL_NAME_MAX_LENGTH = 100

/**
 * Approximates class-validator's `@IsEmail` (validator.js with `require_tld`):
 * a local part, an `@`, then a dotted domain — no whitespace anywhere.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/

export type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>

/**
 * Trim what the backend trims. `fullName` is normalized server-side before its
 * length is checked, so the client trims first and both sides measure the same
 * thing. The email is trimmed as a convenience for pasted values (the backend
 * does not trim it, but it would accept the trimmed form). Passwords are never
 * touched — leading and trailing spaces are legitimate characters.
 */
export function normaliseLogin(values: LoginCredentials): LoginCredentials {
  return { ...values, email: values.email.trim() }
}

export function normaliseRegister(values: RegisterPayload): RegisterPayload {
  return {
    ...values,
    email: values.email.trim(),
    fullName: values.fullName.trim(),
  }
}

function emailError(email: string): string | undefined {
  if (email === '') return 'Email is required.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.'
  return undefined
}

function passwordError(password: string): string | undefined {
  if (password === '') return 'Password is required.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
  }
  return undefined
}

export function validateLogin(
  values: LoginCredentials,
): FieldErrors<LoginCredentials> {
  const errors: FieldErrors<LoginCredentials> = {}

  const email = emailError(values.email)
  if (email !== undefined) errors.email = email

  const password = passwordError(values.password)
  if (password !== undefined) errors.password = password

  return errors
}

export function validateRegister(
  values: RegisterPayload,
): FieldErrors<RegisterPayload> {
  const errors: FieldErrors<RegisterPayload> = { ...validateLogin(values) }

  const { fullName } = values
  if (fullName === '') {
    errors.fullName = 'Full name is required.'
  } else if (fullName.length < FULL_NAME_MIN_LENGTH) {
    errors.fullName = `Full name must be at least ${FULL_NAME_MIN_LENGTH} characters long.`
  } else if (fullName.length > FULL_NAME_MAX_LENGTH) {
    errors.fullName = `Full name must be at most ${FULL_NAME_MAX_LENGTH} characters long.`
  }

  return errors
}
