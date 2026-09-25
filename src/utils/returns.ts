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

/**
 * Return earned by a 1.00x-multiplier deposit between two readings of the
 * pool's `accumulatedEarningsPerInterestShare` (1e18-scaled earnings per
 * interest share), as a percentage. A 1.00x deposit holds one interest share
 * per unit of principal, so the accumulator's growth IS its return, whatever
 * deposits and withdrawals happened in between. Null when the readings are
 * out of order.
 */
export function accumulatorDeltaToPct(
  accNow: bigint,
  accThen: bigint
): number | null {
  if (accNow < accThen) return null
  return bigintRatioToPct(accNow - accThen, 10n ** 18n)
}

/** "0.42%", "<0.01%" for measurable-but-tiny, "—" when unmeasurable. */
export function formatReturnPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—'
  if (pct > 0 && pct < 0.01) return '<0.01%'
  return `${pct.toFixed(2)}%`
}
