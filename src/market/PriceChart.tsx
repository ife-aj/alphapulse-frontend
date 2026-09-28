import { useEffect, useMemo, useRef } from 'react'
import { CandlestickSeries, createChart } from 'lightweight-charts'
import type {
  CandlestickData,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts'
import type { Candle } from '../api/types'
import {
  formatPrice,
  formatSignedPercent,
  formatTradingDay,
  formatVolume,
} from './format'
import styles from './market.module.css'

interface ChartSummary {
  count: number
  from: string
  to: string
  low: number
  high: number
  latestClose: number
  latestVolume: number
  periodChangePercent: number
}

function summarize(sorted: readonly Candle[]): ChartSummary | null {
  if (sorted.length === 0) return null

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  let low = first.low
  let high = first.high
  for (const candle of sorted) {
    if (candle.low < low) low = candle.low
    if (candle.high > high) high = candle.high
  }

  return {
    count: sorted.length,
    from: first.date,
    to: last.date,
    low,
    high,
    latestClose: last.close,
    latestVolume: last.volume,
    periodChangePercent:
      first.close === 0 ? 0 : ((last.close - first.close) / first.close) * 100,
  }
}

/**
 * Daily candlestick chart.
 *
 * Data is drawn oldest-first, which is both what the API returns and what
 * lightweight-charts requires — the dates are re-sorted defensively, which is a
 * no-op when they already ascend but prevents an unreadable chart if they do not.
 *
 * Resizing is handled by the library's own `autoSize`, so the chart follows its
 * container without a manual observer, and `chart.remove()` on unmount releases
 * the canvas and its listeners.
 *
 * This module is the lazy boundary for lightweight-charts: it is imported with
 * `lazy()` so the library stays out of the initial bundle. Anything shared with
 * the chart's container belongs in `RangeSelector.tsx` instead, or importing it
 * would pull the library back in.
 */
export function PriceChart({ candles }: { candles: readonly Candle[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const seriesData = useMemo<CandlestickData<Time>[]>(
    () =>
      [...candles]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((candle) => ({
          time: candle.date as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })),
    [candles],
  )

  const sorted = useMemo(
    () => [...candles].sort((a, b) => a.date.localeCompare(b.date)),
    [candles],
  )
  const summary = useMemo(() => summarize(sorted), [sorted])

  // Create the chart once; data is applied by the effect below.
  useEffect(() => {
    const container = containerRef.current
    if (container === null) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: '#93a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.045)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.045)' },
      },
      rightPriceScale: { borderColor: '#1f2a38' },
      timeScale: { borderColor: '#1f2a38', fixLeftEdge: true },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#2ee6a8',
      downColor: '#ff6b6b',
      borderUpColor: '#2ee6a8',
      borderDownColor: '#ff6b6b',
      wickUpColor: '#2ee6a8',
      wickDownColor: '#ff6b6b',
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chartRef.current = null
      seriesRef.current = null
      chart.remove()
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (chart === null || series === null) return

    series.setData(seriesData)
    chart.timeScale().fitContent()
  }, [seriesData])

  const summaryLabel =
    summary === null
      ? 'Candlestick chart with no data.'
      : `Candlestick chart of ${summary.count} trading days, ` +
        `${formatTradingDay(summary.from)} to ${formatTradingDay(summary.to)}. ` +
        `Period low ${formatPrice(summary.low)}, high ${formatPrice(summary.high)}, ` +
        `latest close ${formatPrice(summary.latestClose)}, ` +
        `latest volume ${formatVolume(summary.latestVolume)}.`

  return (
    <div className={styles.chartWrap}>
      {/* The canvas is visual only; the label and the summary below carry the
          same information as text. */}
      <div
        ref={containerRef}
        className={styles.chartCanvas}
        role="img"
        aria-label={summaryLabel}
      />

      {summary !== null ? (
        <p className={styles.chartSummary}>
          {summary.count} trading days, from{' '}
          <strong>{formatTradingDay(summary.from)}</strong> to{' '}
          <strong>{formatTradingDay(summary.to)}</strong>. Period low{' '}
          <strong>{formatPrice(summary.low)}</strong>, high{' '}
          <strong>{formatPrice(summary.high)}</strong>. Latest close{' '}
          <strong>{formatPrice(summary.latestClose)}</strong>, a change of{' '}
          <strong>{formatSignedPercent(summary.periodChangePercent)}</strong>{' '}
          across the period. Latest volume{' '}
          <strong>{formatVolume(summary.latestVolume)}</strong>.
        </p>
      ) : null}
    </div>
  )
}
