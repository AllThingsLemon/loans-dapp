'use client'
import {
  useReadLoansCalculateLoanDetails,
  useReadLoansGetAllInterestAprConfigs
} from '@/src/generated'
import type { InterestAprConfig } from './useLoanConfig'

/** The slice of a loan the extension quote needs. */
interface ExtensionQuoteLoan {
  collateralToken: `0x${string}`
  originalDuration: bigint
  loanAmount: bigint
  ltv: bigint
  originationFee: bigint
}

/**
 * Everything the Extend Loan dialog needs from chain, quoted for the loan
 * whose dialog is open (pass undefined while none is).
 *
 * The fee: tier fees are priced in USD and converted to LMLN at charge time,
 * so the creation-time amount stored in `loan.originationFee` can be STALE by
 * the time the loan is extended. Trusting it for the approval leaves the
 * borrower in an approve-then-still-blocked loop whenever the LMLN price has
 * fallen since creation. Re-quote with the loan's own parameters and use
 * whichever of the two amounts is larger — correct under either contract
 * semantic (charges the stored amount, or re-prices at the current rate).
 * NOTE (Aug 2026): the deployed contract currently charges the stored amount;
 * a move to re-pricing is under discussion. Revisit the max() once decided.
 *
 * The APR tiers: configured per collateral asset. The useLoans instance in
 * ActiveLoans carries no loanRequest, so its tier list is always empty there —
 * this read is what feeds the dialog's Estimated APR.
 */
export function useExtensionQuote(loan?: ExtensionQuoteLoan) {
  // Raw reads with the same @ts-ignore the sibling hooks use — the generated
  // wagmi hooks hit TS's deep-instantiation limit.
  // @ts-ignore - wagmi deep type instantiation
  const { data: quote } = useReadLoansCalculateLoanDetails({
    args: loan
      ? [loan.collateralToken, loan.originalDuration, loan.loanAmount, loan.ltv]
      : undefined,
    query: { enabled: !!loan }
  })
  const freshFee = quote?.[2] as bigint | undefined

  // @ts-ignore - wagmi deep type instantiation
  const { data: aprRaw } = useReadLoansGetAllInterestAprConfigs({
    args: loan ? [loan.collateralToken] : undefined,
    // Static protocol configuration — don't re-read it on every dialog open.
    query: { enabled: !!loan, staleTime: Infinity }
  })

  const extensionFee = loan
    ? freshFee !== undefined && freshFee > loan.originationFee
      ? freshFee
      : loan.originationFee
    : undefined

  return {
    extensionFee,
    aprConfigs: (aprRaw ?? []) as readonly InterestAprConfig[]
  }
}
