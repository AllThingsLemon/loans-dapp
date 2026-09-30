/**
 * Pure math/formatting for the measured-returns display
 * (useThirtyDayReturns + DisconnectedLiquidity). Kept dependency-free so the
 * arithmetic is unit-testable without pulling wallet UI into the test env.
 */

/**
 * percent = (numerator / denominator) × 100, computed in bigint with 1e12 of
 * headroom so early-protocol figures (cents of interest against six-figure
 * share totals) survive the integer division as a nonzero pct instead of
 * flooring to 0.
 */
export function bigintRatioToPct(
  numerator: bigint,
  denominator: bigint
): number {
  return Number((numerator * 10n ** 12n) / denominator) / 10 ** 10
}

export interface WindowReturns {
  /**
   * Pool-average return over the window as a percentage (0.42 = 0.42%):
   * interest distributed ÷ the pool's deposits (liquidity shares). Null when
   * unmeasurable.
   */
  avgPct: number | null
  /**
   * The 1.00x-multiplier return: the same interest ÷ the pool's interest
   * shares. A tier with multiplier m earns m × basePct, because earnings are
   * paid per interest share and a deposit's interest shares are principal ×
   * m — so the deposit-weighted average of the tier figures is avgPct.
   */
  basePct: number | null
}

export const UNMEASURED: WindowReturns = { avgPct: null, basePct: null }

/**
 * Returns for a period's distributed interest against the pool's share
 * totals: over liquidity shares for the average, over interest shares for
 * the 1.00x rate.
 */
export function poolReturns(
  distributed: bigint,
  liquidityShares: bigint,
  interestShares: bigint
): WindowReturns {
  if (liquidityShares === 0n || interestShares === 0n) return UNMEASURED
  return {
    avgPct: bigintRatioToPct(distributed, liquidityShares),
    basePct: bigintRatioToPct(distributed, interestShares)
  }
}

/** "0.42%", "<0.01%" for measurable-but-tiny, "—" when unmeasurable. */
export function formatReturnPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—'
  if (pct > 0 && pct < 0.01) return '<0.01%'
  return `${pct.toFixed(2)}%`
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

/** "$2,599.77". */
export function formatUsd(amount: number): string {
  return USD.format(amount)
}
