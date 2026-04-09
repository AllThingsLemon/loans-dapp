import { useCallback } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { erc20Abi } from 'viem'
import {
  useWriteLiquidityPoolDepositLiquidity,
  useWriteLiquidityPoolDepositNonEarningLiquidity,
  useWriteLiquidityPoolWithdrawLiquidity,
  useWriteLiquidityPoolClaimEarnings,
  useWriteLiquidityPoolCompoundEarnings,
  useWriteLiquidityPoolRelockLiquidity,
  useWriteLiquidityPoolPullEarnings,
  useWriteLiquidityPoolTransferPendingEarnings,
  useWriteLiquidityPoolTransferShares,
  useWriteLiquidityPoolTransferNonEarningShares,
} from '@/src/generated'

export interface UseLiquidityOperationsReturn {
  depositLiquidity: (amount: bigint) => Promise<`0x${string}` | undefined>
  depositNonEarningLiquidity: (amount: bigint) => Promise<`0x${string}` | undefined>
  withdrawLiquidity: (amount: bigint) => Promise<`0x${string}` | undefined>
  claimEarnings: () => Promise<`0x${string}` | undefined>
  compoundEarnings: () => Promise<`0x${string}` | undefined>
  relockLiquidity: (amount: bigint) => Promise<`0x${string}` | undefined>
  pullEarnings: () => Promise<`0x${string}` | undefined>
  transferPendingEarnings: (to: `0x${string}`, amount: bigint) => Promise<`0x${string}` | undefined>
  transferShares: (to: `0x${string}`, shareAmount: bigint) => Promise<`0x${string}` | undefined>
  transferNonEarningShares: (to: `0x${string}`, shareAmount: bigint) => Promise<`0x${string}` | undefined>
  approveToken: (amount: bigint, tokenAddress: `0x${string}`, spender: `0x${string}`) => Promise<`0x${string}` | undefined>
  isTransacting: boolean
  error: Error | null
}

export function useLiquidityOperations(): UseLiquidityOperationsReturn {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // Write hooks
  const { writeContractAsync: depositLiquidityFn, isPending: isDepositing } =
    useWriteLiquidityPoolDepositLiquidity({ mutation: { retry: false } })

  const { writeContractAsync: depositNonEarningLiquidityFn, isPending: isDepositingNonEarning } =
    useWriteLiquidityPoolDepositNonEarningLiquidity({ mutation: { retry: false } })

  const { writeContractAsync: withdrawLiquidityFn, isPending: isWithdrawing } =
    useWriteLiquidityPoolWithdrawLiquidity({ mutation: { retry: false } })

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

  const { writeContractAsync: transferNonEarningSharesFn, isPending: isTransferringNonEarningShares } =
    useWriteLiquidityPoolTransferNonEarningShares({ mutation: { retry: false } })

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

  const depositLiquidity = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await depositLiquidityFn({ args: [amount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, depositLiquidityFn, waitAndInvalidate]
  )

  const depositNonEarningLiquidity = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await depositNonEarningLiquidityFn({ args: [amount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, depositNonEarningLiquidityFn, waitAndInvalidate]
  )

  const withdrawLiquidity = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await withdrawLiquidityFn({ args: [amount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, withdrawLiquidityFn, waitAndInvalidate]
  )

  const claimEarnings = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected')
    const txHash = await claimEarningsFn({})
    await waitAndInvalidate(txHash)
    return txHash
  }, [address, claimEarningsFn, waitAndInvalidate])

  const compoundEarnings = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected')
    const txHash = await compoundEarningsFn({})
    await waitAndInvalidate(txHash)
    return txHash
  }, [address, compoundEarningsFn, waitAndInvalidate])

  const relockLiquidity = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await relockLiquidityFn({ args: [amount] })
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

  const transferNonEarningShares = useCallback(
    async (to: `0x${string}`, shareAmount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await transferNonEarningSharesFn({ args: [to, shareAmount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, transferNonEarningSharesFn, waitAndInvalidate]
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
    isDepositingNonEarning ||
    isWithdrawing ||
    isClaiming ||
    isCompounding ||
    isRelocking ||
    isPulling ||
    isTransferringEarnings ||
    isTransferringShares ||
    isTransferringNonEarningShares ||
    isApproving

  return {
    depositLiquidity,
    depositNonEarningLiquidity,
    withdrawLiquidity,
    claimEarnings,
    compoundEarnings,
    relockLiquidity,
    pullEarnings,
    transferPendingEarnings,
    transferShares,
    transferNonEarningShares,
    approveToken,
    isTransacting,
    error: null,
  }
}
