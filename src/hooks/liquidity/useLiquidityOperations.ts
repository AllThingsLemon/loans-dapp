import { useCallback } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { erc20Abi } from 'viem'
import {
  useWriteLiquidityPoolDeposit,
  useWriteLiquidityPoolRequestWithdrawal,
  useWriteLiquidityPoolClaimEarnings,
  useWriteLiquidityPoolCompoundEarnings,
  useWriteLiquidityPoolRelockLiquidity,
  useWriteLiquidityPoolPullEarnings,
  useWriteLiquidityPoolTransferPendingEarnings,
  useWriteLiquidityPoolTransferShares,
  useWriteLiquidityPoolClaimWithdrawal,
  useWriteLiquidityPoolCancelWithdrawal,
  useWriteLiquidityPoolFundWithdrawalQueue,
  useWriteLiquidityPoolProcessSwaps,
  useReadLiquidityPoolDepositFeeUsd,
  useReadLiquidityPoolWithdrawFeeUsd,
  useReadLoansGetNativeFee,
} from '@/src/generated'

export interface UseLiquidityOperationsReturn {
  deposit: (token: `0x${string}`, amount: bigint, lockDuration: bigint, nonEarning: boolean) => Promise<`0x${string}` | undefined>
  requestWithdrawal: (amount: bigint) => Promise<`0x${string}` | undefined>
  claimEarnings: () => Promise<`0x${string}` | undefined>
  compoundEarnings: (lockDuration: bigint) => Promise<`0x${string}` | undefined>
  relockLiquidity: (amount: bigint, lockDuration: bigint) => Promise<`0x${string}` | undefined>
  pullEarnings: () => Promise<`0x${string}` | undefined>
  transferPendingEarnings: (to: `0x${string}`, amount: bigint) => Promise<`0x${string}` | undefined>
  transferShares: (to: `0x${string}`, shareAmount: bigint) => Promise<`0x${string}` | undefined>
  claimWithdrawal: (requestId: bigint) => Promise<`0x${string}` | undefined>
  cancelWithdrawal: (requestId: bigint) => Promise<`0x${string}` | undefined>
  fundWithdrawalQueue: () => Promise<`0x${string}` | undefined>
  processSwaps: (token: `0x${string}`) => Promise<`0x${string}` | undefined>
  approveToken: (amount: bigint, tokenAddress: `0x${string}`, spender: `0x${string}`) => Promise<`0x${string}` | undefined>
  depositFeeUSD: bigint | undefined
  withdrawFeeUSD: bigint | undefined
  isTransacting: boolean
  error: Error | null
}

