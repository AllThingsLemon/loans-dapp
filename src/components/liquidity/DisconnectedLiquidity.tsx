'use client'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useThirtyDayReturns } from '@/src/hooks/liquidity/useThirtyDayReturns'
import { formatReturnPct } from '@/src/utils/returns'
import {
  BarChart3,
  Coins,
  FileLock2,
  Lock,
  PieChart,
  Search,
  ShieldCheck,
  Users,
  Wallet
} from 'lucide-react'

/**
 * The weight/lock structure mirrors the approved design's model tiers — the
 * lock tiers a depositor can actually pick, and their real interest
 * multipliers, come from `getAssetLockTiers` on the connected view. Keep the
 * two in step by hand when the model changes.
 *
 * The return figures — the headline above the table AND the per-tier column —
 * are live protocol data (see useThirtyDayReturns). Each tier's return is
 * mult × the 1.00x base rate: interest is distributed per interest share and
 * a deposit's interest shares are principal × multiplier, so the multiplier
 * IS the tier's earnings scale. The share-weighted average of the tier rows
 * equals the headline figure by construction.
 */
const RETURN_MODEL = [
  { period: '1 Year', multiplier: '1.00x', mult: 1.0, lock: '0 – 1 Year' },
  { period: '2 Years', multiplier: '1.25x', mult: 1.25, lock: '1 – 2 Years' },
  { period: '3 Years', multiplier: '1.50x', mult: 1.5, lock: '2 – 3 Years' },
  { period: '4 Years', multiplier: '1.75x', mult: 1.75, lock: '3 – 4 Years' },
  { period: '5 Years', multiplier: '2.00x', mult: 2.0, lock: '4 – 5 Years' },
  { period: '10 Years', multiplier: '3.00x', mult: 3.0, lock: '5 – 10 Years' }
] as const

const PILLARS = [
  {
    Icon: ShieldCheck,
    title: 'Overcollateralized Lending.',
    lines: ['Risk controlled on chain.', 'Every loan is backed by collateral.']
  },
  {
    Icon: FileLock2,
    title: 'Smart Contract Execution.',
    lines: ['No intermediaries.', 'Fully on-chain.']
  },
  {
    Icon: Search,
    title: 'Transparent, Auditable, On-Chain.',
    lines: ['Live data.', 'Verifiable anytime.']
  }
] as const

const ASSURANCES = [
  {
    Icon: PieChart,
    headline: '~90%',
    label: 'Average Utilization',
    lines: []
  },
  {
    Icon: Users,
    headline: null,
    label: 'Collateralized Borrowers',
    lines: ['Built for broad participation.', 'Requirements enforced on-chain.']
  },
  {
    Icon: Lock,
    headline: null,
    label: 'Decentralized by design',
    lines: ['Protocol risk controls.']
  }
] as const

/**
 * Official token artwork from CoinMarketCap's logo CDN, committed to
 * public/images/tokens rather than hotlinked: next/image has no remote host
 * configured, and a third-party CDN is not something a landing page should be
 * unable to render without. LEMX comes from CoinGecko: CoinMarketCap does not
 * appear to list it, and its own app icon is a different mark from the token's.
 */
const SUPPORTED_ASSETS = [
  { symbol: 'BTC', src: '/images/tokens/btc.png' },
  { symbol: 'ETH', src: '/images/tokens/eth.png' },
  { symbol: 'BNB', src: '/images/tokens/bnb.png' },
  { symbol: 'SOL', src: '/images/tokens/sol.png' },
  { symbol: 'XRP', src: '/images/tokens/xrp.png' },
  { symbol: 'ADA', src: '/images/tokens/ada.png' },
  { symbol: 'AVAX', src: '/images/tokens/avax.png' },
  { symbol: 'DOT', src: '/images/tokens/dot.png' },
  { symbol: 'ATOM', src: '/images/tokens/atom.png' },
  { symbol: 'LEMX', src: '/images/tokens/lemx.png' },
  { symbol: 'USDT', src: '/images/tokens/usdt.png' }
] as const

