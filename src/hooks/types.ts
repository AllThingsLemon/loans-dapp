import type { Loan, LoanRequest } from './useLoans'
import type { LoanConfiguration, InterestAprConfig } from './loans/useLoanConfig'

export interface UseLoansOptions {
  loanRequest?: LoanRequest
  selectedLtvOption?: { ltv: bigint; fee: bigint }
}

export interface UseLoansReturn {
  // Data from useUserLoans
  loans: Loan[]
  activeLoans: Loan[]
  loanHistory: Loan[]
  getLoanById: (id: `0x${string}`) => Loan | undefined
  refetch: () => Promise<void>

  // Operations from useLoanOperations
  createLoan: (loanRequest: LoanRequest) => Promise<`0x${string}` | undefined>
  approveLoanFee: () => Promise<`0x${string}` | undefined>
  payLoan: (loanId: `0x${string}`, amount: bigint) => Promise<`0x${string}` | undefined>
  pullCollateral: (loanId: `0x${string}`) => Promise<`0x${string}` | undefined>
  approveTokenAllowance: (amount: bigint) => Promise<`0x${string}` | undefined>

  // Transaction states
  isTransacting: boolean
  isSimulating: boolean

  // Loan creation & simulation data
  requiredCollateral: bigint | undefined
  hasInsufficientLmln: boolean
  calculationData: {
    interestAmount: bigint | undefined
    interestApr: bigint | undefined
    originationFee: bigint | undefined
    collateralAmount: bigint | undefined
    loanCycleDuration: bigint | undefined
    firstLoanPayment: bigint | undefined
  } | undefined

  // User balance info
  userLmlnBalance: bigint | undefined
  userLoanTokenBalance: bigint | undefined
  currentAllowance: bigint | undefined
  currentLmlnAllowance: bigint | undefined

  // Contract addresses
  loansContractAddress: `0x${string}` | undefined

  // Loan configuration
  loanConfig: LoanConfiguration | undefined
  ltvOptions: Array<{ ltv: bigint; fee: bigint }>
  interestAprConfigs: InterestAprConfig[]
  durationRange: { min: number; max: number }

  // Combined loading state
  isLoading: boolean

  // Combined error state
  error: Error | null
}