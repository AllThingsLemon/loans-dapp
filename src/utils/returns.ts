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

/** "0.42%", "<0.01%" for measurable-but-tiny, "—" when unmeasurable. */
export function formatReturnPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—'
  if (pct > 0 && pct < 0.01) return '<0.01%'
  return `${pct.toFixed(2)}%`
}
