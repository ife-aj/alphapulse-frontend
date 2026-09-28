import { apiRequest } from './client'
import type { Watchlist, WatchlistItem, WatchlistsResponse } from './types'

/**
 * Watchlist endpoints — paths, payloads and statuses per
 * `docs/backend-contract.md` §7.
 *
 * Every route is guarded, so the access token is always sent. Request bodies
 * carry **only** the whitelisted fields: the global ValidationPipe rejects an
 * unknown property with a 400 rather than ignoring it.
 *
 * Errors are left as {@link ApiError} for the caller. The statuses that matter:
 * 400 malformed/invalid input, 404 unknown or foreign watchlist, 409 a name or
 * symbol that already exists.
 */

export async function fetchWatchlists(
  accessToken: string,
  signal?: AbortSignal,
): Promise<Watchlist[]> {
  const result = await apiRequest<WatchlistsResponse>('/watchlists', {
    accessToken,
    signal,
  })
  return result.watchlists
}

export function createWatchlist(
  accessToken: string,
  name: string,
): Promise<Watchlist> {
  return apiRequest<Watchlist>('/watchlists', {
    method: 'POST',
    body: { name },
    accessToken,
  })
}

export function renameWatchlist(
  accessToken: string,
  id: string,
  name: string,
): Promise<Watchlist> {
  return apiRequest<Watchlist>(`/watchlists/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { name },
    accessToken,
  })
}

export function deleteWatchlist(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiRequest<void>(`/watchlists/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken,
  })
}

export function addWatchlistItem(
  accessToken: string,
  id: string,
  symbol: string,
): Promise<WatchlistItem> {
  return apiRequest<WatchlistItem>(
    `/watchlists/${encodeURIComponent(id)}/items`,
    { method: 'POST', body: { symbol }, accessToken },
  )
}

export function removeWatchlistItem(
  accessToken: string,
  id: string,
  symbol: string,
): Promise<void> {
  return apiRequest<void>(
    `/watchlists/${encodeURIComponent(id)}/items/${encodeURIComponent(symbol)}`,
    { method: 'DELETE', accessToken },
  )
}
