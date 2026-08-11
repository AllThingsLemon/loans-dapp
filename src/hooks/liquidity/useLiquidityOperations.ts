import { useCallback } from 'react'
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { erc20Abi, BaseError, HttpRequestError, TimeoutError } from 'viem'
import {
  useWriteLiquidityPoolDeposit,
  useWriteLiquidityPoolRequestWithdrawal,
  useWriteLiquidityPoolClaimEarnings,
  useWriteLiquidityPoolCompoundEarnings,
  useWriteLiquidityPoolPullEarnings,
  useWriteLiquidityPoolTransferAccount,
  useWriteLiquidityPoolClaimWithdrawal,
  useWriteLiquidityPoolFundWithdrawalQueue,
  useWriteLiquidityPoolProcessSwaps,
  useReadLoansGetNativeFee,
  loansAddress,
  loansAbi,
  liquidityPoolAbi,
  referralDepositRouterAbi,
} from '@/src/generated'
import { useProtocolAddresses } from '@/src/hooks/useProtocolAddresses'
import {
  getReferralRouterAddress,
  isReferralEnabled,
} from '@/src/config/referral'
import { parseReferralOutcome, type ReferralOutcome } from '@/src/utils/referral'

export interface UseLiquidityOperationsReturn {
  deposit: (token: `0x${string}`, amount: bigint, lockDuration: bigint, nonEarning: boolean) => Promise<`0x${string}` | undefined>
  /**
   * Same deposit, routed through ReferralDepositRouter so the referrer earns a
   * commission. Only reachable when a router is configured for the chain and a
   * valid non-self referrer was captured — see useReferralParam.
   */
  depositWithReferral: (
    token: `0x${string}`,
    amount: bigint,
    lockDuration: bigint,
    referrer: `0x${string}`,
    commissions: `0x${string}`
  ) => Promise<{ txHash: `0x${string}`; outcome: ReferralOutcome }>
  /** Spender the deposit approval must target — the router on the referral path. */
  referralRouterAddress: `0x${string}` | undefined
  requestWithdrawal: (amount: bigint) => Promise<`0x${string}` | undefined>
  claimEarnings: () => Promise<`0x${string}` | undefined>
  compoundEarnings: (lockDuration: bigint) => Promise<`0x${string}` | undefined>
  pullEarnings: () => Promise<`0x${string}` | undefined>
  transferAccount: (to: `0x${string}`) => Promise<`0x${string}` | undefined>
  claimWithdrawal: (requestId: bigint) => Promise<`0x${string}` | undefined>
  fundWithdrawalQueue: () => Promise<`0x${string}` | undefined>
  processSwaps: (token: `0x${string}`) => Promise<`0x${string}` | undefined>
  approveToken: (amount: bigint, tokenAddress: `0x${string}`, spender: `0x${string}`) => Promise<`0x${string}` | undefined>
  depositFeeUSD: bigint | undefined
  withdrawFeeUSD: bigint | undefined
  /** Native (gas-token) fee for deposit/compound, in wei — for display */
  depositNativeFee: bigint | undefined
  /** Native (gas-token) fee for claims/withdrawals, in wei — for display */
  withdrawNativeFee: bigint | undefined
  isTransacting: boolean
  error: Error | null
}

