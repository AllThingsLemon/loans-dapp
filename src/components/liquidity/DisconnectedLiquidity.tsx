'use client'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import {
  BarChart3,
  FileLock2,
  Lock,
  PieChart,
  Search,
  ShieldCheck,
  Users
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

      {/* ── Call to action ───────────────────────────────────────── */}
      <button
        type='button'
        onClick={openConnectModal}
        disabled={!openConnectModal}
        className='w-full max-w-md rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60'
      >
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
