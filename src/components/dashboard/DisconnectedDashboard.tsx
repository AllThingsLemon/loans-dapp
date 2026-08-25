'use client'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import {
  BadgeCheck,
  CircleDollarSign,
  FileSignature,
  Percent,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  Zap
} from 'lucide-react'

/**
 * Marketing figures, not protocol data.
 *
 * The APR schedule below is the published rate card from the lemloans.io
 * marketing site (lem-loans repo, CalculatorSection), shown here so a visitor
 * can size up the product before connecting. The rates a borrower is actually
 * offered come from `getAllInterestAprConfigs` on-chain and are shown in the
 * connected calculator — keep the two in step by hand when the model changes.
 */
const APR_SCHEDULE = [
  { term: '3 months', apr: '18%' },
  { term: '6 months', apr: '16%' },
  { term: '9 months', apr: '14%' },
  { term: '12 months', apr: '13%' },
  { term: '18 months', apr: '11.5%' },
  { term: '24 months', apr: '10%' },
  { term: '30 months', apr: '9%' },
  { term: '36 months', apr: '8%' },
  { term: '42 months', apr: '7%' },
  { term: '48 months', apr: '6%' },
  { term: '54 months', apr: '5.5%' },
  { term: '60 months', apr: '5%' }
] as const

/** Lifted from the marketing site's FeaturesSection, tightened for pillars. */
const PILLARS = [
  {
    Icon: BadgeCheck,
    title: 'No Credit Checks.',
    lines: ['Your crypto is your credit.', 'Instant stablecoin liquidity.']
  },
  {
    Icon: Zap,
    title: 'Keep Your Crypto.',
    lines: ['Borrow without selling.', 'Stay invested long term.']
  },
  {
    Icon: ShieldCheck,
    title: 'Transparent Fees.',
    lines: ['Low setup fees paid in LMLN.', 'No hidden costs.']
  }
] as const

/** The actual flow of the connected dapp, step by step. */
const STEPS = [
  {
    Icon: Wallet,
    title: 'Connect your wallet',
    detail:
      'Connect the wallet holding your collateral. No sign-up, no credit check — the protocol only needs your address.'
  },
  {
    Icon: SlidersHorizontal,
    title: 'Choose your terms',
    detail:
      'Pick the amount, duration and loan-to-value ratio in the calculator. Lower LTV means more collateral backing the loan — and a lower origination fee.'
  },
  {
    Icon: FileSignature,
    title: 'Approve and sign',
    detail:
      'Approve the collateral transfer and the origination fee (paid in LMLN), then confirm the loan transaction. Every term is fixed on-chain before you sign.'
  },
  {
    Icon: CircleDollarSign,
    title: 'Receive funds and repay',
    detail:
      'Stablecoin lands in your wallet instantly. Make interest payments over the term, settle the balance at the end, and your collateral is returned in full.'
  }
] as const

const TRIPLET_ROW =
  'grid w-full grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700'

const HEAD_CELL =
  'px-3 py-3 text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-xs'

const CELL = 'px-3 py-2.5 text-center text-[11px] sm:text-sm'

export function DisconnectedDashboard() {
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
          Borrow Against Your Crypto
        </h2>
        <p className='max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400'>
          Secure stablecoin loans using your crypto as collateral — fund your
          goals without selling your position.
        </p>
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

      {/* ── Steps to get a loan ──────────────────────────────────── */}
      <section className='w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900'>
        <h3 className='text-left text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100'>
          HOW TO GET A LOAN
        </h3>
        <p className='text-left text-sm font-medium italic text-gray-500 dark:text-gray-400'>
          Simple process, instant results — four steps from wallet to funds
        </p>

        <ol className='mt-6 grid gap-4 text-left sm:grid-cols-2'>
          {STEPS.map(({ Icon, title, detail }, index) => (
            <li
              key={title}
              className='flex gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60'
            >
              <div className='flex flex-col items-center gap-2'>
                <span
                  aria-hidden='true'
                  className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-extrabold text-black'
                >
                  {index + 1}
                </span>
                <Icon
                  className='h-5 w-5 text-yellow-500'
                  strokeWidth={1.75}
                  aria-hidden='true'
                />
              </div>
              <div>
                <h4 className='font-bold text-gray-900 dark:text-gray-100'>
                  {title}
                </h4>
                <p className='mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm dark:text-gray-400'>
                  {detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── APR schedule ─────────────────────────────────────────── */}
      <section className='w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex items-center justify-center gap-3 sm:justify-start'>
          <Percent
            className='h-8 w-8 shrink-0 text-yellow-500'
            strokeWidth={2}
          />
          <div className='text-left'>
            <h3 className='text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100'>
              APR BY LOAN TERM
            </h3>
            <p className='text-sm font-medium italic text-gray-500 dark:text-gray-400'>
              Longer terms earn lower rates — published rate card
            </p>
          </div>
        </div>

        {/* Two six-row halves side by side: the full 12-row schedule stays
            visible without a tall single column on desktop, and the halves
            stack naturally on narrow screens. */}
        <div className='mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2'>
          {[APR_SCHEDULE.slice(0, 6), APR_SCHEDULE.slice(6)].map(
            (half, halfIndex) => (
              <div key={halfIndex} className='overflow-x-auto'>
                <table className='w-full border-collapse overflow-hidden rounded-lg'>
                  <thead>
                    <tr className='bg-gray-900 text-yellow-400'>
                      <th className={HEAD_CELL}>Loan Term</th>
                      <th className={HEAD_CELL}>Estimated APR</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                    {half.map((row) => (
                      <tr key={row.term} className='bg-white dark:bg-gray-900'>
                        <td
                          className={`${CELL} font-bold uppercase text-yellow-600 dark:text-yellow-500`}
                        >
                          {row.term}
                        </td>
                        <td
                          className={`${CELL} font-bold tabular-nums text-green-700 dark:text-green-400`}
                        >
                          {row.apr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        <p className='mt-4 text-left text-[10px] leading-relaxed text-gray-500 sm:text-xs dark:text-gray-400'>
          *Estimated APRs are the published rate schedule and may change.
          Actual rates, fees, and available terms come from the on-chain
          protocol configuration and are shown in the loan calculator before
          you sign. An origination fee, based on the chosen loan-to-value
          ratio, is payable in LMLN. Collateral is locked for the life of the
          loan and may be liquidated if the loan defaults.
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
    </div>
  )
}
