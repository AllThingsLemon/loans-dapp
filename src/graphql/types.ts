/**
 * Row shapes for the indexer's Loans / LiquidityPool event tables, in the
 * v2 schema the mainnet endpoint serves (the testnet endpoint is still v1,
 * with `timestamp` in place of `blockTimestamp`).
 *
 * Hasura serialises `numeric` columns as decimal strings — token amounts are
 * full-precision wei and must go through BigInt, never Number. Addresses
 * (srcAddress, borrower, payer) are stored lowercase.
 *
 * Every row's `id` is `${chainId}_${blockNumber}_${logIndex}` — v2 has no
 * block number column, so this is the only place the block lives; see
 * parseEventId in utils/loanHistory for ordering by it.
 */

export type Numeric = string

interface EventRow {
  id: string
  chainId: number
  srcAddress: string
  /** Unix seconds. */
  blockTimestamp: number
  transactionHash: string
}

export interface LoanInitiatedRow extends EventRow {
  loanId: string
  borrower: string
  loanAmount: Numeric
  interestAmount: Numeric
  collateralAmount: Numeric
  duration: Numeric
  ltv: Numeric
  originationFee: Numeric
}

export interface LoanPaymentRow extends EventRow {
  loanId: string
  payer: string
  paymentAmount: Numeric
  remainingInterest: Numeric
  remainingPrincipal: Numeric
  totalPaidAmount: Numeric
}

export interface LoanExtendedRow extends EventRow {
  loanId: string
  borrower: string
  additionalInterest: Numeric
  extensionDuration: Numeric
  extensionFee: Numeric
  newTotalDuration: Numeric
  newTotalInterest: Numeric
}

/**
 * One `pullEarnings()` on the pool: `amount` of interest moved from Loans
 * into the pool and credited to depositors (what Loans counts in
 * totalInterestDistributed). `newAccumulatedPerInterestShare` is the pool's
 * accumulatedEarningsPerInterestShare AFTER this pull, scaled by 1e18;
 * `totalInterestShares` is what `amount` was split across.
 */
export interface EarningsPulledRow extends EventRow {
  amount: Numeric
  newAccumulatedPerInterestShare: Numeric
  totalInterestShares: Numeric
}

export interface LoanInitiatedResponse {
  Loans_LoanInitiated: LoanInitiatedRow[]
}

export interface LoanPaymentsResponse {
  Loans_LoanPaymentMade: LoanPaymentRow[]
}

export interface LoanExtendedResponse {
  Loans_LoanExtended: LoanExtendedRow[]
}

export interface EarningsPulledResponse {
  LiquidityPool_EarningsPulled: EarningsPulledRow[]
}

export interface PoolDepositRow extends EventRow {
  user: string
  token: string
  tokenAmount: Numeric
  /** USD value credited, 1:1 with liquidityShares. */
  stableTokenValue: Numeric
  liquidityShares: Numeric
  interestShares: Numeric
  lockDuration: Numeric
  /** Protocol deposits (e.g. from the Loans contract) that earn nothing. */
  nonEarning: boolean
}

/*
 * One account's pool history (see the ACCOUNT_* queries). Each row keeps
 * `user`, since the account's lineage can span addresses.
 */
interface AccountRow {
  id: string
  user: string
  /** Unix seconds. */
  blockTimestamp: number
}

export interface AccountDepositRow extends AccountRow {
  token: string
  tokenAmount: Numeric
  /** USD value credited at deposit time. */
  stableTokenValue: Numeric
  /** Unix seconds; the lock entry's unlockTime. */
  expiresAt: Numeric
  lockDuration: Numeric
}

export interface AccountCompoundRow extends AccountRow {
  /** Reinvested, after the earnings fee. */
  earningsAmount: Numeric
  unlockTime: Numeric
}

export interface AccountWithdrawalRequestRow extends AccountRow {
  requestId: Numeric
  amount: Numeric
}

/** A queued withdrawal paid out. `amount` is before the withdrawal fee. */
export interface AccountWithdrawalClaimRow extends AccountRow {
  requestId: Numeric
  amount: Numeric
  fee: Numeric
}

/** Earnings claimed to the wallet. `amount` is before the claim fee. */
export interface AccountEarningsClaimRow extends AccountRow {
  amount: Numeric
  fee: Numeric
}

export interface AccountTransferRow {
  id: string
  from: string
  to: string
}

export interface PoolCompoundRow extends EventRow {
  user: string
  earningsAmount: Numeric
  liquidityShares: Numeric
  interestShares: Numeric
}

export interface PoolWithdrawalRow extends EventRow {
  user: string
  amount: Numeric
  liquiditySharesBurned: Numeric
  interestSharesBurned: Numeric
}

/** A lock boost running out: its extra interest shares leave the pool. */
export interface BoostExpiredRow extends EventRow {
  expiresAt: Numeric
  boostShares: Numeric
}

export interface PoolDepositsResponse {
  LiquidityPool_Deposited: PoolDepositRow[]
}

export interface AccountDepositsResponse {
  LiquidityPool_Deposited: AccountDepositRow[]
}

export interface AccountCompoundsResponse {
  LiquidityPool_EarningsCompounded: AccountCompoundRow[]
}

export interface AccountWithdrawalRequestsResponse {
  LiquidityPool_WithdrawalRequested: AccountWithdrawalRequestRow[]
}

export interface AccountWithdrawalClaimsResponse {
  LiquidityPool_WithdrawalClaimed: AccountWithdrawalClaimRow[]
}

export interface AccountEarningsClaimsResponse {
  LiquidityPool_EarningsClaimed: AccountEarningsClaimRow[]
}

export interface AccountTransfersResponse {
  LiquidityPool_AccountTransferred: AccountTransferRow[]
}

export interface PoolWithdrawalRequestsResponse {
  LiquidityPool_WithdrawalRequested: PoolWithdrawalRow[]
}

export interface PoolCompoundsResponse {
  LiquidityPool_EarningsCompounded: PoolCompoundRow[]
}

export interface PoolWithdrawalsResponse {
  LiquidityPool_Withdrawn: PoolWithdrawalRow[]
}

export interface BoostExpiriesResponse {
  LiquidityPool_BoostExpired: BoostExpiredRow[]
}

/** A borrower's latest loan events (BORROWER_ACTIVITY), newest first. */
export interface BorrowerActivityResponse {
  payments: {
    id: string
    loanId: string
    blockTimestamp: number
    paymentAmount: Numeric
  }[]
  extensions: {
    id: string
    loanId: string
    blockTimestamp: number
    extensionDuration: Numeric
  }[]
  repaid: { id: string; loanId: string; blockTimestamp: number }[]
  collateralWithdrawn: {
    id: string
    loanId: string
    blockTimestamp: number
    collateralAmount: Numeric
  }[]
  defaulted: { id: string; loanId: string; blockTimestamp: number }[]
}
