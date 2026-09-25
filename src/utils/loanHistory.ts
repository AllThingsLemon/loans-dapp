/**
 * Pure derivations over indexed Loans events (see src/graphql). Kept
 * dependency-free so the arithmetic is unit-testable without pulling wallet
 * UI into the test env.
 */
import type { LoanInitiatedRow, LoanPaymentRow } from '@/src/graphql/types'

export interface EventPosition {
  chainId: number
  blockNumber: bigint
  logIndex: number
}

/** Indexer event ids are `${chainId}_${blockNumber}_${logIndex}`. */
export function parseEventId(id: string): EventPosition {
  const [chainId, blockNumber, logIndex] = id.split('_')
  if (logIndex === undefined) throw new Error(`Malformed event id: ${id}`)
  return {
    chainId: Number(chainId),
    blockNumber: BigInt(blockNumber),
    logIndex: Number(logIndex)
  }
}

/**
 * Chronological order for event ids. Plain string order is wrong: block
 * numbers are not zero-padded, so '56_99…' would sort after '56_123…'.
 */
export function compareEventIds(a: string, b: string): number {
  const pa = parseEventId(a)
  const pb = parseEventId(b)
  if (pa.blockNumber !== pb.blockNumber) {
    return pa.blockNumber < pb.blockNumber ? -1 : 1
  }
  return pa.logIndex - pb.logIndex
}

export interface PaymentBreakdown {
  id: string
  loanId: string
  /** Block timestamp, unix seconds. */
  timestamp: number
  paymentAmount: bigint
  principalPaid: bigint
  interestPaid: bigint
}

/**
 * Splits each LoanPaymentMade into its principal and interest parts.
 *
 * LoanPaymentMade carries no interest figure, only the loan's running
 * `remainingPrincipal`. Principal paid is that balance's drop since the
 * loan's previous payment (from `loanAmount` for the first), and interest
 * paid is the rest of the payment.
 *
 * Deliberately NOT derived from the drop in `remainingInterest`: on BSC the
 * two agree on every payment, but that balance can also fall for interest
 * that was never paid (Citron shows drops of twice the payment), which would
 * count forgiven interest as earned.
 *
 * A payment whose loan has no LoanInitiated row is skipped — without the
 * opening balance it cannot be split.
 */
export function breakDownPayments(
  initiated: readonly Pick<LoanInitiatedRow, 'loanId' | 'loanAmount'>[],
  payments: readonly LoanPaymentRow[]
): PaymentBreakdown[] {
  const principalLeft = new Map(
    initiated.map((loan) => [loan.loanId, BigInt(loan.loanAmount)])
  )
  const out: PaymentBreakdown[] = []
  for (const payment of [...payments].sort((a, b) =>
    compareEventIds(a.id, b.id)
  )) {
    const before = principalLeft.get(payment.loanId)
    if (before === undefined) continue
    const after = BigInt(payment.remainingPrincipal)
    principalLeft.set(payment.loanId, after)

    const paymentAmount = BigInt(payment.paymentAmount)
    const principalPaid = before > after ? before - after : 0n
    const interestPaid =
      paymentAmount > principalPaid ? paymentAmount - principalPaid : 0n
    out.push({
      id: payment.id,
      loanId: payment.loanId,
      timestamp: payment.blockTimestamp,
      paymentAmount,
      principalPaid,
      interestPaid
    })
  }
  return out
}

/** Interest paid by borrowers at or after `since` (unix seconds). */
export function interestPaidSince(
  breakdown: readonly PaymentBreakdown[],
  since: number
): bigint {
  return breakdown.reduce(
    (sum, p) => (p.timestamp >= since ? sum + p.interestPaid : sum),
    0n
  )
}
