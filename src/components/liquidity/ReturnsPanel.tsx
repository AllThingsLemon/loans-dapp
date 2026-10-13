'use client'
import { useThirtyDayReturns } from '@/src/hooks/liquidity/useThirtyDayReturns'
import { formatReturnPct, formatUsd } from '@/src/utils/returns'
import { BarChart3 } from 'lucide-react'

/**
 * The weight/lock structure mirrors the approved design's model tiers — the
 * lock tiers a depositor can actually pick, and their real interest
 * multipliers, come from `getAssetLockTiers` on the connected view. Keep the
 * two in step by hand when the model changes.
 *
 * The yield and performance figures — the headlines above the table AND the
 * per-tier columns — are live protocol data (see useThirtyDayReturns). Each
 * tier's figure is mult × the 1.00x base rate: interest is distributed per
 * interest share and a deposit's interest shares are principal × multiplier,
 * so the multiplier IS the tier's earnings scale. The deposit-weighted
 * average of each column's tier rows is its headline (for performance,
 * weighted by the lock mix at each distribution).
 */
const RETURN_MODEL = [
  { period: '1 Year', multiplier: '1.00x', mult: 1.0, lock: '0 – 1 Year' },
  { period: '2 Years', multiplier: '1.25x', mult: 1.25, lock: '1 – 2 Years' },
  { period: '3 Years', multiplier: '1.50x', mult: 1.5, lock: '2 – 3 Years' },
  { period: '4 Years', multiplier: '1.75x', mult: 1.75, lock: '3 – 4 Years' },
  { period: '5 Years', multiplier: '2.00x', mult: 2.0, lock: '4 – 5 Years' },
  { period: '10 Years', multiplier: '3.00x', mult: 3.0, lock: '5 – 10 Years' }
] as const

/** Phones drop the lock column; the time period already names the lock. */
const LOCK_COLUMN = 'hidden sm:table-cell'

const COLUMNS = [
  { label: 'Time Period', sub: null, className: '' },
  { label: 'Weight', sub: '(Multiplier)', className: '' },
  { label: 'Lock Duration', sub: '(Years)', className: LOCK_COLUMN },
  { label: 'Current Yield', sub: '(Last 30 Days)', className: '' },
  { label: 'Performance', sub: '(Last 30 Days)', className: '' }
] as const

const HEAD_CELL =
  'px-1.5 py-2.5 text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:px-3 sm:py-3 sm:text-xs'

const CELL = 'px-1.5 py-3 text-center text-[11px] sm:px-3 sm:text-sm'

/** A 30-day figure in the table. */
function FigureCell({
  loading,
  pct
}: {
  loading: boolean
  pct: number | null
}) {
  return (
    <td
      className={`${CELL} font-bold tabular-nums text-green-700 dark:text-green-400`}
    >
      {loading ? '…' : formatReturnPct(pct)}
    </td>
  )
}

/** One of the headline figures above the table. */
function Headline({
  label,
  value,
  children
}: {
  label: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className='rounded-lg bg-gray-900 px-4 py-4 text-center'>
      <div className='text-[10px] font-bold uppercase tracking-wide text-yellow-400 sm:text-xs'>
        {label}
      </div>
      <div className='mt-1 text-3xl font-extrabold tabular-nums text-green-400 sm:text-4xl'>
        {value}
      </div>
      <div className='mt-1 text-[8px] italic text-gray-400 sm:text-[10px]'>
        {children}
      </div>
    </div>
  )
}

/**
 * The measured 30-day returns panel: headline figures over a per-tier table.
 *
 * The disconnected Liquidity page shows Current Yield and Performance side by
 * side. /lending/performance passes showCurrentYield={false} to drop every
 * yield figure — the headline, the table column and its disclaimer sentence —
 * leaving Performance alone.
 */
