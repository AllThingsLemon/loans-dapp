import { useCallback } from 'react'
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { erc20Abi } from 'viem'
import {
  useWriteLiquidityPoolDeposit,
  useWriteLiquidityPoolRequestWithdrawal,
  useWriteLiquidityPoolClaimEarnings,
  useWriteLiquidityPoolCompoundEarnings,
  useWriteLiquidityPoolRelockLiquidity,
  useWriteLiquidityPoolPullEarnings,
  useWriteLiquidityPoolTransferAccount,
  useWriteLiquidityPoolClaimWithdrawal,
  useWriteLiquidityPoolFundWithdrawalQueue,
  useWriteLiquidityPoolProcessSwaps,
  useReadLiquidityPoolDepositFeeUsd,
  useReadLiquidityPoolWithdrawFeeUsd,
  useReadLoansGetNativeFee,
  loansAddress,
  loansAbi,
  liquidityPoolAddress,
  liquidityPoolAbi,
} from '@/src/generated'

export interface UseLiquidityOperationsReturn {
  deposit: (token: `0x${string}`, amount: bigint, lockDuration: bigint, nonEarning: boolean) => Promise<`0x${string}` | undefined>
  requestWithdrawal: (amount: bigint) => Promise<`0x${string}` | undefined>
  claimEarnings: () => Promise<`0x${string}` | undefined>
  compoundEarnings: (lockDuration: bigint) => Promise<`0x${string}` | undefined>
  relockLiquidity: (amount: bigint, lockDuration: bigint) => Promise<`0x${string}` | undefined>
  pullEarnings: () => Promise<`0x${string}` | undefined>
  transferAccount: (to: `0x${string}`) => Promise<`0x${string}` | undefined>
  claimWithdrawal: (requestId: bigint) => Promise<`0x${string}` | undefined>
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
  const chainId = useChainId()
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

  const { writeContractAsync: transferAccountFn, isPending: isTransferringAccount } =
    useWriteLiquidityPoolTransferAccount({ mutation: { retry: false } })

  const { writeContractAsync: claimWithdrawalFn, isPending: isClaimingWithdrawal } =
    useWriteLiquidityPoolClaimWithdrawal({ mutation: { retry: false } })

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
          // Re-simulate the exact transaction to extract the real revert reason.
          // We simulate at blockNumber - 1 (just before the block that included the tx)
          // so the pre-state matches what the tx saw when it executed.
          let revertError: unknown = null
          try {
            const tx = await publicClient.getTransaction({ hash: txHash })
            await publicClient.call({
              to: tx.to ?? undefined,
              data: tx.input,
              value: tx.value,
              account: tx.from,
              gas: tx.gas,
              blockNumber: receipt.blockNumber > 0n ? receipt.blockNumber - 1n : 0n,
            })
          } catch (simErr: unknown) {
            revertError = simErr
          }
          throw revertError ?? new Error('Transaction was reverted on-chain. The contract rejected the operation.')
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

      // Always resolve the native fee fresh from chain to avoid stale hook state.
      // The deposit() function on LiquidityPool is payable and requires TLEMX fee.
      let nativeFee = depositNativeFee ?? 0n
      if (publicClient) {
        try {
          const lpAddr = liquidityPoolAddress[chainId as keyof typeof liquidityPoolAddress]
          const loansAddr = loansAddress[chainId as keyof typeof loansAddress]
          if (lpAddr && loansAddr) {
            const feeUSD = await publicClient.readContract({
              address: lpAddr,
              abi: liquidityPoolAbi,
              functionName: 'depositFeeUSD',
            }) as bigint
            if (feeUSD > 0n) {
              nativeFee = await publicClient.readContract({
                address: loansAddr,
                abi: loansAbi,
                functionName: 'getNativeFee',
                args: [feeUSD],
              }) as bigint
            }
          }
        } catch {
          // fee read failed — fall back to hook value
        }
      }

      let gasEstimate: bigint | undefined
      if (publicClient) {
        try {
          const lpAddr = liquidityPoolAddress[chainId as keyof typeof liquidityPoolAddress]
          if (lpAddr) {
            const estimated = await publicClient.estimateContractGas({
              address: lpAddr,
              abi: liquidityPoolAbi,
              functionName: 'deposit',
              args: [token, amount, lockDuration, nonEarning],
              value: nativeFee,
              account: address,
            })
            gasEstimate = (estimated * 120n) / 100n // 20% buffer
          }
        } catch {
          // gas estimation failed — send without gas override and let wallet decide
        }
      }

      const txHash = await depositFn({
        args: [token, amount, lockDuration, nonEarning],
        value: nativeFee,
        ...(gasEstimate !== undefined ? { gas: gasEstimate } : {}),
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, chainId, depositFn, depositNativeFee, publicClient, waitAndInvalidate]
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
      gas: 300_000n,
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
        gas: 500_000n,
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

  const transferAccount = useCallback(
    async (to: `0x${string}`) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await transferAccountFn({ args: [to] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, transferAccountFn, waitAndInvalidate]
  )

  const claimWithdrawal = useCallback(
    async (requestId: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await claimWithdrawalFn({
        args: [requestId],
        value: withdrawNativeFee ?? 0n,
        gas: 300_000n,
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, claimWithdrawalFn, withdrawNativeFee, waitAndInvalidate]
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
    isTransferringAccount ||
    isClaimingWithdrawal ||
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
    transferAccount,
    claimWithdrawal,
    fundWithdrawalQueue,
    processSwaps,
    approveToken,
    depositFeeUSD,
    withdrawFeeUSD,
    isTransacting,
    error: null,
  }
}
