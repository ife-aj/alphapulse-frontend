# AlphaPulse backend contract

Authoritative reference for the frontend. **Never guess a shape that is not
recorded here** — add it to §9 and ask.

**V** = verified, read from backend source or the live OpenAPI document.
**U** = unverified: the module exists but its contract is unknown. Do not build
against **U**.

Backend root `../alphapulse` (NestJS); the frontend must never modify it.
Verified from `src/main.ts`, `src/app.module.ts`, `src/health/health.controller.ts`,
`src/auth/*`, and `GET /api/docs-json` captured 2026-09-28.

## 1. Conventions (V)

- Global prefix `/api` on every route, no exclusions. Default port `3000` (`PORT`).
- One global `ValidationPipe`: `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
  So unknown body properties are **400**, never ignored; and DTO `@Transform`
  (trimming) runs **before** validation, so length checks see the trimmed value.
- Swagger UI at `/api/docs`; JSON at `/api/docs-json`. Bearer scheme name `bearer`.
- `ConfigModule` validates env at bootstrap and fails fast on invalid config.

## 2. Error envelope (V)

```json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
```

`message` is a **string** for thrown exceptions, a **string array** when the
`ValidationPipe` rejects a DTO. `ApiError` in the frontend normalises both into
`messages: string[]`. Messages are client-safe by design — the backend never
forwards raw Supabase or provider internals — so they may be displayed verbatim.

## 3. Authentication (V)

Supabase Auth behind the backend. The frontend never contacts Supabase and needs
no Supabase key.

Protected routes use `SupabaseAuthGuard`: it reads `Authorization: Bearer
<access_token>`, verifies it with Supabase, attaches the user to the request, and
passes the raw token downstream so a per-user RLS-scoped client can be built.

| Failure | Result |
| --- | --- |
| Missing header | 401 `Missing authorization header.` |
| Malformed header | 401 `Invalid authorization header format.` |
| Invalid/expired token | 401 `Invalid or expired access token.` |
| Supabase unreachable | **5xx**, deliberately not 401, so a client can tell "bad token" from "auth is down" |

**No refresh endpoint and no logout endpoint exist.** The access token is the only
usable credential; logout is purely client-side.

## 4. Auth endpoints (V)

Base `/api/auth`.

| Method | Path | Success | Errors |
| --- | --- | --- | --- |
| POST | `/login` | 200 `{user, session}`, both always present | 400 payload · 401 `Email or password is incorrect.` · 403 `Please confirm your email address before signing in.` · 502/503 Supabase |
| POST | `/register` | 201 `{user, session}` — **or `{user: null, session: null}`** when email confirmation is required | 400 payload · 409 `An account with this email already exists.` (only on an explicit Supabase conflict) |
| GET | `/me` | 200 `{user}`; requires bearer | 401 |

The `{user: null, session: null}` body is byte-identical for a new address and an
already-registered one, to prevent account enumeration. The UI must not imply the
account is definitely new.

### DTOs

```ts
AuthUserDto    { id: string; email: string | null; emailConfirmed: boolean
                 fullName: string | null; createdAt: string | null }   // ISO
