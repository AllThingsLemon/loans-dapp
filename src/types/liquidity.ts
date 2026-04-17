// Types matching LiquidityPool and Loans contract return values

export interface UserStatus {
  totalShares: bigint
  totalNonEarningShares: bigint
  totalPrincipal: bigint
  unlockedPrincipal: bigint
  lockedPrincipal: bigint
  pendingEarnings: bigint
  totalClaimed: bigint
}

export interface PoolStatus {
  totalPoolValue: bigint
  totalShares: bigint
  totalNonEarningShares: bigint
  accumulatedEarningsPerShare: bigint
  lastEarningsWithdrawal: bigint
  availableEarningsInLoans: bigint
  nextEarningsWithdrawalTime: bigint
}

export interface LockEntry {
  amount: bigint
  unlockTime: bigint
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
  principalForfeited: bigint
  principalAvailable: bigint
  interestEarned: bigint
  interestWithdrawn: bigint
  interestAvailable: bigint
}

// Parser functions for contract return tuples

export function parseUserStatus(data: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint]): UserStatus {
  return {
    totalShares: data[0],
    totalNonEarningShares: data[1],
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
    totalShares: data[1],
    totalNonEarningShares: data[2],
    accumulatedEarningsPerShare: data[3],
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
    principalForfeited: data[3],
    principalAvailable: data[4],
    interestEarned: data[5],
    interestWithdrawn: data[6],
    interestAvailable: data[7],
  }
}
