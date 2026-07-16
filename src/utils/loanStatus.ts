/**
 * Effective loan default timing, shared by useLoans (status override) and
 * the ActiveLoans countdown. Kept pure so the exact moment the UI flips a
 * loan to Defaulted is unit-testable.
 */

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
