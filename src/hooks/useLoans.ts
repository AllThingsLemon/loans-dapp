import { useCallback } from 'react'
import { useUserLoans } from './loans/useUserLoans'
import { useLoanOperations } from './loans/useLoanOperations'
import { useLoanConfig } from './loans/useLoanConfig'
import type { UseLoansOptions, UseLoansReturn } from './types'
export type { LoanRequest } from './loans/useLoanOperations'

export interface Loan {
  // From loans mapping
  id: `0x${string}`
  account: `0x${string}`
  createdAt: bigint
  loanAmount: bigint
  duration: bigint
  interestAmount: bigint
  interestApr: bigint
  paidAmount: bigint
  ltv: bigint
  originationFee: bigint
  collateralAmount: bigint
  collateralWithdrawn: boolean

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
  remainingBalance: bigint // Calculated from contract values, not manually
  dueTimestamp: bigint // Calculated from timeToDefault
}

export const useLoans = (options?: UseLoansOptions): UseLoansReturn => {
  // Use focused hooks for specific concerns
  const userData = useUserLoans()
  const config = useLoanConfig()
  const operations = useLoanOperations(options)

  return {
    // Data from useUserLoans
    loans: userData.loans,
    activeLoans: userData.activeLoans,
    loanHistory: userData.loanHistory,
    getLoanById: userData.getLoanById,
    refetch: userData.refetch,

    // Operations from useLoanOperations
    createLoan: operations.createLoan,
    approveLoanFee: operations.approveLoanFee,
    payLoan: operations.payLoan,
    pullCollateral: operations.pullCollateral,
    approveTokenAllowance: operations.approveTokenAllowance,

    // Transaction states
    isTransacting: operations.isTransacting,
    isSimulating: operations.isSimulating,

    // Loan creation & simulation data
    requiredCollateral: operations.requiredCollateral,
    hasInsufficientLmln: operations.hasInsufficientLmln,
    calculationData: operations.calculationData,

    // User balance info
    userLmlnBalance: operations.userLmlnBalance,
    userLoanTokenBalance: operations.userLoanTokenBalance,
    currentAllowance: operations.currentAllowance,
    currentLmlnAllowance: operations.currentLmlnAllowance,

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
