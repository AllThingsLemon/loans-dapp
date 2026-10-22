/**
 * Pure derivations over indexed Loans events (see src/graphql). Kept
 * dependency-free so the arithmetic is unit-testable without pulling wallet
 * UI into the test env.
 */
import type {
  BorrowerActivityResponse,
  LoanInitiatedRow,
  LoanPaymentRow
} from '@/src/graphql/types'

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

export type LoanActivityKind =
  | 'opened'
  | 'payment'
  | 'extended'
  | 'repaid'
  | 'collateralWithdrawn'
  | 'defaulted'

export interface LoanActivity {
  id: string
  kind: LoanActivityKind
  loanId: string
  /** Unix seconds. */
  timestamp: number
  /** Loan amount (opened), payment, or collateral returned; in that token. */
  amount?: bigint
  /** How long an extension added, in seconds. */
  extensionDuration?: bigint
}

/** Order within one block: a loan opens, then is paid, extended, closed. */
const KIND_ORDER: Record<LoanActivityKind, number> = {
  opened: 0,
  payment: 1,
  extended: 2,
  repaid: 3,
  collateralWithdrawn: 4,
  defaulted: 5
}

/**
 * A borrower's loan events, newest first, at most `limit`. Openings come
 * from the loans themselves (every loan has its createdAt on chain); the
 * rest from the indexer, which has no Loans events before ~2026-08-31 — so
 * an older loan shows its opening but not its earlier payments.
 */
export function recentLoanActivity(
  loans: readonly { id: string; createdAt: bigint; loanAmount: bigint }[],
  indexed: BorrowerActivityResponse | undefined,
  limit: number
): LoanActivity[] {
  const events: LoanActivity[] = loans.map((loan) => ({
    id: `opened:${loan.id}`,
    kind: 'opened',
    loanId: loan.id.toLowerCase(),
    timestamp: Number(loan.createdAt),
    amount: loan.loanAmount
  }))
  if (indexed) {
    for (const p of indexed.payments) {
      events.push({
        id: p.id,
        kind: 'payment',
        loanId: p.loanId,
        timestamp: p.blockTimestamp,
        amount: BigInt(p.paymentAmount)
      })
    }
    for (const e of indexed.extensions) {
      events.push({
        id: e.id,
        kind: 'extended',
        loanId: e.loanId,
        timestamp: e.blockTimestamp,
        extensionDuration: BigInt(e.extensionDuration)
      })
    }
    for (const r of indexed.repaid) {
      events.push({
        id: r.id,
        kind: 'repaid',
        loanId: r.loanId,
        timestamp: r.blockTimestamp
      })
    }
    for (const w of indexed.collateralWithdrawn) {
      events.push({
        id: w.id,
        kind: 'collateralWithdrawn',
        loanId: w.loanId,
        timestamp: w.blockTimestamp,
        amount: BigInt(w.collateralAmount)
      })
    }
    for (const d of indexed.defaulted) {
      events.push({
        id: d.id,
        kind: 'defaulted',
        loanId: d.loanId,
        timestamp: d.blockTimestamp
      })
    }
  }
  return events
    .sort(
      (a, b) =>
        b.timestamp - a.timestamp || KIND_ORDER[b.kind] - KIND_ORDER[a.kind]
    )
    .slice(0, limit)
}
