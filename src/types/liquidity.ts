// Types matching LiquidityPool and Loans contract return values

export interface UserStatus {
  liquidityShares: bigint    // data[0] - total shares (earning + non-earning)
  interestShares: bigint     // data[1] - earning shares only
  totalPrincipal: bigint
  unlockedPrincipal: bigint
  lockedPrincipal: bigint
  pendingEarnings: bigint
  totalClaimed: bigint
}

export interface PoolStatus {
  totalPoolValue: bigint
  totalLiquidityShares: bigint    // data[1]
  totalInterestShares: bigint     // data[2]
  accumulatedEarningsPerInterestShare: bigint
  lastEarningsWithdrawal: bigint
  availableEarningsInLoans: bigint
  nextEarningsWithdrawalTime: bigint
}

export interface LockEntry {
  amount: bigint
  unlockTime: bigint
}

export interface DepositEntry {
  token: `0x${string}`
  tokenAmount: bigint
  stableTokenValue: bigint
  liquidityShares: bigint
  interestShares: bigint
  unlockTime: bigint
  lockDuration: bigint
}

export interface WithdrawalRequest {
  user: `0x${string}`
  amount: bigint
  amountFunded: bigint
  liquiditySharesBurned: bigint
  interestSharesBurned: bigint
  requestTime: bigint
}

export interface LockDurationTier {
  duration: bigint
  interestMultiplier: bigint
  isEnabled: boolean
}

export interface FeeConfig {
  feeBps: bigint
  feeReceiver: `0x${string}`
}

export interface LiquidityStatus {
  principalDeposited: bigint
  principalWithdrawn: bigint
  principalInLoans: bigint
  principalDeficitAmount: bigint
  principalAvailable: bigint
  interestEarned: bigint
  interestDistributed: bigint
  interestAvailable: bigint
}

// Parser functions for contract return tuples

export function parseUserStatus(data: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint]): UserStatus {
  return {
    liquidityShares: data[0],
    interestShares: data[1],
    totalPrincipal: data[2],
    unlockedPrincipal: data[3],
    lockedPrincipal: data[4],
    pendingEarnings: data[5],
    totalClaimed: data[6],
  }
}

export function parsePoolStatus(data: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint]): PoolStatus {
  return {
    totalPoolValue: data[0],
    totalLiquidityShares: data[1],
    totalInterestShares: data[2],
    accumulatedEarningsPerInterestShare: data[3],
    lastEarningsWithdrawal: data[4],
    availableEarningsInLoans: data[5],
    nextEarningsWithdrawalTime: data[6],
  }
}

export function parseLiquidityStatus(data: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]): LiquidityStatus {
  return {
    principalDeposited: data[0],
    principalWithdrawn: data[1],
    principalInLoans: data[2],
    principalDeficitAmount: data[3],
    principalAvailable: data[4],
    interestEarned: data[5],
    interestDistributed: data[6],
    interestAvailable: data[7],
  }
}
