/**
 * Effective loan timing: when a loan defaults (useLoans' status override)
 * and what each active loan's countdown counts to (the ActiveLoans cards and
 * their sort order). Kept pure so the exact moments are unit-testable.
 */

import { LOAN_STATUS } from '@/src/constants'

/**
 * The grace window that applies to a specific loan: its creation-time
 * snapshot when present, otherwise the global config value. Loans created
 * before the contract upgrade that added the snapshot read 0 there.
 */
export function resolveGraceDuration(
  balloonGraceSnapshot: bigint,
  globalGrace: bigint
): bigint {
  return balloonGraceSnapshot > 0n ? balloonGraceSnapshot : globalGrace
}

/** Absolute timestamp (seconds) at which a loan defaults. */
export function loanDefaultTimestamp(
  createdAt: bigint,
  duration: bigint,
  grace: bigint
): bigint {
  return createdAt + duration + grace
}

/**
 * True when an ACTIVE-per-contract loan has actually passed its default
 * moment. The contract's stored status only changes when a state-writing
 * function runs, so the UI must compute this itself.
 */
export function isPastDefault(
  createdAt: bigint,
  duration: bigint,
  balloonGraceSnapshot: bigint,
  globalGrace: bigint,
  nowSec: bigint
): boolean {
  const grace = resolveGraceDuration(balloonGraceSnapshot, globalGrace)
  return nowSec >= loanDefaultTimestamp(createdAt, duration, grace)
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** The loan fields the payment countdown reads. */
export interface CountdownLoan {
  status: number
  createdAt: bigint
  /** Loan end: createdAt + duration. */
  dueTimestamp: bigint
  loanCycleDuration: bigint
  transpiredCycles: bigint
  cyclesAhead: bigint
  totalCycles: bigint
  balloonGraceSnapshot: bigint
}

export interface PaymentCountdown {
  /** When the countdown reaches zero, in ms. */
  targetMs: number
  label: 'Time Until Default' | 'Time to Loan End'
}

/**
 * What a loan card's countdown counts to — derived entirely from absolute
 * timestamps on the loan, so it doesn't shift between renders. Three phases:
 *
 *   1. Interest NOT fully paid: the next cycle's payment deadline (capped at
 *      the loan end date) − 1 day. "Time Until Default".
 *   2. Interest fully paid, before loan end: createdAt + duration, no buffer.
 *      "Time to Loan End".
 *   3. Interest fully paid, past loan end (balloon grace window): loan end +
 *      grace − 1 day. "Time Until Default".
 *
 * The 1-day buffer in phases 1 and 3 is a user-facing warning window, so the
 * countdown hits zero ahead of the contract's actual default. On testnet
 * (cycles shorter than a day) the buffer dominates and the timer reads "Make
 * Payment Now" through the whole active phase — expected, since it's sized
 * for mainnet cycle lengths.
 *
 * "Interest fully paid" means every cycle has been credited: elapsed cycles
 * plus prepaid ones (cyclesAhead) cover them all.
 *
 * Null when nothing is due: a loan that isn't ACTIVE (repaid, collateral not
 * yet withdrawn) has no countdown.
 */
export function paymentCountdown(
  loan: CountdownLoan,
  globalGrace: bigint,
  nowMs: number
): PaymentCountdown | null {
  if (loan.status !== LOAN_STATUS.ACTIVE) return null
  const loanEndMs = Number(loan.dueTimestamp) * 1000

  if (loan.transpiredCycles + loan.cyclesAhead < loan.totalCycles) {
    // End of the next cycle the borrower must pay, after any prepayments.
    const nextCycleIndex = loan.transpiredCycles + loan.cyclesAhead + 1n
    const nextCycleEndMs =
      Number(loan.createdAt + nextCycleIndex * loan.loanCycleDuration) * 1000
    return {
      targetMs: Math.min(nextCycleEndMs, loanEndMs) - ONE_DAY_MS,
      label: 'Time Until Default'
    }
  }
  if (nowMs < loanEndMs) {
    return { targetMs: loanEndMs, label: 'Time to Loan End' }
  }
  // The loan's own grace snapshot (fixed at creation), so a config change
  // can't shift an existing loan's countdown; resolveGraceDuration falls back
  // to the global config for pre-upgrade loans, in lockstep with useLoans'
  // default override.
  const graceMs =
    Number(resolveGraceDuration(loan.balloonGraceSnapshot, globalGrace)) * 1000
  return {
    targetMs: loanEndMs + graceMs - ONE_DAY_MS,
    label: 'Time Until Default'
  }
}

/**
 * Active loans in payment order: the soonest countdown first — the same
 * target each card counts to, so the list reads in the order the timers do.
 * Loans with nothing due (repaid, collateral not yet withdrawn) go last.
 * Ties keep the order the loans were opened.
 */
export function sortByNextPayment<T extends CountdownLoan>(
  loans: readonly T[],
  globalGrace: bigint,
  nowMs: number
): T[] {
  return loans
    .map((loan) => ({
      loan,
      dueMs: paymentCountdown(loan, globalGrace, nowMs)?.targetMs ?? Infinity
    }))
    .sort((a, b) => {
      if (a.dueMs !== b.dueMs) return a.dueMs < b.dueMs ? -1 : 1
      if (a.loan.createdAt === b.loan.createdAt) return 0
      return a.loan.createdAt < b.loan.createdAt ? -1 : 1
    })
    .map(({ loan }) => loan)
}
