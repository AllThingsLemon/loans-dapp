import { useLiquidityData } from './useLiquidityData'
import { useLiquidityOperations } from './useLiquidityOperations'

export function useLiquidityPool() {
  const data = useLiquidityData()
  const operations = useLiquidityOperations()

  return {
    ...data,
    deposit: operations.deposit,
    requestWithdrawal: operations.requestWithdrawal,
    claimEarnings: operations.claimEarnings,
    compoundEarnings: operations.compoundEarnings,
    relockLiquidity: operations.relockLiquidity,
    pullEarnings: operations.pullEarnings,
    transferAccount: operations.transferAccount,
    claimWithdrawal: operations.claimWithdrawal,
    fundWithdrawalQueue: operations.fundWithdrawalQueue,
    processSwaps: operations.processSwaps,
    approveToken: operations.approveToken,
    depositFeeUSD: operations.depositFeeUSD,
    withdrawFeeUSD: operations.withdrawFeeUSD,
    isTransacting: operations.isTransacting,
  }
}

export type UseLiquidityPoolReturn = ReturnType<typeof useLiquidityPool>