AuthSessionDto { accessToken: string; refreshToken: string; expiresAt: number }
AuthResultDto  { user: AuthUserDto | null; session: AuthSessionDto | null }
MeResultDto    { user: AuthUserDto }
```

**`expiresAt` is epoch seconds**, computed as
`session.expires_at ?? floor(now/1000) + (expires_in ?? 3600)`. `fullName` comes
from `user_metadata.full_name`, trimmed; every other `user_metadata` key is dropped.

### Validation — mirror client-side, no stricter

| Field | Rules |
| --- | --- |
| `email` | `@IsEmail` (validator.js, `require_tld`) |
| `password` | `@IsString`, `@MinLength(8)` |
| `fullName` | trim → `@IsString`, `@IsNotEmpty`, `@MinLength(2)`, `@MaxLength(100)` |

## 5. Health (V)

`GET /api/health` → 200, unauthenticated:
`{ "status": "ok", "service": "alphapulse", "timestamp": "<ISO>" }`

## 6. Market, indicators, signals (V)

All five routes are **public**. None of the three controllers
(`MarketController`, `IndicatorsController`, `SignalsController`) declares a guard
or `@ApiBearerAuth`, which is why the OpenAPI document shows no `security` block
for them. Market requests therefore send no access token, and a failure here can
never trip the session-invalidating 401 handler.

| Method | Path | Query | 200 body |
| --- | --- | --- | --- |
| GET | `/api/market/quotes` | `symbols?` | `Quote[]` |
| GET | `/api/market/candles/{symbol}` | `days?` | `Candle[]` |
| GET | `/api/market/indicators/{symbol}` | — | `TechnicalAnalysis` |
| GET | `/api/market/indicators/rsi/{symbol}` | — | `RsiResult` |
| GET | `/api/market/signals/{symbol}` | — | `SignalResult` |

`symbol` is a **path** parameter on all but quotes.

### Symbol rules (V)

`market/validation/symbol.validation.ts` is one source of truth, shared by
`ParseSymbolPipe` (the `:symbol` path param) and `GetQuotesQueryDto` (the
`symbols` list):

- `SYMBOL_REGEX = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/` — 1–5 uppercase letters plus an
  optional dotted class suffix of 1–2 letters (`BRK.B`). No digits, hyphens or
  slashes; the comment explains those belong to other conventions (Yahoo writes
  `BRK-B`) or to forex/crypto pairs the product does not support.
- `MAX_SYMBOLS = 20`. Normalization is `trim()` then `toUpperCase()`.
- Hint reused in every message: `Expected a ticker such as AAPL or BRK.B.`

`ParseSymbolPipe` (400s, before any provider call):
- empty → `A stock symbol is required. <hint>`
- malformed → `Invalid symbol "<raw>". <hint>`
- valid → returns the normalized symbol

### Quotes (V)

`?symbols=` is a comma-separated list. The DTO's `@Transform` splits and
normalizes it, and also accepts the repeated-parameter array form Express can
produce.

| Input | Result |
| --- | --- |
| omitted | `undefined` → the service returns its own **default symbol set** |
| `?symbols=` (empty) | 400 `symbols must contain at least one ticker.` |
| more than 20 | 400 `symbols cannot contain more than 20 tickers.` |
| any invalid ticker | 400 `symbols contains an invalid ticker. <hint>` |

```ts
Quote { symbol: string; price: number; change: number
        changePercent: number; timestamp: string }   // ISO
```

**There is no open, high, low or previous close in the quote response.** The UI
shows only these four fields; the rest are not filled with placeholders.

### Candles (V)

`?days=` — `@Type(() => Number) @IsInt() @Min(1) @Max(365)`. Omitting it uses a
**service-side default that is not visible from the controller**, so its value is
unknown here — the UI always sends `days` explicitly and never depends on it.

```ts
Candle { date: string; open: number; high: number
         low: number; close: number; volume: number }
```

- **`date` is a calendar date string** (`"2024-01-03"`), **not** an epoch value.
  lightweight-charts accepts that string directly as a business day; converting it
  to a timestamp would introduce a timezone off-by-one.
- The series is **oldest-first** (stated on the interface), which is also what
  lightweight-charts requires. The client sorts defensively.
- OHLCV are numbers here — unlike the portfolio schemas, which use decimal strings.

### Indicators (V)

Two routes that overlap: the aggregate route already contains RSI.

```ts
RsiStatus = 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'      // <30, 30–70, >70

RsiResult         { symbol; rsi: number /* 0..100, 2dp */; status: RsiStatus }
RsiSummary        { value: number; status: RsiStatus }
MovingAverages    { sma20; sma50; ema20; ema50 }        // 2dp
MacdSummary       { value; signal; histogram }          // 12/26/9, 2dp
TechnicalAnalysis { symbol; rsi: RsiSummary
                    movingAverages: MovingAverages; macd: MacdSummary }
```

Every value is a **scalar** — the latest reading, not a series — so there is no
per-day indicator line to plot. No query parameters exist: the periods are fixed
by the backend, and **RSI's period is stated nowhere in the API**, so the UI names
the indicator without asserting one.

### Signals (V)

```ts
SignalType = 'BUY' | 'WEAK_BUY' | 'HOLD' | 'WEAK_SELL' | 'SELL'

SignalResult { symbol; signal: SignalType
               score: number       // -100..+100, four votes of ±25
               confidence: number  // 0..100, how strongly they agree
               reasons: string[] } // one explanation per indicator