const COLUMNS = [
  { label: 'Time Period', sub: null },
  { label: 'Weight', sub: '(Multiplier)' },
  { label: 'Lock Duration', sub: '(Years)' },
  { label: 'Actual Return', sub: '(Last 30 Days)' }
] as const

const HEAD_CELL =
  'px-1.5 py-2.5 text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:px-3 sm:py-3 sm:text-xs'

const CELL = 'px-1.5 py-3 text-center text-[11px] sm:px-3 sm:text-sm'

/** The two three-across rows that bracket the returns panel share this shape. */
const TRIPLET_ROW =
  'grid w-full grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700'

export function DisconnectedLiquidity() {
  const { openConnectModal } = useConnectModal()
  const { data: returns, isLoading: returnsLoading } = useThirtyDayReturns()

  return (
    <div className='mx-auto flex max-w-4xl flex-col items-center gap-10 py-4 text-center'>
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <div className='flex flex-col items-center gap-3'>
        <div className='flex items-center gap-4'>
          <Image
            src='/images/lemloans-logo.png'
            alt='LemLoans Logo'
            width={80}
            height={80}
            className='h-14 w-14 sm:h-20 sm:w-20'
            priority
          />
          <h1 className='text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-gray-100'>
            LemLoans
          </h1>
        </div>
        <h2 className='text-2xl font-semibold text-gray-700 sm:text-3xl dark:text-gray-300'>
          Become a Liquidity Provider
        </h2>
      </div>

      {/* ── Three pillars ────────────────────────────────────────── */}
      <div className={TRIPLET_ROW}>
        {PILLARS.map(({ Icon, title, lines }) => (
          <div
            key={title}
            className='flex flex-col items-center gap-2 px-1.5 sm:gap-3 sm:px-6'
          >
            <Icon
              className='h-7 w-7 text-yellow-500 sm:h-10 sm:w-10'
              strokeWidth={1.75}
            />
            <h3 className='text-[11px] font-bold leading-snug text-gray-900 sm:text-base dark:text-gray-100'>
              {title}
            </h3>
            <p className='text-[10px] leading-relaxed text-gray-600 sm:text-sm dark:text-gray-400'>
              {lines.map((line) => (
                <span key={line} className='block'>
                  {line}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      {/* ── Measured returns ─────────────────────────────────────── */}
      <section className='w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex items-center justify-center gap-3 sm:justify-start'>
          <BarChart3
            className='h-8 w-8 shrink-0 text-yellow-500'
            strokeWidth={2}
          />
          <div className='text-left'>
            <h3 className='text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100'>
              PROTOCOL RETURNS
            </h3>
            <p className='text-sm font-medium italic text-gray-500 dark:text-gray-400'>
              Measured From Live On-Chain Activity
            </p>
          </div>
        </div>

        {/* The headline figure is REAL protocol data (30-day interest over
            total pool shares); the tier rows scale the measured base rate by
            each multiplier. See useThirtyDayReturns for the share math. */}
        <div className='mt-5 rounded-lg bg-gray-900 px-4 py-4 text-center'>
          <div className='text-[10px] font-bold uppercase tracking-wide text-yellow-400 sm:text-xs'>
            Actual Average Return · Last 30 Days
          </div>
          <div className='mt-1 text-3xl font-extrabold tabular-nums text-green-400 sm:text-4xl'>
            {returnsLoading ? '…' : formatReturnPct(returns?.avgPct)}
          </div>
          <div className='mt-1 text-[10px] text-gray-400 sm:text-xs'>
            Interest payments ÷ total pool shares, read from the protocol
            contracts
          </div>
        </div>

        {/* The table is sized to fit all four columns down to ~430px rather
            than scroll — clipping the return column defeats the point of the
            panel. overflow-x-auto is the backstop below that, so an unusually
            narrow screen scrolls the table and never the page. */}
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full border-collapse overflow-hidden rounded-lg'>
            <thead>
              <tr className='bg-gray-900 text-yellow-400'>
                {COLUMNS.map(({ label, sub }) => (
                  <th key={label} className={HEAD_CELL}>
                    {label}
                    {sub && <span className='block font-semibold'>{sub}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
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
                    className={`${CELL} font-medium uppercase text-gray-800 dark:text-gray-200`}
                  >
                    {row.lock}
                  </td>
                  <td
                    className={`${CELL} font-bold tabular-nums text-green-700 dark:text-green-400`}
                  >
                    {returnsLoading
                      ? '…'
                      : formatReturnPct(
                          returns?.basePct != null
                            ? returns.basePct * row.mult
                            : null
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deliberately set smaller than the table it sits under: it has to be
            present and readable without competing with the figures above. */}
        <p className='mt-4 text-left text-[10px] leading-relaxed text-gray-500 sm:text-xs dark:text-gray-400'>
          Returns are measured from actual on-chain interest payments relative
          to pool shares over the stated period. Per-tier figures scale the
          measured base rate by each tier&apos;s interest-share multiplier —
          longer locks receive proportionally more of the same distributed
          interest. Past performance does not guarantee future results. Actual
          protocol outcomes depend on borrower demand, utilization, collateral
          performance, market conditions, refinancing activity, smart-contract
          execution and other factors. Digital assets deposited into the
          protocol may lose value, including the possible loss of some or all
          assets supplied.
        </p>
      </section>

      {/* ── Supported assets ─────────────────────────────────────── */}
      <section className='w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex flex-wrap items-center justify-center gap-3 sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Coins
              className='h-7 w-7 shrink-0 text-yellow-500 sm:h-8 sm:w-8'
              strokeWidth={2}
            />
            <h3 className='text-left text-base font-extrabold tracking-tight text-gray-900 sm:text-xl dark:text-gray-100'>
              SUPPORTED ASSETS ON BSC (BEP-20)
            </h3>
          </div>
          <span className='rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:text-xs dark:bg-gray-800 dark:text-gray-300'>
            {SUPPORTED_ASSETS.length - 1} Assets + USDT
          </span>
        </div>

        <ul className='mt-5 grid grid-cols-6 gap-y-4 sm:flex sm:flex-wrap sm:justify-between sm:gap-y-5'>
          {SUPPORTED_ASSETS.map(({ symbol, src }) => (
            <li key={symbol} className='flex flex-col items-center gap-1.5'>
              <Image
                src={src}
                alt=''
                width={44}
                height={44}
                aria-hidden='true'
                className='h-9 w-9 rounded-full object-contain sm:h-11 sm:w-11'
              />
              <span className='text-[10px] font-bold text-gray-700 sm:text-xs dark:text-gray-300'>
                {symbol}
              </span>
            </li>
          ))}
        </ul>

        <div className='mt-5 space-y-2 text-center text-[10px] text-gray-500 sm:text-xs dark:text-gray-400'>
          <p>All assets are accepted as BEP-20 tokens on BNB Smart Chain.</p>
          <p>
            Where an underlying asset is not native to BSC, its approved wrapped
            or pegged BEP-20 representation may be used. Eligible collateral is
            enabled according to protocol-defined risk, liquidity, and
            collateral parameters.
          </p>
        </div>
      </section>

      {/* ── Call to action ───────────────────────────────────────── */}
      <button
        type='button'
        onClick={openConnectModal}
        disabled={!openConnectModal}
        className='flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60'
      >
        <Wallet className='h-5 w-5' strokeWidth={2} />
        Connect Wallet
      </button>

      {/* ── Assurances ───────────────────────────────────────────── */}
      <div className={TRIPLET_ROW}>
        {ASSURANCES.map(({ Icon, headline, label, lines }) => (
          <div
            key={label}
            className='flex flex-col items-center gap-1.5 px-1.5 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-6 sm:text-left'
          >
            <Icon
              className='h-7 w-7 shrink-0 text-yellow-500 sm:h-10 sm:w-10'
              strokeWidth={1.75}
            />
            <div>
              {headline && (
                <div className='text-lg font-extrabold leading-none text-gray-900 sm:text-2xl dark:text-gray-100'>
                  {headline}
                </div>
              )}
              <div className='text-[10px] font-bold uppercase leading-tight text-gray-900 sm:text-sm dark:text-gray-100'>
                {label}
              </div>
              {lines.map((line) => (
                <div
                  key={line}
                  className='text-[10px] leading-tight text-gray-600 sm:text-sm dark:text-gray-400'
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
