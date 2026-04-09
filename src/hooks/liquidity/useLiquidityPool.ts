import { useLiquidityData } from './useLiquidityData'
import { useLiquidityOperations } from './useLiquidityOperations'

export function useLiquidityPool() {
  const data = useLiquidityData()
  const operations = useLiquidityOperations()

  return {
    ...data,
    depositLiquidity: operations.depositLiquidity,
    depositNonEarningLiquidity: operations.depositNonEarningLiquidity,
    withdrawLiquidity: operations.withdrawLiquidity,
    claimEarnings: operations.claimEarnings,
    compoundEarnings: operations.compoundEarnings,
    relockLiquidity: operations.relockLiquidity,
    pullEarnings: operations.pullEarnings,
    transferPendingEarnings: operations.transferPendingEarnings,
    transferShares: operations.transferShares,
    transferNonEarningShares: operations.transferNonEarningShares,
    approveToken: operations.approveToken,
    isTransacting: operations.isTransacting,
  }
}

export type UseLiquidityPoolReturn = ReturnType<typeof useLiquidityPool>
