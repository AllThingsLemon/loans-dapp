/**
 * Pure derivations over indexed LiquidityPool events (see src/graphql). Kept
 * dependency-free so the arithmetic is unit-testable without pulling wallet
 * UI into the test env.
 */

import type { EarningsPulledRow } from '@/src/graphql/types'
import { compareEventIds } from '@/src/utils/loanHistory'
import { bigintRatioToPct } from '@/src/utils/returns'

export const DAY_S = 86_400

/**
 * One event's signed change to the pool's share totals: deposits and
 * compounded earnings add, withdrawals and expiring boosts subtract.
 * Liquidity shares track principal 1:1; interest shares are principal ×
 * lock multiplier.
 */
export interface ShareChange {
  /** The indexer event id, `${chainId}_${blockNumber}_${logIndex}`. */
  id: string
  /** Unix seconds. */
  timestamp: number
  liquidity: bigint
  interest: bigint
}

export interface ShareTotals {
  liquidity: bigint
  interest: bigint
}

/** Totals after every change — comparable with the pool's live totals. */
export function sumShareChanges(changes: readonly ShareChange[]): ShareTotals {
  return changes.reduce(
    (t, c) => ({
      liquidity: t.liquidity + c.liquidity,
      interest: t.interest + c.interest
    }),
    { liquidity: 0n, interest: 0n }
  )
}

/** Interest distributed to the pool at or after `since` (unix seconds). */
export function distributedSince(
  pulls: readonly Pick<EarningsPulledRow, 'blockTimestamp' | 'amount'>[],
  since: number
): bigint {
  return pulls.reduce(
    (sum, p) => (p.blockTimestamp >= since ? sum + BigInt(p.amount) : sum),
    0n
  )
}

/** Interest distributed to the pool over its whole history. */
export function totalDistributed(
  pulls: readonly Pick<EarningsPulledRow, 'amount'>[]
): bigint {
  return pulls.reduce((sum, p) => sum + BigInt(p.amount), 0n)
}

export interface Performance {
  /** Per deposited dollar, across the lock mix at each distribution. */
  avgPct: number
  /** Per interest share: the 1.00x rate. Tier m earned m × basePct. */
  basePct: number
}

/**
 * Time-weighted performance over a window: each pull at or after `since`
 * contributes its amount ÷ the pool's deposits just before it — what the
 * money in the pool earned from that distribution — and the contributions
 * add up. They are summed rather than compounded because earnings are paid
 * out, not reinvested. A deposit made in the same transaction as a pull
 * isn't counted in that pull: the pull runs first.
 *
 * The 1.00x rate divides each amount by the interest shares it was split
 * across instead (recorded on the pull itself).
 */
export function distributionPerformance(
  pulls: readonly Pick<
    EarningsPulledRow,
    'id' | 'blockTimestamp' | 'amount' | 'totalInterestShares'
  >[],
  changes: readonly ShareChange[],
  since: number
): Performance {
  const ordered = [...changes].sort((a, b) => compareEventIds(a.id, b.id))
  let next = 0
  let deposits = 0n
  let avgPct = 0
  let basePct = 0
  for (const pull of [...pulls].sort((a, b) => compareEventIds(a.id, b.id))) {
    while (
      next < ordered.length &&
      compareEventIds(ordered[next].id, pull.id) < 0
    ) {
      deposits += ordered[next++].liquidity
    }
    const amount = BigInt(pull.amount)
    const interestShares = BigInt(pull.totalInterestShares)
    if (pull.blockTimestamp < since || amount === 0n) continue
    if (deposits > 0n) avgPct += bigintRatioToPct(amount, deposits)
    if (interestShares > 0n) basePct += bigintRatioToPct(amount, interestShares)
  }
  return { avgPct, basePct }
}