export function useLiquidityOperations(): UseLiquidityOperationsReturn {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // Native fee reads
  const { data: depositFeeUSD } = useReadLiquidityPoolDepositFeeUsd()
  const { data: withdrawFeeUSD } = useReadLiquidityPoolWithdrawFeeUsd()

  // Get native fee conversion: pass USD amount, get native wei amount
  const { data: depositNativeFee } = useReadLoansGetNativeFee({
    args: depositFeeUSD !== undefined ? [depositFeeUSD] : undefined,
    query: { enabled: depositFeeUSD !== undefined },
  })
  const { data: withdrawNativeFee } = useReadLoansGetNativeFee({
    args: withdrawFeeUSD !== undefined ? [withdrawFeeUSD] : undefined,
    query: { enabled: withdrawFeeUSD !== undefined },
  })

  // Write hooks
  const { writeContractAsync: depositFn, isPending: isDepositing } =
    useWriteLiquidityPoolDeposit({ mutation: { retry: false } })

  const { writeContractAsync: requestWithdrawalFn, isPending: isRequestingWithdrawal } =
    useWriteLiquidityPoolRequestWithdrawal({ mutation: { retry: false } })

  const { writeContractAsync: claimEarningsFn, isPending: isClaiming } =
    useWriteLiquidityPoolClaimEarnings({ mutation: { retry: false } })

  const { writeContractAsync: compoundEarningsFn, isPending: isCompounding } =
    useWriteLiquidityPoolCompoundEarnings({ mutation: { retry: false } })

  const { writeContractAsync: relockLiquidityFn, isPending: isRelocking } =
    useWriteLiquidityPoolRelockLiquidity({ mutation: { retry: false } })

  const { writeContractAsync: pullEarningsFn, isPending: isPulling } =
    useWriteLiquidityPoolPullEarnings({ mutation: { retry: false } })

  const { writeContractAsync: transferPendingEarningsFn, isPending: isTransferringEarnings } =
    useWriteLiquidityPoolTransferPendingEarnings({ mutation: { retry: false } })

  const { writeContractAsync: transferSharesFn, isPending: isTransferringShares } =
    useWriteLiquidityPoolTransferShares({ mutation: { retry: false } })

  const { writeContractAsync: claimWithdrawalFn, isPending: isClaimingWithdrawal } =
    useWriteLiquidityPoolClaimWithdrawal({ mutation: { retry: false } })

  const { writeContractAsync: cancelWithdrawalFn, isPending: isCancellingWithdrawal } =
    useWriteLiquidityPoolCancelWithdrawal({ mutation: { retry: false } })

  const { writeContractAsync: fundWithdrawalQueueFn, isPending: isFundingQueue } =
    useWriteLiquidityPoolFundWithdrawalQueue({ mutation: { retry: false } })

  const { writeContractAsync: processSwapsFn, isPending: isProcessingSwaps } =
    useWriteLiquidityPoolProcessSwaps({ mutation: { retry: false } })

  const { writeContractAsync: approveTokenFn, isPending: isApproving } =
    useWriteContract({ mutation: { retry: false } })

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries()
    await queryClient.refetchQueries({ type: 'active' })
  }, [queryClient])

  const waitAndInvalidate = useCallback(
    async (txHash: `0x${string}`) => {
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        if (receipt.status === 'reverted') {
          throw new Error('Transaction was reverted on-chain. The contract rejected the operation.')
        }
      }
      // Delay to allow RPC node state to propagate after block confirmation
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await invalidateAll()
    },
    [publicClient, invalidateAll]
  )

  const deposit = useCallback(
    async (token: `0x${string}`, amount: bigint, lockDuration: bigint, nonEarning: boolean) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await depositFn({
        args: [token, amount, lockDuration, nonEarning],
        value: depositNativeFee ?? 0n,
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, depositFn, depositNativeFee, waitAndInvalidate]
  )

  const requestWithdrawal = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await requestWithdrawalFn({ args: [amount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, requestWithdrawalFn, waitAndInvalidate]
  )

  const claimEarnings = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected')
    const txHash = await claimEarningsFn({
      value: withdrawNativeFee ?? 0n,
    })
    await waitAndInvalidate(txHash)
    return txHash
  }, [address, claimEarningsFn, withdrawNativeFee, waitAndInvalidate])

  const compoundEarnings = useCallback(
    async (lockDuration: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await compoundEarningsFn({
        args: [lockDuration],
        value: depositNativeFee ?? 0n,
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, compoundEarningsFn, depositNativeFee, waitAndInvalidate]
  )

  const relockLiquidity = useCallback(
    async (amount: bigint, lockDuration: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await relockLiquidityFn({ args: [amount, lockDuration] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, relockLiquidityFn, waitAndInvalidate]
  )

  const pullEarnings = useCallback(async () => {
    const txHash = await pullEarningsFn({})
    await waitAndInvalidate(txHash)
    return txHash
  }, [pullEarningsFn, waitAndInvalidate])

  const transferPendingEarnings = useCallback(
    async (to: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await transferPendingEarningsFn({ args: [to, amount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, transferPendingEarningsFn, waitAndInvalidate]
  )

  const transferShares = useCallback(
    async (to: `0x${string}`, shareAmount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await transferSharesFn({ args: [to, shareAmount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, transferSharesFn, waitAndInvalidate]
  )

  const claimWithdrawal = useCallback(
    async (requestId: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await claimWithdrawalFn({
        args: [requestId],
        value: withdrawNativeFee ?? 0n,
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, claimWithdrawalFn, withdrawNativeFee, waitAndInvalidate]
  )

  const cancelWithdrawal = useCallback(
    async (requestId: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await cancelWithdrawalFn({ args: [requestId] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, cancelWithdrawalFn, waitAndInvalidate]
  )

  const fundWithdrawalQueue = useCallback(async () => {
    const txHash = await fundWithdrawalQueueFn({})
    await waitAndInvalidate(txHash)
    return txHash
  }, [fundWithdrawalQueueFn, waitAndInvalidate])

  const processSwaps = useCallback(
    async (token: `0x${string}`) => {
      const txHash = await processSwapsFn({ args: [token] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [processSwapsFn, waitAndInvalidate]
  )

  const approveToken = useCallback(
    async (amount: bigint, tokenAddress: `0x${string}`, spender: `0x${string}`) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await approveTokenFn({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      })
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }
      await queryClient.invalidateQueries()
      return txHash
    },
    [address, approveTokenFn, publicClient, queryClient]
  )

  const isTransacting =
    isDepositing ||
    isRequestingWithdrawal ||
    isClaiming ||
    isCompounding ||
    isRelocking ||
    isPulling ||
    isTransferringEarnings ||
    isTransferringShares ||
    isClaimingWithdrawal ||
    isCancellingWithdrawal ||
    isFundingQueue ||
    isProcessingSwaps ||
    isApproving

  return {
    deposit,
    requestWithdrawal,
    claimEarnings,
    compoundEarnings,
    relockLiquidity,
    pullEarnings,
    transferPendingEarnings,
    transferShares,
    claimWithdrawal,
    cancelWithdrawal,
    fundWithdrawalQueue,
    processSwaps,
    approveToken,
    depositFeeUSD,
    withdrawFeeUSD,
    isTransacting,
    error: null,
  }
}
