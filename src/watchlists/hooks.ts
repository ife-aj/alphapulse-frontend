import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import {
  addWatchlistItem,
  createWatchlist,
  deleteWatchlist,
  fetchWatchlists,
  removeWatchlistItem,
  renameWatchlist,
} from '../api/watchlists'
import type { Watchlist, WatchlistItem } from '../api/types'

export const watchlistKeys = {
  all: ['watchlists'] as const,
  list: () => ['watchlists', 'list'] as const,
}

function requireToken(accessToken: string | null): string {
  if (accessToken === null) {
    // Unreachable: every caller is behind the auth guard.
    throw new ApiError(401, ['Not signed in.'])
  }
  return accessToken
}

/** A 4xx will never succeed on retry; only transport failures and 5xx might. */
function shouldRetry(failureCount: number, error: ApiError): boolean {
  if (error.isNetworkError || error.status >= 500) return failureCount < 2
  return false
}

/**
 * The signed-in user's watchlists, each with its items.
 *
 * `GET /api/watchlists` is the only read: it returns names *and* items, so the
 * dashboard and the watchlists page share one cache entry and one request.
 */
export function useWatchlists(accessToken: string | null) {
  return useQuery<Watchlist[], ApiError>({
    queryKey: watchlistKeys.list(),
    queryFn: ({ signal }) => fetchWatchlists(requireToken(accessToken), signal),
    enabled: accessToken !== null,
    staleTime: 30_000,
    retry: shouldRetry,
  })
}

/**
 * Every watchlist mutation.
 *
 * All five invalidate the same single key, because the list query is the only
 * watchlist query and it carries both names and items — that is as narrow as it
 * can be, and narrower than invalidating the whole cache.
 */
export function useWatchlistMutations(accessToken: string | null) {
  const queryClient = useQueryClient()

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: watchlistKeys.all })
  }

  const create = useMutation<Watchlist, ApiError, string>({
    mutationFn: (name) => createWatchlist(requireToken(accessToken), name),
    onSuccess: invalidateList,
  })

  const rename = useMutation<Watchlist, ApiError, { id: string; name: string }>({
    mutationFn: ({ id, name }) =>
      renameWatchlist(requireToken(accessToken), id, name),
    onSuccess: invalidateList,
  })

  const remove = useMutation<void, ApiError, string>({
    mutationFn: (id) => deleteWatchlist(requireToken(accessToken), id),
    onSuccess: invalidateList,
  })

  const addItem = useMutation<
    WatchlistItem,
    ApiError,
    { id: string; symbol: string }
  >({
    mutationFn: ({ id, symbol }) =>
      addWatchlistItem(requireToken(accessToken), id, symbol),
    onSuccess: invalidateList,
  })

  const removeItem = useMutation<void, ApiError, { id: string; symbol: string }>({
    mutationFn: ({ id, symbol }) =>
      removeWatchlistItem(requireToken(accessToken), id, symbol),
    onSuccess: invalidateList,
  })

  return { create, rename, remove, addItem, removeItem }
}
