import { apiRequest } from './client'
import type {
  CreateHoldingBody,
  Holding,
  Portfolio,
  PortfolioDetail,
  PortfolioValuation,
  PortfoliosResponse,
  UpdateHoldingBody,
} from './types'

/**
 * Portfolio, holding and valuation endpoints — paths, payloads and statuses per
 * `docs/backend-contract.md` §7.
 *
 * Statuses worth distinguishing: **400** for malformed input or a malformed id,
 * **404** for a portfolio or holding that is missing *or* belongs to someone
 * else (the API does not distinguish), **409** for a name that exists or a
 * symbol already held, **422** when a held symbol has no market data and the
 * portfolio therefore cannot be valued at all.
 *
 * A holding's symbol is part of the path, so it is never sent in a body. Bodies
 * carry only whitelisted fields — the ValidationPipe rejects unknown properties.
 */

export async function fetchPortfolios(
  accessToken: string,
  signal?: AbortSignal,
): Promise<Portfolio[]> {
  const result = await apiRequest<PortfoliosResponse>('/portfolios', {
    accessToken,
    signal,
  })
  return result.portfolios
}

export function fetchPortfolio(
  accessToken: string,
  id: string,
  signal?: AbortSignal,
): Promise<PortfolioDetail> {
  return apiRequest<PortfolioDetail>(`/portfolios/${encodeURIComponent(id)}`, {
    accessToken,
    signal,
  })
}

/**
 * Live valuation. **422** means a held symbol has no market data, so no total
 * can be produced — the caller must show that as its own state rather than
 * falling back to a partial sum.
 */
export function fetchPortfolioValuation(
  accessToken: string,
  id: string,
  signal?: AbortSignal,
): Promise<PortfolioValuation> {
  return apiRequest<PortfolioValuation>(
    `/portfolios/${encodeURIComponent(id)}/valuation`,
    { accessToken, signal },
  )
}

export function createPortfolio(
  accessToken: string,
  name: string,
): Promise<Portfolio> {
  return apiRequest<Portfolio>('/portfolios', {
    method: 'POST',
    body: { name },
    accessToken,
  })
}

export function renamePortfolio(
  accessToken: string,
  id: string,
  name: string,
): Promise<Portfolio> {
  return apiRequest<Portfolio>(`/portfolios/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { name },
    accessToken,
  })
}

export function deletePortfolio(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiRequest<void>(`/portfolios/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken,
  })
}

export function addHolding(
  accessToken: string,
  id: string,
  body: CreateHoldingBody,
): Promise<Holding> {
  return apiRequest<Holding>(`/portfolios/${encodeURIComponent(id)}/holdings`, {
    method: 'POST',
    body,
    accessToken,
  })
}

export function updateHolding(
  accessToken: string,
  id: string,
  symbol: string,
  body: UpdateHoldingBody,
): Promise<Holding> {
  return apiRequest<Holding>(
    `/portfolios/${encodeURIComponent(id)}/holdings/${encodeURIComponent(symbol)}`,
    { method: 'PATCH', body, accessToken },
  )
}

export function removeHolding(
  accessToken: string,
  id: string,
  symbol: string,
): Promise<void> {
  return apiRequest<void>(
    `/portfolios/${encodeURIComponent(id)}/holdings/${encodeURIComponent(symbol)}`,
    { method: 'DELETE', accessToken },
  )
}
