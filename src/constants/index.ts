// Loan Status Constants (matching contract enum)
export const LOAN_STATUS = {
  COMPLETED: 0, // Fully paid and collateral withdrawn
  UNLOCKED: 1,  // Paid off but collateral not withdrawn
  DEFAULT: 2,   // Missed payment or overdue beyond grace period
  ACTIVE: 3     // Currently in repayment
} as const

export type LoanStatus = typeof LOAN_STATUS[keyof typeof LOAN_STATUS]

// Default Decimals
export const DEFAULT_DECIMALS = {
  NATIVE_TOKEN: 18,
  ERC20_STANDARD: 18
} as const

// Limits
export const LIMITS = {
  MAX_LOANS: 20,
  MAX_LTV_OPTIONS: 5
} as const

// Query Configuration
export const QUERY_CONFIG = {
  STALE_TIME: 30 * 1000, // 30 seconds
  GC_TIME: 5 * 60 * 1000, // 5 minutes
  POLLING_INTERVAL: 4000 // 4 seconds
} as const

// Default LTV Test Values (percentages)
export const DEFAULT_LTV_VALUES = ['20', '30', '40', '50', '60'] as const

// Contract Array Indices (for better readability)
export const LOAN_STRUCT_INDICES = {
  ACCOUNT: 0,
  CREATED_AT: 1,
  LOAN_AMOUNT: 2,
  DURATION: 3,
  INTEREST_AMOUNT: 4,
  INTEREST_APR: 5,
  PAID_AMOUNT: 6,
  LTV: 7,
  ORIGINATION_FEE: 8,
  COLLATERAL_AMOUNT: 9,
  COLLATERAL_WITHDRAWN: 10
} as const

export const LOAN_CONFIG_INDICES = {
  MIN_LOAN_AMOUNT: 0,
  MIN_LOAN_DURATION: 1,
  MAX_LOAN_DURATION: 2,
  BALLOON_PAYMENT_GRACE_DURATION: 3,
  LOAN_CYCLE_DURATION: 4,
  MAX_LOAN_EXTENSION: 5
} as const

export const INTEREST_CONFIG_INDICES = {
  MIN_DURATION: 0,
  MAX_DURATION: 1,
  INTEREST_APR: 2
} as const