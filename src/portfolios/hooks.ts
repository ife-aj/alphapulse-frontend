import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import {
  addHolding,
  createPortfolio,
  deletePortfolio,
  fetchPortfolio,
  fetchPortfolioValuation,
  fetchPortfolios,
  removeHolding,
  renamePortfolio,
  updateHolding,
} from '../api/portfolios'
import type {
  CreateHoldingBody,
  Holding,
  Portfolio,
  PortfolioDetail,
  PortfolioValuation,
  UpdateHoldingBody,
} from '../api/types'

export const portfolioKeys = {
  all: ['portfolios'] as const,
  list: () => ['portfolios', 'list'] as const,
  detail: (id: string) => ['portfolios', 'detail', id] as const,
  valuation: (id: string) => ['portfolios', 'valuation', id] as const,
}

function requireToken(accessToken: string | null): string {
  if (accessToken === null) {
    // Unreachable: every caller is behind the auth guard.
    throw new ApiError(401, ['Not signed in.'])
  }
  return accessToken
}

/**
 * A 4xx is terminal — an unknown portfolio or a rejected payload will not fix
 * itself — and a 429 must not be retried or it extends the rate limit. `422` in
 * particular is not retryable: a held symbol with no market data will still have
 * none a second later.
 */
function shouldRetry(failureCount: number, error: ApiError): boolean {
  if (error.isNetworkError || error.status >= 500) return failureCount < 2
  return false
}

/** The signed-in user's portfolios, shared with the dashboard's summary. */
export function usePortfolios(accessToken: string | null) {
  return useQuery<Portfolio[], ApiError>({
    queryKey: portfolioKeys.list(),
    queryFn: ({ signal }) => fetchPortfolios(requireToken(accessToken), signal),
    enabled: accessToken !== null,
    staleTime: 30_000,
    retry: shouldRetry,
  })
}

/** One portfolio with its holdings. */
export function usePortfolioDetail(accessToken: string | null, id: string) {
  return useQuery<PortfolioDetail, ApiError>({
    queryKey: portfolioKeys.detail(id),
    queryFn: ({ signal }) =>
      fetchPortfolio(requireToken(accessToken), id, signal),
    enabled: accessToken !== null,
    staleTime: 30_000,
    retry: shouldRetry,
  })
}

/**
 * Live valuation.
 *
 * Kept fresh by the socket while a portfolio is open
 * (`usePortfolioValuationStream`), so its `staleTime` is short: a REST refetch
 * is a fallback, not the primary source.
 */
export function usePortfolioValuation(accessToken: string | null, id: string) {
  return useQuery<PortfolioValuation, ApiError>({
    queryKey: portfolioKeys.valuation(id),
    queryFn: ({ signal }) =>
      fetchPortfolioValuation(requireToken(accessToken), id, signal),
    enabled: accessToken !== null,
    staleTime: 15_000,
    retry: shouldRetry,
  })
}

/**
 * Portfolio and holding mutations.
 *
 * Invalidation is per-mutation rather than blanket:
 * - anything that changes the *list* of portfolios (create, rename, delete)
 *   invalidates the list;
 * - holding changes touch neither the list nor any other portfolio, so they
 *   invalidate only that portfolio's detail and valuation;
 * - deleting removes the deleted portfolio's detail and valuation entries
 *   outright, so a stale page cannot repopulate from cache.
 */
export function usePortfolioMutations(accessToken: string | null) {
  const queryClient = useQueryClient()

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: portfolioKeys.list() })
  }

  const invalidateHoldings = (id: string) => {
    void queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(id) })
    void queryClient.invalidateQueries({ queryKey: portfolioKeys.valuation(id) })
  }

  const create = useMutation<Portfolio, ApiError, string>({
    mutationFn: (name) => createPortfolio(requireToken(accessToken), name),
    onSuccess: invalidateList,
  })

  const rename = useMutation<Portfolio, ApiError, { id: string; name: string }>({
    mutationFn: ({ id, name }) =>
      renamePortfolio(requireToken(accessToken), id, name),
    onSuccess: (portfolio) => {
      invalidateList()
      void queryClient.invalidateQueries({
        queryKey: portfolioKeys.detail(portfolio.id),
      })
    },
  })

  const remove = useMutation<void, ApiError, string>({
    mutationFn: (id) => deletePortfolio(requireToken(accessToken), id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: portfolioKeys.detail(id) })
      queryClient.removeQueries({ queryKey: portfolioKeys.valuation(id) })
      invalidateList()
    },
  })

  const addHoldingMutation = useMutation<
    Holding,
    ApiError,
    { id: string; body: CreateHoldingBody }
  >({
    mutationFn: ({ id, body }) =>
      addHolding(requireToken(accessToken), id, body),
    onSuccess: (_holding, { id }) => invalidateHoldings(id),
  })

  const updateHoldingMutation = useMutation<
    Holding,
    ApiError,
    { id: string; symbol: string; body: UpdateHoldingBody }
  >({
    mutationFn: ({ id, symbol, body }) =>
      updateHolding(requireToken(accessToken), id, symbol, body),
    onSuccess: (_holding, { id }) => invalidateHoldings(id),
  })

  const removeHoldingMutation = useMutation<
    void,
    ApiError,
    { id: string; symbol: string }
  >({
    mutationFn: ({ id, symbol }) =>
      removeHolding(requireToken(accessToken), id, symbol),
    onSuccess: (_result, { id }) => invalidateHoldings(id),
  })

  return {
    create,
    rename,
    remove,
    addHolding: addHoldingMutation,
    updateHolding: updateHoldingMutation,
    removeHolding: removeHoldingMutation,
  }
}
