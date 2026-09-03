import { useLiquidityData } from './useLiquidityData'
import { useLiquidityOperations } from './useLiquidityOperations'

export function useLiquidityPool() {
  const data = useLiquidityData()
  const operations = useLiquidityOperations()

  return {
    ...data,
    deposit: operations.deposit,
    depositFor: operations.depositFor,
    depositWithReferral: operations.depositWithReferral,
    referralRouterAddress: operations.referralRouterAddress,
    requestWithdrawal: operations.requestWithdrawal,
    claimEarnings: operations.claimEarnings,
    compoundEarnings: operations.compoundEarnings,
    pullEarnings: operations.pullEarnings,
    transferAccount: operations.transferAccount,
    claimWithdrawal: operations.claimWithdrawal,
    fundWithdrawalQueue: operations.fundWithdrawalQueue,
    processSwaps: operations.processSwaps,
    approveToken: operations.approveToken,
    depositFeeUSD: operations.depositFeeUSD,
    withdrawFeeUSD: operations.withdrawFeeUSD,
    minimumWithdrawalValue: operations.minimumWithdrawalValue,
    depositNativeFee: operations.depositNativeFee,
    withdrawNativeFee: operations.withdrawNativeFee,
    isTransacting: operations.isTransacting
  }
}

export type UseLiquidityPoolReturn = ReturnType<typeof useLiquidityPool>
