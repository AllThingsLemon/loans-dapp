'use client'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
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
 * Marketing figures, not protocol data.
 *
 * These are the "current model assumptions" from the approved design — they are
 * projections, not anything readable from chain, so they are hardcoded here on
 * purpose rather than dressed up as live values. The lock tiers a depositor can
 * actually pick, and their real interest multipliers, come from
 * `getAssetLockTiers` on the connected view. Keep the two in step by hand when
 * the model changes.
 */
const RETURN_MODEL = [
  {
    period: '1 Year',
    multiplier: '1.00x',
    lock: '0 – 1 Year',
    total: '28% – 35%'
  },
  {
    period: '2 Years',
    multiplier: '1.25x',
    lock: '1 – 2 Years',
    total: '70% – 90%'
  },
  {
    period: '3 Years',
    multiplier: '1.50x',
    lock: '2 – 3 Years',
    total: '130% – 170%'
  },
  {
    period: '4 Years',
    multiplier: '1.75x',
    lock: '3 – 4 Years',
    total: '220% – 280%'
  },
  {
    period: '5 Years',
    multiplier: '2.00x',
    lock: '4 – 5 Years',
    total: '350% – 500%'
  }
] as const

const PILLARS = [
  {
    Icon: ShieldCheck,
    title: 'Overcollateralized Protection.',
    lines: ['Capital is protected.', 'Built to safeguard.']
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
    label: 'Institutional Borrowers',
    lines: ['High quality.', 'Vetted.']
  },
  {
    Icon: Lock,
    headline: null,
    label: 'Built for Safety',
    lines: ['Capital security', 'is our priority.']
  }
] as const

/**
 * Token marks are drawn inline rather than shipped as image files: the repo
 * carries no token artwork, next/image has no remote host configured, and
 * bundling third-party brand assets carries a licensing question this page
 * doesn't need to answer. Each is the token's brand colour with a simple
 * geometric mark, and the ticker sits directly beneath, so they read
 * unambiguously at 36px. Swap in official artwork here if it's ever supplied.
 */
const g = (d: string) => (
  <svg viewBox='0 0 32 32' className='h-5 w-5 sm:h-6 sm:w-6' fill='#fff'>
    <path d={d} />
  </svg>
)
const letter = (ch: string) => (
  <span className='text-sm font-black text-white sm:text-base'>{ch}</span>
)

const SUPPORTED_ASSETS = [
  { symbol: 'BTC', bg: '#F7931A', mark: letter('B') },
  // octahedron: two stacked triangles
  {
    symbol: 'ETH',
    bg: '#627EEA',
    mark: g('M16 4l7 12-7 4-7-4 7-12zm0 22l7-9-7 4-7-4 7 9z')
  },
  {
    symbol: 'BNB',
    bg: '#F3BA2F',
    mark: g(
      'M16 6l4 4-4 4-4-4 4-4zm-7 7l3 3-3 3-3-3 3-3zm14 0l3 3-3 3-3-3 3-3zm-7 5l4 4-4 4-4-4 4-4z'
    )
  },
  // three slanted bars
  {
    symbol: 'SOL',
    bg: '#9945FF',
    mark: g('M10 8h16l-4 4H6zm0 6h16l-4 4H6zm0 6h16l-4 4H6z')
  },
  {
    symbol: 'XRP',
    bg: '#23292F',
    mark: g('M9 8l7 7 7-7h4l-9 9 9 9h-4l-7-7-7 7H5l9-9-9-9h4z')
  },
  // cluster of dots
  {
    symbol: 'ADA',
    bg: '#0033AD',
    mark: g(
      'M16 13a3 3 0 110 6 3 3 0 010-6zM8 9a2 2 0 110 4 2 2 0 010-4zm16 0a2 2 0 110 4 2 2 0 010-4zM8 19a2 2 0 110 4 2 2 0 010-4zm16 0a2 2 0 110 4 2 2 0 010-4zM16 5a2 2 0 110 4 2 2 0 010-4zm0 18a2 2 0 110 4 2 2 0 010-4z'
    )
  },
  { symbol: 'AVAX', bg: '#E84142', mark: g('M16 7l9 17H7l9-17z') },
  {
    symbol: 'DOT',
    bg: '#E6007A',
    mark: g('M16 9a4 4 0 110 8 4 4 0 010-8zm0 11a3 3 0 110 6 3 3 0 010-6z')
  },
  {
    symbol: 'ATOM',
    bg: '#2E3148',
    mark: (
      <svg
        viewBox='0 0 32 32'
        className='h-5 w-5 sm:h-6 sm:w-6'
        fill='none'
        stroke='#fff'
        strokeWidth='2'
      >
        <circle cx='16' cy='16' r='2.5' fill='#fff' stroke='none' />
        <ellipse cx='16' cy='16' rx='11' ry='4.5' />
        <ellipse
          cx='16'
          cy='16'
          rx='11'
          ry='4.5'
          transform='rotate(60 16 16)'
        />
        <ellipse
          cx='16'
          cy='16'
          rx='11'
          ry='4.5'
          transform='rotate(120 16 16)'
        />
      </svg>
    )
  },
  { symbol: 'LEMX', bg: '#F5B301', mark: letter('L') },
  { symbol: 'USDT', bg: '#26A17B', mark: letter('T') }
] as const

