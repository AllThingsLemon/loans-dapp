import { useCallback } from 'react'
import { useLiquidityData } from './useLiquidityData'
import { useLiquidityOperations } from './useLiquidityOperations'

export function useLiquidityPool() {
  const data = useLiquidityData()
  const operations = useLiquidityOperations()

  const stableTokenAddress = data.stableTokenAddress
  const lockDuration = data.lockDuration ?? 0n

  // Bridge old component function names to new operations
  const depositLiquidity = useCallback(
    (amount: bigint) => {
      if (!stableTokenAddress) throw new Error('Stable token address not loaded')
      return operations.deposit(stableTokenAddress, amount, lockDuration, false)
    },
    [stableTokenAddress, lockDuration, operations]
  )

  const depositNonEarningLiquidity = useCallback(
    (amount: bigint) => {
      if (!stableTokenAddress) throw new Error('Stable token address not loaded')
      return operations.deposit(stableTokenAddress, amount, lockDuration, true)
    },
    [stableTokenAddress, lockDuration, operations]
  )

  const withdrawLiquidity = useCallback(
    (amount: bigint) => {
      return operations.requestWithdrawal(amount)
    },
    [operations]
  )

  // Alias transferNonEarningShares to transferShares (same function in new contract)
  const transferNonEarningShares = operations.transferShares

  return {
    ...data,
    // New operations (direct)
    deposit: operations.deposit,
    requestWithdrawal: operations.requestWithdrawal,
    claimEarnings: operations.claimEarnings,
    compoundEarnings: operations.compoundEarnings,
    relockLiquidity: operations.relockLiquidity,
    pullEarnings: operations.pullEarnings,
    transferPendingEarnings: operations.transferPendingEarnings,
    transferShares: operations.transferShares,
    claimWithdrawal: operations.claimWithdrawal,
    fundWithdrawalQueue: operations.fundWithdrawalQueue,
    processSwaps: operations.processSwaps,
    approveToken: operations.approveToken,
    depositFeeUSD: operations.depositFeeUSD,
    withdrawFeeUSD: operations.withdrawFeeUSD,
    isTransacting: operations.isTransacting,

    // Old names for backward compat with components
    depositLiquidity,
    depositNonEarningLiquidity,
    withdrawLiquidity,
    transferNonEarningShares,
  }
}

export type UseLiquidityPoolReturn = ReturnType<typeof useLiquidityPool>