```

**Five verdicts, not three** — the buy and sell sides each have a weak variant,
and the UI must distinguish them. The range comments above are the backend's own.

Trap: `market.types.ts` also declares an older `Signal` / `SignalAction` pair
(`action`, `rationale`, `generatedAt`). Nothing in these controllers returns it —
`signal.types.ts` holds the live contract.

### Provider errors (V)

`market/provider-errors.ts` is the complete translation layer for `/api/market`.
It uses the built-in exception subclasses so every body keeps the
`{ statusCode, message, error }` shape.

| Status | Message |
| --- | --- |
| 404 | `No market data for symbol "<SYM>".` |
| 429 | `Upstream market data rate limit exceeded. Please retry shortly.` |
| 502 | `Upstream market data provider returned an invalid response.` · `Upstream market data provider failed to serve the request.` |
| 503 | `Market data provider is currently unavailable.` |
| 504 | `Market data request timed out.` |
| 500 | `Unexpected error while fetching market data.` |

A raw provider 4xx is deliberately **not** reported as an unknown symbol — only a
provider body that explicitly says so is (Twelve Data's body-level 400/404, or
Finnhub's all-zero quote). A raw one falls into the 502 bucket because it is just
as likely to be AlphaPulse building a bad upstream request.

Consequence for the client: **404 means "unknown symbol" and 502/503/504 mean "the
provider had a problem"** — different messages, different retry behaviour. 429 and
4xx must not be retried; retrying a rate limit extends it.

## 7. Watchlists and portfolios (V, out of scope for Batch 2)

All routes require bearer auth and are RLS-scoped to the user.

| Method | Path | Success | Errors |
| --- | --- | --- | --- |
| POST · GET | `/api/watchlists` | 201 `WatchlistDto` · 200 `{watchlists[]}` | 400, 401, 409 |
| PATCH · DELETE | `/api/watchlists/{id}` | 200 `WatchlistDto` · 204 | 400, 401, 404, 409 |
| POST | `/api/watchlists/{id}/items` | 201 `WatchlistItemDto` | 400, 401, 404, 409 |
| DELETE | `/api/watchlists/{id}/items/{symbol}` | 204 | 400, 401, 404 |
| POST · GET | `/api/portfolios` | 201 `PortfolioDto` · 200 `{portfolios[]}` | 400, 401, 409 |
| GET · PATCH · DELETE | `/api/portfolios/{id}` | 200 `PortfolioDetailDto`/`PortfolioDto` · 204 | 400, 401, 404, 409 |
| POST | `/api/portfolios/{id}/holdings` | 201 `HoldingDto` | 400, 401, 404, 409 |
| PATCH · DELETE | `/api/portfolios/{id}/holdings/{symbol}` | 200 `HoldingDto` · 204 | 400, 401, 404 |
| GET | `/api/portfolios/{id}/valuation` | 200 `PortfolioValuationDto` | 400, 401, 404, 422 |

```ts
WatchlistDto      { id; name; createdAt; updatedAt; items?: WatchlistItemDto[] }
WatchlistItemDto  { id; symbol; createdAt; updatedAt }
PortfolioDto      { id; name; createdAt; updatedAt }
PortfolioDetailDto{ ...PortfolioDto; holdings: HoldingDto[] }
HoldingDto        { id; symbol; quantity; averagePurchasePrice; createdAt; updatedAt }
HoldingValuationDto { symbol; quantity; averagePurchasePrice; currentPrice
                      investedValue; currentValue; profitLoss; returnPercentage }
PortfolioValuationDto { portfolioId; totalInvestedValue; totalCurrentValue
                        totalProfitLoss; totalReturnPercentage; holdings[] }
```

- **Numeric fields are canonical decimal strings, never numbers**: `quantity`,
  `averagePurchasePrice`, `currentPrice` (the exact provider value, never
  rounded), and all valuation fields. Money and percentages are 2 dp.
  `HoldingValuationDto.currentPrice` is the one unrounded value.
- Name DTOs `{name}`: trimmed, 1–100 chars. `AddWatchlistItemDto` / `CreateHoldingDto`
  `{symbol}`: trimmed + uppercased.
- `CreateHoldingDto` / `UpdateHoldingDto`: `quantity`, `averagePurchasePrice` are
  finite numbers > 0, at most 12 integer digits and 6 dp.
- Ids are UUID strings; a malformed id is **400**, a missing/inaccessible one is
  **404** — so the UI must not conflate them.

## 8. CORS, proxy, and environment (V)

**The backend enables no CORS anywhere** — stated explicitly in `main.ts` and
repeated in `portfolio.gateway.ts` ("cross-origin browser clients are out of
scope"). The browser must therefore reach the API **same-origin**, via the Vite
dev/preview proxy. An absolute cross-origin `VITE_API_BASE_URL` is blocked until
CORS is enabled server-side. This applies to Socket.IO too.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base, no trailing slash. Default `/api`, proxied. |
| `API_PROXY_TARGET` | Dev/preview proxy target. Default `http://localhost:3000`. No `VITE_` prefix, so never bundled. |

Anything `VITE_`-prefixed is inlined into the browser bundle and is public. Never
put a backend secret — a Supabase service-role key above all — in the frontend.

## 9. Missing information

**One fact.** How the indicator and signal routes report **insufficient history** —
an RSI or a 50-day average for a symbol with too few candles. `provider-errors.ts`
defines no such exception and no service or calculator was read, so the status code
and body are unknown. Everything else in this document is verified.

This does not block the frontend. Any failure from an indicator or signal request
renders the backend's own message in a distinct error state, and 422 — the status
this backend does use for "cannot be computed from market data" (portfolio
valuation) — is additionally presented as an insufficient-history state. If the
routes use a different status, the message still reaches the user; only the
heading would be generic.