export function useLiquidityOperations(): UseLiquidityOperationsReturn {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // LiquidityPool address resolved from Loans.liquidityPool()
  const { liquidityPool: lpAddress } = useProtocolAddresses()

  // Referral router — undefined on chains with no router configured, which
  // keeps every referral branch below unreachable.
  // The commissions contract is per-company and travels in the referral link,
  // so it is a call argument rather than config — see useReferralParam.
  const referralRouterAddress = isReferralEnabled(chainId)
    ? getReferralRouterAddress(chainId)
    : undefined

  // Native fee reads — use useReadContract directly to avoid TS deep-instantiation
  // errors when overriding address on the generated LP hooks.
  const { data: depositFeeUSDRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'depositFeeUSD',
    query: { enabled: !!lpAddress },
  })
  const { data: withdrawFeeUSDRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'withdrawFeeUSD',
    query: { enabled: !!lpAddress },
  })
  const depositFeeUSD = depositFeeUSDRaw as bigint | undefined
  const withdrawFeeUSD = withdrawFeeUSDRaw as bigint | undefined

  // Get native fee conversion: pass USD amount, get native wei amount
  // @ts-ignore - wagmi deep type instantiation
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

  // Raw write for the router — the generated hook hits the TS
  // deep-instantiation limit the same way the LiquidityPool ones do.
  const {
    writeContractAsync: writeReferralDepositFn,
    isPending: isDepositingWithReferral,
  } = useWriteContract({ mutation: { retry: false } })

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries()
    await queryClient.refetchQueries({ type: 'active' })
  }, [queryClient])

  // Returns the receipt when one could be fetched — the referral path reads its
  // logs to tell "commission paid" from "commission skipped". Callers that
  // don't need it can keep ignoring the return value.
  const waitAndInvalidate = useCallback(
    async (txHash: `0x${string}`) => {
      let receipt: Awaited<
        ReturnType<NonNullable<typeof publicClient>['waitForTransactionReceipt']>
      > | undefined
      if (publicClient) {
        receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
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
      return receipt
    },
    [publicClient, invalidateAll]
  )

  /**
   * Resolve the native (gas-token) fee for a payable LP operation fresh from
   * chain. Fee = USD amount (LP contract) converted to native wei via
   * Loans.getNativeFee(), which depends on a live price feed. Sending a stale
   * or unresolved value reverts on-chain with InsufficientNativeFee after the
   * user has already paid gas — so when the fee can't be determined, throw the
   * underlying reason (often PriceStale) instead of guessing.
   */
  const resolveNativeFee = useCallback(
    async (feeKind: 'deposit' | 'withdraw') => {
      const hookValue = feeKind === 'deposit' ? depositNativeFee : withdrawNativeFee
      const loansAddr = loansAddress[chainId as keyof typeof loansAddress]
      if (!publicClient || !loansAddr || !lpAddress) return hookValue ?? 0n
      try {
        const feeUSD = await publicClient.readContract({
          address: lpAddress,
          abi: liquidityPoolAbi,
          functionName: feeKind === 'deposit' ? 'depositFeeUSD' : 'withdrawFeeUSD',
        }) as bigint
        if (feeUSD === 0n) return 0n
        return await publicClient.readContract({
          address: loansAddr,
          abi: loansAbi,
          functionName: 'getNativeFee',
          args: [feeUSD],
        }) as bigint
      } catch (feeError) {
        // A recently-fetched hook value is an acceptable fallback — including
        // a legitimately-zero fee on chains with the native fee disabled.
        // Having no value at all is not: surface the real reason rather than
        // sending a transaction destined to revert.
        if (hookValue !== undefined) return hookValue
        throw feeError
      }
    },
    [chainId, lpAddress, publicClient, depositNativeFee, withdrawNativeFee]
  )

  /**
   * Estimate gas with a 20% buffer. Runs against the full LiquidityPool ABI,
   * so a revert here carries the decoded custom error — thrown to the caller
   * so the user sees the real reason BEFORE the wallet prompt, instead of
   * paying gas for a doomed transaction.
   */
  const estimateGasWithBuffer = useCallback(
    async (
      functionName: string,
      args: readonly unknown[] | undefined,
      value: bigint,
      // Defaults to the LiquidityPool; the referral path passes the router so
      // the estimate (and any decoded revert) comes from the contract actually
      // being called.
      target?: { address: `0x${string}`; abi: unknown }
    ): Promise<bigint | undefined> => {
      const to = target?.address ?? lpAddress
      const abi = target?.abi ?? liquidityPoolAbi
      if (!publicClient || !to || !address) return undefined
      try {
        const estimated = await publicClient.estimateContractGas({
          address: to,
          abi,
          functionName,
          args,
          value,
          account: address,
        } as any)
        return (estimated * 120n) / 100n
      } catch (estimationError) {
        // A transport failure (RPC timeout / rate-limit) is not a revert —
        // fall back to the wallet's own estimation instead of hard-blocking
        // a transaction that would succeed. Genuine reverts still throw so
        // the user sees the decoded reason before the wallet prompt.
        const isTransport =
          estimationError instanceof BaseError &&
          estimationError.walk(
            (e) => e instanceof HttpRequestError || e instanceof TimeoutError
          ) !== null
        if (isTransport) return undefined
        throw estimationError
      }
    },
    [publicClient, lpAddress, address]
  )

  const deposit = useCallback(
    async (token: `0x${string}`, amount: bigint, lockDuration: bigint, nonEarning: boolean) => {
      if (!address) throw new Error('Wallet not connected')
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')

      // deposit() is payable — resolve the required native fee fresh from chain.
      const nativeFee = await resolveNativeFee('deposit')

      const gasEstimate = await estimateGasWithBuffer(
        'deposit',
        [token, amount, lockDuration, nonEarning],
        nativeFee
      )

      const txHash = await depositFn({
        address: lpAddress,
        args: [token, amount, lockDuration, nonEarning],
        value: nativeFee,
        ...(gasEstimate !== undefined ? { gas: gasEstimate } : {}),
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, lpAddress, depositFn, resolveNativeFee, estimateGasWithBuffer, waitAndInvalidate]
  )

  /**
   * The referral variant of deposit(). Identical inputs to the plain path —
   * same token, amount and lockDuration the form already computed — plus the
   * referrer and commissions contract from the referral link, and the
   * destination that receives the LP position (the connected wallet).
   *
   * Two things differ from deposit(): the tokens are pulled by the router
   * (so the ROUTER must be the approved spender, see approveToken's caller),
   * and `nonEarning` is not exposed — the router fixes it.
   */
  const depositWithReferral = useCallback(
    async (
      token: `0x${string}`,
      amount: bigint,
      lockDuration: bigint,
      referrer: `0x${string}`,
      commissions: `0x${string}`
    ) => {
      if (!address) throw new Error('Wallet not connected')
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')
      if (!referralRouterAddress) {
        throw new Error('Referral router is not configured for this network')
      }
      if (!commissions) {
        throw new Error('No commissions contract was supplied by the referral link')
      }
      if (referrer.toLowerCase() === address.toLowerCase()) {
        throw new Error('You cannot refer yourself')
      }

      // The router deposits into router.pool(). If that is not the pool the
      // rest of the UI is reading from, the user would be depositing somewhere
      // other than what is on screen — refuse rather than silently diverge.
      if (publicClient) {
        const routerPool = (await publicClient.readContract({
          address: referralRouterAddress,
          abi: referralDepositRouterAbi,
          functionName: 'pool',
        })) as `0x${string}`
        if (routerPool.toLowerCase() !== lpAddress.toLowerCase()) {
          // eslint-disable-next-line no-console
          console.error(
            '[referral] router.pool() does not match the protocol LiquidityPool — refusing referral deposit.',
            { router: referralRouterAddress, routerPool, protocolPool: lpAddress }
          )
          throw new Error(
            'Referral deposits are unavailable: the referral router points at a different liquidity pool than the one shown here. Deposit without the referral link, or contact support.'
          )
        }
      }

      // Same payable native fee as the direct deposit — resolved fresh from
      // chain because an underpayment reverts after the user has paid gas.
      const nativeFee = await resolveNativeFee('deposit')

      const args = [
        token,
        amount,
        lockDuration,
        referrer,
        address, // destination — the connected wallet receives the LP position
        commissions,
      ] as const

      const gasEstimate = await estimateGasWithBuffer(
        'depositWithReferral',
        args,
        nativeFee,
        { address: referralRouterAddress, abi: referralDepositRouterAbi }
      )

      const txHash = await writeReferralDepositFn({
        address: referralRouterAddress,
        abi: referralDepositRouterAbi,
        functionName: 'depositWithReferral',
        args,
        value: nativeFee,
        ...(gasEstimate !== undefined ? { gas: gasEstimate } : {}),
      } as any)

      const receipt = await waitAndInvalidate(txHash)
      // settleCommission is a gas-capped self-call, so the deposit can succeed
      // while the commission is skipped. The receipt is the only place that
      // distinction is recorded.
      return { txHash, outcome: parseReferralOutcome(receipt?.logs) }
    },
    [
      address,
      lpAddress,
      publicClient,
      referralRouterAddress,
      writeReferralDepositFn,
      resolveNativeFee,
      estimateGasWithBuffer,
      waitAndInvalidate,
    ]
  )

  const requestWithdrawal = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')
      const txHash = await requestWithdrawalFn({ address: lpAddress, args: [amount] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, lpAddress, requestWithdrawalFn, waitAndInvalidate]
  )

  const claimEarnings = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected')
    if (!lpAddress) throw new Error('LiquidityPool address not resolved')
    const nativeFee = await resolveNativeFee('withdraw')
    const gasEstimate = await estimateGasWithBuffer('claimEarnings', undefined, nativeFee)
    const txHash = await claimEarningsFn({
      address: lpAddress,
      value: nativeFee,
      ...(gasEstimate !== undefined ? { gas: gasEstimate } : {}),
    })
    await waitAndInvalidate(txHash)
    return txHash
  }, [address, lpAddress, claimEarningsFn, resolveNativeFee, estimateGasWithBuffer, waitAndInvalidate])

  const compoundEarnings = useCallback(
    async (lockDuration: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')
      // Compounding creates a deposit entry, so it charges the deposit fee.
      const nativeFee = await resolveNativeFee('deposit')
      const gasEstimate = await estimateGasWithBuffer('compoundEarnings', [lockDuration], nativeFee)
      const txHash = await compoundEarningsFn({
        address: lpAddress,
        args: [lockDuration],
        value: nativeFee,
        ...(gasEstimate !== undefined ? { gas: gasEstimate } : {}),
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, lpAddress, compoundEarningsFn, resolveNativeFee, estimateGasWithBuffer, waitAndInvalidate]
  )

  const pullEarnings = useCallback(async () => {
    if (!lpAddress) throw new Error('LiquidityPool address not resolved')
    const txHash = await pullEarningsFn({ address: lpAddress })
    await waitAndInvalidate(txHash)
    return txHash
  }, [lpAddress, pullEarningsFn, waitAndInvalidate])

  const transferAccount = useCallback(
    async (to: `0x${string}`) => {
      if (!address) throw new Error('Wallet not connected')
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')
      const txHash = await transferAccountFn({ address: lpAddress, args: [to] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, lpAddress, transferAccountFn, waitAndInvalidate]
  )

  const claimWithdrawal = useCallback(
    async (requestId: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')
      const nativeFee = await resolveNativeFee('withdraw')
      const gasEstimate = await estimateGasWithBuffer('claimWithdrawal', [requestId], nativeFee)
      const txHash = await claimWithdrawalFn({
        address: lpAddress,
        args: [requestId],
        value: nativeFee,
        ...(gasEstimate !== undefined ? { gas: gasEstimate } : {}),
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, lpAddress, claimWithdrawalFn, resolveNativeFee, estimateGasWithBuffer, waitAndInvalidate]
  )

  const fundWithdrawalQueue = useCallback(async () => {
    if (!lpAddress) throw new Error('LiquidityPool address not resolved')
    const txHash = await fundWithdrawalQueueFn({ address: lpAddress })
    await waitAndInvalidate(txHash)
    return txHash
  }, [lpAddress, fundWithdrawalQueueFn, waitAndInvalidate])

  const processSwaps = useCallback(
    async (token: `0x${string}`) => {
      if (!lpAddress) throw new Error('LiquidityPool address not resolved')
      const txHash = await processSwapsFn({ address: lpAddress, args: [token] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [lpAddress, processSwapsFn, waitAndInvalidate]
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
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        if (receipt.status === 'reverted') {
          throw new Error(
            'Approval transaction was reverted on-chain. No changes were made — please try again.'
          )
        }
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
    isPulling ||
    isTransferringAccount ||
    isClaimingWithdrawal ||
    isFundingQueue ||
    isProcessingSwaps ||
    isApproving ||
    isDepositingWithReferral

  return {
    deposit,
    depositWithReferral,
    referralRouterAddress,
    requestWithdrawal,
    claimEarnings,
    compoundEarnings,
    pullEarnings,
    transferAccount,
    claimWithdrawal,
    fundWithdrawalQueue,
    processSwaps,
    approveToken,
    depositFeeUSD,
    withdrawFeeUSD,
    depositNativeFee,
    withdrawNativeFee,
    isTransacting,
    error: null,
  }
}
