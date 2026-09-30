import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { SOCKET_BASE_URL } from '../api/client'
import type {
  PortfolioConnectErrorCode,
  PortfolioSocketError,
  PortfolioSocketErrorCode,
  PortfolioSubscribeAck,
  PortfolioValuationEvent,
} from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { portfolioKeys } from './hooks'

export type RealtimeStatus = 'idle' | 'connecting' | 'live' | 'error'

export interface RealtimeNotice {
  /** `UNAUTHORIZED` comes from the handshake; the rest are `portfolio:error` codes. */
  code: PortfolioSocketErrorCode | PortfolioConnectErrorCode
  message: string
}

export interface PortfolioRealtimeState {
  status: RealtimeStatus
  notice: RealtimeNotice | null
}

interface StreamState {
  key: string
  status: RealtimeStatus
  notice: RealtimeNotice | null
}

/** The gateway rejects the handshake, not the subscribe, when the token is bad. */
function connectErrorNotice(error: unknown): RealtimeNotice {
  const code =
    typeof error === 'object' && error !== null
      ? (error as { data?: { code?: unknown } }).data?.code
      : undefined

  if (code === 'UNAUTHORIZED') {
    return {
      code: 'UNAUTHORIZED',
      message: 'Live updates are off: the session was rejected.',
    }
  }

  // A transport-level failure. Socket.IO's own text ("xhr poll error") is not
  // worth showing, so this uses plain language instead.
  return {
    code: 'INTERNAL_ERROR',
    message: 'Live updates are unavailable right now.',
  }
}

/**
 * Streams live valuations for one portfolio while its page is open.
 *
 * Shape of the contract (verified in `docs/backend-contract.md` §11):
 * - the access token authenticates the **handshake** as `auth.token`, so a bad
 *   token surfaces as `connect_error`, never as an event;
 * - `portfolio:subscribe` is acknowledged, and `subscribed: false` means the
 *   socket was already subscribed — a success, not a failure;
 * - `portfolio:valuation` carries a valuation identical to the REST payload, so
 *   it is written straight into that portfolio's cache entry;
 * - `portfolio:error` carries no portfolio id, because it is emitted to the
 *   portfolio's room — so it always refers to the one being watched.
 *
 * The socket lives exactly as long as the page: created on mount, torn down with
 * every listener removed on unmount. Socket.IO reconnects on its own, and the
 * `connect` handler resubscribes each time, because rooms do not survive a
 * reconnect. Because there is exactly one socket and one set of handlers, a
 * reconnect cannot duplicate a listener.
 *
 * Connection state is reported separately from the REST queries, so a dead socket
 * never blocks the page from working.
 */
export function usePortfolioValuationStream(
  portfolioId: string | null,
): PortfolioRealtimeState {
  const { accessToken, status: authStatus } = useAuth()
  const queryClient = useQueryClient()

  const active =
    portfolioId !== null &&
    accessToken !== null &&
    authStatus === 'authenticated'

  /**
   * A socket belongs to one (portfolio, token) pair. Keying the reported state to
   * that pair means a new pair reads as `connecting` until its own first event
   * arrives — with no state written while the effect body runs.
   */
  const key = active && portfolioId !== null && accessToken !== null
    ? `${portfolioId}|${accessToken}`
    : null

  const [state, setState] = useState<StreamState>({
    key: '',
    status: 'connecting',
    notice: null,
  })

  useEffect(() => {
    if (key === null || portfolioId === null || accessToken === null) return

    const socket = io(SOCKET_BASE_URL, {
      // A function so every reconnect attempt reads the current token.
      auth: (cb) => cb({ token: accessToken }),
      // The page decides when to connect, so nothing happens until it does.
      autoConnect: false,
    })

    const publish = (status: RealtimeStatus, notice: RealtimeNotice | null) => {
      setState({ key, status, notice })
    }

    const onConnect = () => {
      socket.emit(
        'portfolio:subscribe',
        { portfolioId },
        (ack: PortfolioSubscribeAck) => {
          if (ack.ok) publish('live', null)
          else publish('error', ack.error)
        },
      )
    }

    const onDisconnect = () => {
      // Socket.IO is already trying to reconnect; say so rather than "error".
      publish('connecting', null)
    }

    const onConnectError = (error: unknown) => {
      publish('error', connectErrorNotice(error))
    }

    const onValuation = (event: PortfolioValuationEvent) => {
      // Only the portfolio this socket subscribed to, into that portfolio's own
      // cache entry — never a shared or neighbouring one.
      if (event.portfolioId !== portfolioId) return
      queryClient.setQueryData(
        portfolioKeys.valuation(event.portfolioId),
        event.valuation,
      )
      publish('live', null)
    }

    const onPortfolioError = (error: PortfolioSocketError) => {
      publish('error', error)
      // The portfolio is gone (deleted here or elsewhere): let the REST layer
      // reconcile so the page shows its not-found state rather than stale data.
      if (error.code === 'PORTFOLIO_NOT_FOUND') {
        void queryClient.invalidateQueries({
          queryKey: portfolioKeys.detail(portfolioId),
        })
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('portfolio:valuation', onValuation)
    socket.on('portfolio:error', onPortfolioError)

    socket.connect()

    return () => {
      // Best-effort unsubscribe; the gateway independently drops every
      // subscription for a socket on disconnect, which is the actual guarantee.
      socket.emit('portfolio:unsubscribe', { portfolioId })
      // Remove handlers before disconnecting: nothing can fire afterwards, and a
      // re-render or remount cannot leave a duplicate listening.
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [key, portfolioId, accessToken, queryClient])

  const status: RealtimeStatus =
    key === null ? 'idle' : state.key === key ? state.status : 'connecting'
  const notice = state.key === key ? state.notice : null

  return { status, notice }
}
