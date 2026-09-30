import type { NestErrorBody } from './types'

/**
 * Resolve the API base URL once, at module load.
 *
 * Locally `/api` uses the Vite proxy. In production set VITE_API_BASE_URL
 * to the Render backend URL including `/api`.
 */
function resolveBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (configured === '' || configured === '/') return '/api'
  return configured.replace(/\/+$/, '')
}

export const API_BASE_URL = resolveBaseUrl()

// Socket.IO uses the backend origin, not the REST `/api` prefix.
// Relative API URLs retain the local same-origin Vite proxy.
export const SOCKET_BASE_URL = /^https?:\/\//i.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : window.location.origin

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Status used for failures that never reached the API — a dropped connection,
 * or the dev proxy failing to reach the backend. It is not a real HTTP status.
 */
export const NETWORK_ERROR_STATUS = 0

/**
 * An error response from the AlphaPulse API, or a transport failure.
 *
 * `messages` keeps the backend's own text so the UI can show it verbatim; the
 * API never leaks Supabase internals (`supabase-auth-errors.ts` guarantees it),
 * so these strings are safe to render.
 */
export class ApiError extends Error {
  readonly status: number
  readonly messages: readonly string[]

  constructor(status: number, messages: readonly string[]) {
    super(messages[0] ?? 'The request could not be completed.')
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
  }

  /** True when the access token is missing, invalid, or expired. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** True when the request never got an HTTP response. */
  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS
  }

  /**
   * The message the backend attached to one specific field, if any.
   *
   * class-validator messages read `<field> <problem>` (e.g. "password must be
   * at least 8 characters long"), so the field name is stripped and the rest
   * capitalized for display beneath the input. Messages that do not start with
   * `field` return undefined, and unknown "fields" are never looked up.
   */
  fieldError(field: string): string | undefined {
    const prefix = `${field} `
    for (const message of this.messages) {
      if (message.startsWith(prefix)) {
        const detail = message.slice(prefix.length).trim()
        if (detail === '') continue
        return detail.charAt(0).toUpperCase() + detail.slice(1)
      }
    }
    return undefined
  }
}

/** Narrow an unknown rejection to an {@link ApiError}. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

/** A display-ready message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message !== '') return error.message
  return 'Something went wrong. Please try again.'
}

/** Field-level message for `field`, or undefined when the error is not field-specific. */
export function fieldErrorFor(
  error: unknown,
  field: string,
): string | undefined {
  return isApiError(error) ? error.fieldError(field) : undefined
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Register the callback that invalidates the local session when an
 * authenticated request comes back 401.
 *
 * Only requests that actually carried an `Authorization` header can trigger it,
 * so a failed sign-in attempt never looks like an expired session.
 */
export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler
}

/** Copy for statuses we may have to explain without a usable response body. */
function fallbackMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'The request was rejected. Please check the values and try again.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have access to this resource.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'That request conflicts with existing data.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 502:
    case 503:
    case 504:
      return 'The AlphaPulse API is temporarily unavailable. Please try again shortly.'
    default:
      return status >= 500
        ? 'The AlphaPulse API returned an unexpected error.'
        : 'The request could not be completed.'
  }
}

/** Pull the human-readable strings out of a NestJS error envelope. */
function extractMessages(payload: unknown): string[] {
  if (typeof payload !== 'object' || payload === null) return []
  const { message } = payload as NestErrorBody
  if (typeof message === 'string') {
    return message.trim() === '' ? [] : [message]
  }
  if (Array.isArray(message)) {
    return message.filter(
      (entry): entry is string =>
        typeof entry === 'string' && entry.trim() !== '',
    )
  }
  return []
}

async function toApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.toLowerCase().includes('application/json')

  if (isJson) {
    try {
      const messages = extractMessages(await response.json())
      if (messages.length > 0) return new ApiError(response.status, messages)
    } catch {
      // Body was not valid JSON after all — fall through to the generic copy.
    }
  } else if (response.status >= 500) {
    // A gateway/proxy error page means the backend was never reached.
    return new ApiError(response.status, [
      'The AlphaPulse API could not be reached. Check that the backend is running.',
    ])
  }

  return new ApiError(response.status, [fallbackMessageFor(response.status)])
}

export interface ApiRequestOptions {
  method?: HttpMethod
  /** Serialized as JSON. Omit for requests without a body. */
  body?: unknown
  /**
   * Bearer token to send. When present the request carries an
   * `Authorization` header, and a 401 response invalidates the session.
   */
  accessToken?: string | null
  signal?: AbortSignal
}

/**
 * Perform a typed request against the AlphaPulse API.
 *
 * Resolves with the parsed JSON body, or rejects with an {@link ApiError} for
 * every non-2xx response and every transport failure. A caller therefore never
 * has to inspect `response.ok`.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, accessToken, signal } = options
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Auth is bearer-token only; no cookie ever needs to travel with the request.
      credentials: 'omit',
      signal,
    })
  } catch (error) {
    // Let React Query's cancellation propagate untouched.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(NETWORK_ERROR_STATUS, [
      'Could not reach the AlphaPulse API. Check your connection and that the backend is running.',
    ])
  }

  if (!response.ok) {
    const apiError = await toApiError(response)
    if (apiError.isUnauthorized && accessToken) unauthorizedHandler?.()
    throw apiError
  }

  if (response.status === 204) return undefined as unknown as T

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(response.status, [
      'The AlphaPulse API returned a response that could not be read.',
    ])
  }
}
