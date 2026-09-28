import { Suspense, lazy, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StateNotice } from '../components/ui/StateNotice'
import { describeMarketError } from '../market/errors'
import { formatIndicator } from '../market/format'
import {
  useCandles,
  useQuotes,
  useRsi,
  useSignal,
  useTechnicalAnalysis,
} from '../market/hooks'
import { IndicatorPanel } from '../market/IndicatorPanel'
import { DEFAULT_RANGE_DAYS, RangeSelector } from '../market/RangeSelector'
import { QuoteCard, QuoteSummary } from '../market/QuoteCard'
import { SignalPanel } from '../market/SignalPanel'
import { SymbolSearch } from '../market/SymbolSearch'
import {
  SYMBOL_FORMAT_HINT,
  isValidSymbol,
  normalizeSymbol,
  symbolPath,
} from '../market/symbols'
import marketStyles from '../market/market.module.css'
import styles from './AppPages.module.css'

/**
 * lightweight-charts is by far the largest dependency in the app and is needed
 * only once a symbol's price history is on screen, so it is fetched on demand
 * rather than shipped in the initial bundle. `PriceChart.tsx` is the boundary —
 * see its doc comment before adding anything to it.
 */
const PriceChart = lazy(() =>
  import('../market/PriceChart').then((module) => ({
    default: module.PriceChart,
  })),
)

const RSI_STATUS_LABEL = {
  OVERSOLD: 'Oversold',
  NEUTRAL: 'Neutral',
  OVERBOUGHT: 'Overbought',
} as const

/**
 * `/app/markets` — the market overview.
 *
 * The quote list comes from `/market/quotes` with no `symbols` parameter, so the
 * backend supplies its default set. That is the same query the dashboard makes,
 * with the same key, so opening one after the other costs a single provider call.
 */