const COLUMNS = [
  { label: 'Time Period', sub: null },
  { label: 'Weight', sub: '(Multiplier)' },
  { label: 'Lock Duration', sub: '(Years)' },
  { label: 'Estimated Total', sub: 'Return* (%)' }
] as const

const HEAD_CELL =
  'px-1.5 py-2.5 text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:px-3 sm:py-3 sm:text-xs'

const CELL = 'px-1.5 py-3 text-center text-[11px] sm:px-3 sm:text-sm'

/** The two three-across rows that bracket the returns panel share this shape. */
const TRIPLET_ROW =
  'grid w-full grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700'

export function DisconnectedLiquidity() {
  const { openConnectModal } = useConnectModal()

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

      {/* ── Estimated returns ────────────────────────────────────── */}
      <section className='w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex items-center justify-center gap-3 sm:justify-start'>
          <BarChart3
            className='h-8 w-8 shrink-0 text-yellow-500'
            strokeWidth={2}
          />
          <div className='text-left'>
            <h3 className='text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100'>
              ESTIMATED RETURNS
            </h3>
            <p className='text-sm font-medium italic text-gray-500 dark:text-gray-400'>
              (Current Model Assumptions)
            </p>
          </div>
        </div>

        {/* The table is sized to fit all four columns down to ~430px rather
            than scroll — clipping the return column defeats the point of the
            panel. overflow-x-auto is the backstop below that, so an unusually
            narrow screen scrolls the table and never the page. */}
        <div className='mt-5 overflow-x-auto'>
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
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deliberately set smaller than the table it sits under: it has to be
            present and readable without competing with the figures above. */}
        <p className='mt-4 text-left text-[10px] leading-relaxed text-gray-500 sm:text-xs dark:text-gray-400'>
          Illustrative outcomes are model-generated and are not promised or
          guaranteed. Actual protocol outcomes depend on borrower demand,
          utilization, collateral performance, market conditions, refinancing
          activity, smart-contract execution and other factors. Digital assets
          deposited into the protocol may lose value, including the possible
          loss of some or all assets supplied.
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
          {SUPPORTED_ASSETS.map(({ symbol, bg, mark }) => (
            <li key={symbol} className='flex flex-col items-center gap-1.5'>
              <span
                className='flex h-9 w-9 items-center justify-center rounded-full sm:h-11 sm:w-11'
                style={{ backgroundColor: bg }}
                aria-hidden='true'
              >
                {mark}
              </span>
              <span className='text-[10px] font-bold text-gray-700 sm:text-xs dark:text-gray-300'>
                {symbol}
              </span>
            </li>
          ))}
        </ul>

        <p className='mt-5 text-center text-[10px] text-gray-500 sm:text-xs dark:text-gray-400'>
          All assets are accepted as BEP-20 tokens on BNB Smart Chain.
        </p>
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
