/**
 * Protocol fee math shared by the payment flow (hook + dialog display).
 * Kept pure so the exact amounts users are charged are unit-testable.
 */

/**
 * Gross amount the Loans contract pulls on makeLoanPayment: the payment
 * plus the protocol fee (FEE_BPS), with the fee rounded UP so approvals
 * and balance checks always cover the on-chain transfer.
 */
export function grossPaymentAmount(
  amount: bigint,
  feeBps: bigint,
  bpsDenominator: bigint
): bigint {
  if (bpsDenominator === 0n) return amount
  return amount + (amount * feeBps + bpsDenominator - 1n) / bpsDenominator
}