export function MarketsIndexPage() {
  const navigate = useNavigate()
  const quotes = useQuotes()
  const list = quotes.data ?? []
  const featured = list.length > 0 ? list[0].symbol : null
  const rsi = useRsi(featured)

  const quoteError =
    quotes.error !== null ? describeMarketError(quotes.error) : null
  const rsiError = rsi.error !== null ? describeMarketError(rsi.error) : null

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Markets</h1>
        <p className={styles.subtitle}>
          Look up a symbol, or start from the overview of the market the backend
          tracks by default.
        </p>
      </header>

      <div className={marketStyles.stack}>
        <section className={styles.panel} aria-labelledby="search-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="search-heading">
              Symbol search
            </h2>
          </header>
          <SymbolSearch
            onSubmitSymbol={(symbol) => navigate(symbolPath(symbol))}
          />
        </section>

        <section className={styles.panel} aria-labelledby="overview-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="overview-heading">
              Overview
            </h2>
          </header>

          {quotes.isPending ? (
            <StateNotice tone="loading" title="Loading quotes…" />
          ) : null}

          {quoteError !== null ? (
            <StateNotice
              tone="error"
              title={quoteError.title}
              description={quoteError.description}
              onRetry={
                quoteError.retryable
                  ? () => {
                      void quotes.refetch()
                    }
                  : undefined
              }
            />
          ) : null}

          {quotes.isSuccess && list.length === 0 ? (
            <StateNotice
              title="No quotes available"
              description="The market data provider returned no quotes for its default symbols."
            />
          ) : null}

          {list.length > 0 ? (
            <div className={marketStyles.quoteGrid}>
              {list.map((quote) => (
                <QuoteCard key={quote.symbol} quote={quote} />
              ))}
            </div>
          ) : null}
        </section>

        {featured !== null ? (
          <section className={styles.panel} aria-labelledby="rsi-heading">
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle} id="rsi-heading">
                RSI · {featured}
              </h2>
            </header>

            {rsi.isPending ? (
              <StateNotice tone="loading" title="Loading RSI…" />
            ) : null}

            {rsiError !== null ? (
              <StateNotice
                tone="error"
                title={rsiError.title}
                description={rsiError.description}
                onRetry={
                  rsiError.retryable
                    ? () => {
                        void rsi.refetch()
                      }
                    : undefined
                }
              />
            ) : null}

            {rsi.data !== undefined ? (
              <div className={marketStyles.indicatorCard}>
                <h3 className={styles.cardLabel}>Relative Strength Index</h3>
                <p className={marketStyles.indicatorValue}>
                  {formatIndicator(rsi.data.rsi)}
                </p>
                <p className={marketStyles.indicatorHint}>
                  {RSI_STATUS_LABEL[rsi.data.status]} — a reading of past momentum
                  on a 0–100 scale, not a recommendation.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  )
}

/**
 * `/app/markets/:symbol` — one symbol in full.
 *
 * The URL is the single source of the selected symbol, so the view is
 * linkable and survives a reload. An unusable symbol in the URL is reported
 * without issuing a request the API would reject.
 */
export function SymbolDetailPage() {
  const params = useParams<{ symbol: string }>()
  const raw = params.symbol ?? ''
  const symbol = normalizeSymbol(raw)

  if (symbol === '' || !isValidSymbol(symbol)) {
    return <InvalidSymbolState raw={raw} />
  }

  // `key` remounts the view per symbol, so switching symbols resets the chart
  // range rather than carrying the previous symbol's range across.
  return <SymbolDetail key={symbol} symbol={symbol} />
}

function InvalidSymbolState({ raw }: { raw: string }) {
  const navigate = useNavigate()

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>That symbol is not valid</h1>
        <p className={styles.subtitle}>
          “{raw}” cannot be looked up. {SYMBOL_FORMAT_HINT}
        </p>
      </header>

      <div className={marketStyles.stack}>
        <section className={styles.panel} aria-labelledby="search-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="search-heading">
              Try another symbol
            </h2>
          </header>
          <SymbolSearch
            onSubmitSymbol={(symbol) => navigate(symbolPath(symbol))}
          />
        </section>
      </div>
    </>
  )
}

function SymbolDetail({ symbol }: { symbol: string }) {
  const navigate = useNavigate()
  const [days, setDays] = useState<number>(DEFAULT_RANGE_DAYS)

  const quotes = useQuotes([symbol])
  const candles = useCandles(symbol, days)
  const analysis = useTechnicalAnalysis(symbol)
  const signal = useSignal(symbol)

  const list = quotes.data ?? []
  const quote = list.length > 0 ? list[0] : null
  const candleList = candles.data ?? []

  const quoteError =
    quotes.error !== null ? describeMarketError(quotes.error) : null
  const candleError =
    candles.error !== null ? describeMarketError(candles.error) : null
  const analysisError =
    analysis.error !== null ? describeMarketError(analysis.error) : null
  const signalError =
    signal.error !== null ? describeMarketError(signal.error) : null

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>{symbol}</h1>
        <p className={styles.subtitle}>
          Latest quote, price history, indicators and the generated signal.
        </p>
      </header>

      <div className={marketStyles.stack}>
        <section className={styles.panel} aria-labelledby="search-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="search-heading">
              Symbol search
            </h2>
          </header>
          <SymbolSearch
            initialValue={symbol}
            onSubmitSymbol={(next) => navigate(symbolPath(next))}
          />
        </section>

        <section className={styles.panel} aria-labelledby="quote-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="quote-heading">
              Latest quote
            </h2>
          </header>

          {quotes.isPending ? (
            <StateNotice tone="loading" title="Loading quote…" />
          ) : null}

          {quoteError !== null ? (
            <StateNotice
              tone="error"
              title={quoteError.title}
              description={quoteError.description}
              onRetry={
                quoteError.retryable
                  ? () => {
                      void quotes.refetch()
                    }
                  : undefined
              }
            />
          ) : null}

          {quotes.isSuccess && quote === null ? (
            <StateNotice
              title="No quote available"
              description={`The provider returned no quote for ${symbol}.`}
            />
          ) : null}

          {quote !== null ? <QuoteSummary quote={quote} /> : null}
        </section>

        <section className={styles.panel} aria-labelledby="chart-heading">
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle} id="chart-heading">
              Price history
            </h2>
            <RangeSelector
              value={days}
              onChange={setDays}
              disabled={candles.isFetching}
            />
          </header>

          {candles.isPending ? (
            <StateNotice tone="loading" title="Loading price history…" />
          ) : null}

          {candleError !== null ? (
            <StateNotice
              tone="error"
              title={candleError.title}
              description={candleError.description}
              onRetry={
                candleError.retryable
                  ? () => {
                      void candles.refetch()
                    }
                  : undefined
              }
            />
          ) : null}

          {candles.isSuccess && candleList.length === 0 ? (
            <StateNotice
              title="No price history"
              description={`The provider returned no daily candles for ${symbol}.`}
            />
          ) : null}

          {candleList.length > 0 ? (
            <Suspense
              fallback={
                <StateNotice tone="loading" title="Loading chart…" />
              }
            >
              <PriceChart candles={candleList} />
            </Suspense>
          ) : null}
        </section>

        <div className={marketStyles.split}>
          <section className={styles.panel} aria-labelledby="indicators-heading">
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle} id="indicators-heading">
                Indicators
              </h2>
            </header>

            {analysis.isPending ? (
              <StateNotice tone="loading" title="Loading indicators…" />
            ) : null}

            {analysisError !== null ? (
              <StateNotice
                tone="error"
                title={analysisError.title}
                description={analysisError.description}
                onRetry={
                  analysisError.retryable
                    ? () => {
                        void analysis.refetch()
                      }
                    : undefined
                }
              />
            ) : null}

            {analysis.data !== undefined ? (
              <IndicatorPanel analysis={analysis.data} />
            ) : null}
          </section>

          <section className={styles.panel} aria-labelledby="signal-heading">
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle} id="signal-heading">
                Signal
              </h2>
            </header>

            {signal.isPending ? (
              <StateNotice tone="loading" title="Loading signal…" />
            ) : null}

            {signalError !== null ? (
              <StateNotice
                tone="error"
                title={signalError.title}
                description={signalError.description}
                onRetry={
                  signalError.retryable
                    ? () => {
                        void signal.refetch()
                      }
                    : undefined
                }
              />
            ) : null}

            {signal.data !== undefined ? (
              <SignalPanel result={signal.data} />
            ) : null}
          </section>
        </div>
      </div>
    </>
  )
}