Also unverified and deliberately unused: the **service-side default for `days`**
when the candles query omits it. The value lives in the service, and the UI always
sends `days` explicitly.

## 10. Status

Batches 1–3 are complete against the contracts above: auth/routing/shell,
markets, and watchlists/portfolios/valuation/realtime. §9 still lists the one
unverified fact (insufficient-history responses).

## 11. Realtime socket contract (V)

Verified from `portfolio.gateway.ts` and `realtime.types.ts`. **Do not re-read
those files** — this section is the record.

### Connection

- Socket.IO on the **default namespace `/`** (`@WebSocketGateway()` takes no
  arguments) and the default path `/socket.io`, on the same HTTP server and port
  as the REST API.
- **No CORS**, so the browser connects **same-origin**: the Vite dev/preview
  proxy forwards `/socket.io` with `ws: true`.
- **Authentication is part of the handshake**, not an event. The client sends the
  Supabase access token as `auth.token`:

  ```ts
  io({ auth: (cb) => cb({ token: accessToken }) })
  ```

  A function is used so each reconnect attempt reads the current token.
- A missing or invalid token rejects the handshake: the client gets Socket.IO's
  `connect_error` with `error.data.code === 'UNAUTHORIZED'` and message
  `Authentication failed.` The socket never reaches the connected state, so no
  event handler can run unauthenticated.
- The token is verified **once per connection**, not per subscribe.

### Events — exactly four exist

| Direction | Event | Payload |
| --- | --- | --- |
| C→S | `portfolio:subscribe` | `{ portfolioId: string }` (UUID) + optional ack |
| C→S | `portfolio:unsubscribe` | `{ portfolioId: string }` (UUID) + optional ack |
| S→C | `portfolio:valuation` | `{ portfolioId, emittedAt: ISO string, valuation: PortfolioValuationDto }` |
| S→C | `portfolio:error` | `PortfolioSocketError` |

### Acknowledgements

```ts
PortfolioSubscribeAck =
  | { ok: true; portfolioId: string; subscribed: boolean }
  | { ok: false; error: PortfolioSocketError }

PortfolioUnsubscribeAck =
  | { ok: true; portfolioId: string }
  | { ok: false; error: PortfolioSocketError }
```

- `subscribed: false` means the socket was **already** subscribed — an idempotent
  duplicate with no second authorization, valuation, or provider call. It is a
  success, never an error.
- Unsubscribing from a portfolio the socket is not subscribed to still returns
  `ok: true`.
- A malformed payload returns `{ ok: false, error: { code: 'VALIDATION_ERROR',
  message: 'portfolioId must be a valid UUID.' } }`.

### `portfolio:error` contract

```ts
PortfolioSocketErrorCode =
  | 'VALIDATION_ERROR' | 'PORTFOLIO_NOT_FOUND'
  | 'MARKET_UNAVAILABLE' | 'INTERNAL_ERROR'

PortfolioSocketError { code: PortfolioSocketErrorCode; message: string }
PortfolioConnectErrorCode = 'UNAUTHORIZED'   // handshake only, never portfolio:error
```

Messages are **fixed constants**, never built from an exception, provider
payload, or database message:

| Code | Message |
| --- | --- |
| `PORTFOLIO_NOT_FOUND` | `Portfolio not found.` |
| `MARKET_UNAVAILABLE` | `Unable to obtain a portfolio valuation right now.` |
| `INTERNAL_ERROR` | `An unexpected error occurred.` |
| `VALIDATION_ERROR` | `portfolioId must be a valid UUID.` |

`portfolio:error` carries **no `portfolioId`** — it is emitted to the portfolio's
room, so it always refers to the portfolio that socket is subscribed to.

`MARKET_UNAVAILABLE` deliberately collapses every valuation-side failure: 422 (no
market data for a held symbol), 429, 500, 502, 503 and 504. The client cannot
tell them apart, by design. `PORTFOLIO_NOT_FOUND` is a neutral 404 for both
missing and foreign portfolios, so a client cannot distinguish them either.

### Rooms, delivery, and freshness

- Room name is server-derived — `portfolio:<userId>:<portfolioId>` — never a
  client value, so two users can never share a room.
- Two sockets on one portfolio each get their own initial valuation.
- **The valuation payload is byte-identical to
  `GET /api/portfolios/{id}/valuation`** — same DTO, same decimal formatting — so
  it can be written straight into that query's cache.
- This slice emits one initial valuation per successful subscribe. Later
  recalculation cycles broadcast to the same room, so `portfolio:valuation` must
  be treated as a **stream**, not a one-off.
- On disconnect the server cancels pending work and drops every subscription for
  that socket, so a client that just disconnects is still cleaned up.
