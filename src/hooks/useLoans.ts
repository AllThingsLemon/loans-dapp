import { useCallback, useMemo } from 'react'
import { useUserLoans } from './loans/useUserLoans'
import { useLoanOperations } from './loans/useLoanOperations'
import { useLoanConfig } from './loans/useLoanConfig'
import { LOAN_STATUS } from '@/src/constants'
import type { UseLoansOptions, UseLoansReturn } from './types'
export type { LoanRequest } from './loans/useLoanOperations'

export interface Loan {
  // From loans mapping
  id: `0x${string}`
  account: `0x${string}`
  collateralToken: `0x${string}`
  createdAt: bigint
  loanAmount: bigint
  duration: bigint
  interestAmount: bigint
  interestApr: bigint
  paidAmount: bigint
  ltv: bigint
  originationFee: bigint
  collateralAmount: bigint

  // From getter functions (separate calls)
  status: number
  paymentAmount: bigint
  transpiredCycles: bigint
  totalCycles: bigint
  remainingCycles: bigint
  cyclesAhead: bigint
  timeToDefault: bigint
  elapsedTimeInCycle: bigint

  // Computed helper properties (derived from contract data)
  originalDuration: bigint // Duration at loan creation (max allowed extension)
  loanCycleDuration: bigint // From loans struct — used for adaptive countdown buffer
  remainingBalance: bigint // Calculated from contract values, not manually
  dueTimestamp: bigint // Calculated from timeToDefault
}

export const useLoans = (options?: UseLoansOptions): UseLoansReturn => {
  const userData = useUserLoans()
  const config = useLoanConfig(options?.loanRequest?.collateralToken)
  const operations = useLoanOperations(options)

  // The contract's loanStatus() returns the *stored* status, which only
  // changes when a state-writing function runs. A loan whose grace window
  // has elapsed will keep returning ACTIVE until someone touches it, even
  // though makeLoanPayment will revert with LoanNotActive. Compute an
  // effective status here so the UI reflects reality: badge as Defaulted,
  // drop from active list, and prevent the doomed payment flow.
  const grace = config.loanConfig?.balloonPaymentGraceDuration ?? 0n
  const effectiveLoans = useMemo(() => {
    const nowSec = BigInt(Math.floor(Date.now() / 1000))
    return userData.loans.flatMap((loan) => {
      if (!loan) return []
      if (loan.status !== LOAN_STATUS.ACTIVE) return [loan]
      const defaultAt = loan.createdAt + loan.duration + grace
      if (nowSec >= defaultAt) {
        return [{ ...loan, status: LOAN_STATUS.DEFAULT }]
      }
      return [loan]
    })
  }, [userData.loans, grace])

  const activeLoans = useMemo(
    () =>
      effectiveLoans.filter(
        (loan) =>
          loan.status === LOAN_STATUS.ACTIVE ||
          loan.status === LOAN_STATUS.UNLOCKED
      ),
    [effectiveLoans]
  )
  const loanHistory = useMemo(
    () =>
      effectiveLoans.filter(
        (loan) =>
          loan.status === LOAN_STATUS.COMPLETED ||
          loan.status === LOAN_STATUS.DEFAULT ||
          loan.status === LOAN_STATUS.LIQUIDATED
      ),
    [effectiveLoans]
  )
  const getLoanById = useCallback(
    (id: `0x${string}`) => effectiveLoans.find((loan) => loan.id === id),
    [effectiveLoans]
  )

  return {
    // Data from useUserLoans (with effective-status overrides applied)
    loans: effectiveLoans,
    activeLoans,
    loanHistory,
    getLoanById,
    refetch: userData.refetch,

    // Operations from useLoanOperations
    createLoan: operations.createLoan,
    extendLoan: operations.extendLoan,
    approveLoanFee: operations.approveLoanFee,
    approveCollateral: operations.approveCollateral,
    payLoan: operations.payLoan,
    pullCollateral: operations.pullCollateral,
    approveTokenAllowance: operations.approveTokenAllowance,

    // Transaction states
    isTransacting: operations.isTransacting,
    isSimulating: operations.isSimulating,

    // Loan creation & simulation data
    requiredCollateral: operations.requiredCollateral,
    hasInsufficientLmln: operations.hasInsufficientLmln,
    grossOriginationFee: operations.grossOriginationFee,
    calculationData: operations.calculationData,

    // User balance info
    userLmlnBalance: operations.userLmlnBalance,
    userLoanTokenBalance: operations.userLoanTokenBalance,
    currentAllowance: operations.currentAllowance,
    currentLmlnAllowance: operations.currentLmlnAllowance,
    currentCollateralAllowance: operations.currentCollateralAllowance,

    // Liquidity
    availableLiquidity: operations.availableLiquidity,
    hasInsufficientLiquidity: operations.hasInsufficientLiquidity,

    // Contract addresses
    loansContractAddress: operations.loansContractAddress,

    // Loan configuration
    loanConfig: config.loanConfig,
    ltvOptions: config.ltvOptions,
    interestAprConfigs: config.interestAprConfigs,
    durationRange: config.durationRange,

    // Combined loading state
    isLoading:
      userData.isLoading || operations.isTransacting || config.isLoading,

    // Combined error state
    error: userData.error || operations.error || config.error
  }
}

// Export the payment hook separately for components that need it
export { useLoanPayment } from './loans/useLoanPayment'