export function ReturnsPanel({
  showCurrentYield = true
}: {
  showCurrentYield?: boolean
}) {
  const { data: returns, isLoading: returnsLoading } = useThirtyDayReturns()
  const currentYield = returns?.currentYield
  const performance = returns?.performance
  const columns = showCurrentYield
    ? COLUMNS
    : COLUMNS.filter(({ label }) => label !== 'Current Yield')

  return (
    <section className='w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900'>
      <div className='flex items-center justify-center gap-3 sm:justify-start'>
        <BarChart3
          className='h-8 w-8 shrink-0 text-yellow-500'
          strokeWidth={2}
        />
        <div className='text-left'>
          <h3 className='text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100'>
            {showCurrentYield
              ? 'PROTOCOL YIELD & PERFORMANCE'
              : 'PROTOCOL PERFORMANCE'}
          </h3>
          <p className='text-sm font-medium italic text-gray-500 dark:text-gray-400'>
            Measured From Live On-Chain Activity
          </p>
        </div>
      </div>

      {/* Both headlines are REAL protocol data. Current yield: the last 30
          days of interest distributed to the pool over its current deposits.
          Performance: each distribution over the deposits when it was
          paid, added up (time-weighted). The tier columns scale each
          measured base rate by the multiplier. See useThirtyDayReturns. */}
      <div
        className={`mt-5 grid gap-3 ${showCurrentYield ? 'sm:grid-cols-2' : ''}`}
      >
        {showCurrentYield && (
          <Headline
            label='Current Yield · Last 30 Days'
            value={returnsLoading ? '…' : formatReturnPct(currentYield?.avgPct)}
          >
            Interest distributed over the last 30 days ÷ current deposits
            {returns?.distributed != null && (
              <span className='block'>
                Based on {formatUsd(returns.distributed)} distributed
              </span>
            )}
          </Headline>
        )}
        <Headline
          label='Performance · Last 30 Days'
          value={returnsLoading ? '…' : formatReturnPct(performance?.avgPct)}
        >
          Each distribution ÷ deposits when it was paid, added up over the last
          30 days
        </Headline>
      </div>

      {/* The table is sized to fit down to ~375px rather than scroll, with
          the lock column dropped on phones — clipping the figures defeats
          the point of the panel. overflow-x-auto is the backstop below
          that, so an unusually narrow screen scrolls the table and never
          the page. */}
      <div className='mt-4 overflow-x-auto'>
        <table className='w-full border-collapse overflow-hidden rounded-lg'>
          <thead>
            <tr className='bg-gray-900 text-yellow-400'>
              {columns.map(({ label, sub, className }) => (
                <th key={label} className={`${HEAD_CELL} ${className}`}>
                  {label}
                  {sub && <span className='block font-semibold'>{sub}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
            {/* The headlines as a row, so they read against the tiers. */}
            <tr className='bg-gray-50 dark:bg-gray-800'>
              <td
                className={`${CELL} font-bold uppercase text-yellow-600 dark:text-yellow-500`}
              >
                Pool Average
              </td>
              <td
                className={`${CELL} font-bold text-green-700 dark:text-green-400`}
              >
                Avg
              </td>
              <td
                className={`${CELL} ${LOCK_COLUMN} font-medium uppercase text-gray-800 dark:text-gray-200`}
              >
                All Deposits
              </td>
              {showCurrentYield && (
                <FigureCell
                  loading={returnsLoading}
                  pct={currentYield?.avgPct ?? null}
                />
              )}
              <FigureCell
                loading={returnsLoading}
                pct={performance?.avgPct ?? null}
              />
            </tr>
            {RETURN_MODEL.map((row) => (
              <tr key={row.period} className='bg-white dark:bg-gray-900'>
                <td
                  className={`${CELL} font-bold uppercase text-yellow-600 dark:text-yellow-500`}
                >
                  {row.period}
                </td>
                <td
                  className={`${CELL} font-bold tabular-nums text-green-700 dark:text-green-400`}
                >
                  {row.multiplier}
                </td>
                <td
                  className={`${CELL} ${LOCK_COLUMN} font-medium uppercase text-gray-800 dark:text-gray-200`}
                >
                  {row.lock}
                </td>
                {showCurrentYield && (
                  <FigureCell
                    loading={returnsLoading}
                    pct={
                      currentYield?.basePct != null
                        ? currentYield.basePct * row.mult
                        : null
                    }
                  />
                )}
                <FigureCell
                  loading={returnsLoading}
                  pct={
                    performance?.basePct != null
                      ? performance.basePct * row.mult
                      : null
                  }
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deliberately set smaller than the table it sits under: it has to be
          present and readable without competing with the figures above. */}
      <p className='mt-4 text-left text-[10px] leading-relaxed text-gray-500 sm:text-xs dark:text-gray-400'>
        {showCurrentYield && (
          <>
            Current yield is the interest distributed to the pool over the last
            30 days relative to the pool&apos;s current deposits; it changes as
            new loans are made and as deposits enter or leave the pool.{' '}
          </>
        )}
        Performance adds up each distribution in the last 30 days relative to
        the pool&apos;s deposits when it was paid, which is what money held
        through the whole period earned. Per-tier figures scale the measured
        base rate by each tier&apos;s interest-share multiplier — longer locks
        receive proportionally more of the same distributed interest. Past
        performance does not guarantee future results. Actual protocol outcomes
        depend on borrower demand, utilization, collateral performance, market
        conditions, refinancing activity, smart-contract execution and other
        factors. Digital assets deposited into the protocol may lose value,
        including the possible loss of some or all assets supplied.
      </p>
    </section>
  )
}
