import { useCallback, useState } from 'react'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract
} from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { erc20Abi, isAddress, getAddress, maxUint256 } from 'viem'
import {
  loansAbi,
  loansAddress,
  useReadLoansOriginationFeeToken,
  useWriteLoansSetOriginationDelegate
} from '@/src/generated'

export type DelegationFormState =
  | 'empty'
  | 'invalid-format'
  | 'self'
  | 'loading'
  | 'not-delegated'
  | 'delegated'

export interface UseDelegationManagerResult {
  state: DelegationFormState
  /** Normalized checksummed address (when format is valid). */
  normalizedBorrower: `0x${string}` | undefined
  /** True when the connected wallet's LMLN allowance is effectively unlimited. */
  hasMaxLmlnAllowance: boolean
  /** Approve max LMLN to the Loans contract (if needed), then setOriginationDelegate(borrower, true). */
  delegate: (borrower: `0x${string}`) => Promise<void>
  /** Call setOriginationDelegate(borrower, false). */
  revoke: (borrower: `0x${string}`) => Promise<void>
  isProcessing: boolean
  isApprovingLmln: boolean
  isWritingDelegation: boolean
}

// Treat "max-approved" as anything above half of maxUint256 — won't realistically
// be exhausted by ordinary origination-fee transfers.
const EFFECTIVE_MAX_THRESHOLD = maxUint256 / 2n

export function useDelegationManager(
  candidate: string
): UseDelegationManagerResult {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const loansContractAddress = loansAddress[chainId as keyof typeof loansAddress]
  const { data: feeTokenAddress } = useReadLoansOriginationFeeToken()

  const trimmed = candidate.trim()
  const formatValid = trimmed.length > 0 && isAddress(trimmed)
  const normalizedBorrower = formatValid
    ? (getAddress(trimmed) as `0x${string}`)
    : undefined
  const isSelf =
    !!normalizedBorrower &&
    !!address &&
    normalizedBorrower.toLowerCase() === address.toLowerCase()

  const enable = !!normalizedBorrower && !!address && !isSelf

  // The ABI doesn't name the `originationDelegations` mapping args, so we
  // read both directions and accept whichever returns true. Raw
  // useReadContract avoids a TS2589 deep-instantiation error that occurs
  // when both the typed read and the typed write are imported in this file.
  const {
    data: readA,
    isLoading: isLoadingA,
    refetch: refetchA
  } = useReadContract({
    address: loansContractAddress,
    abi: loansAbi,
    functionName: 'originationDelegations',
    args:
      enable && normalizedBorrower && address
        ? [normalizedBorrower, address]
        : undefined,
    query: { enabled: enable && !!loansContractAddress }
  })
  const {
    data: readB,
    isLoading: isLoadingB,
    refetch: refetchB
  } = useReadContract({
    address: loansContractAddress,
    abi: loansAbi,
    functionName: 'originationDelegations',
    args:
      enable && normalizedBorrower && address
        ? [address, normalizedBorrower]
        : undefined,
    query: { enabled: enable && !!loansContractAddress }
  })
  const isCheckingDelegation = isLoadingA || isLoadingB
  const bothUndefined = readA === undefined && readB === undefined
  const isAlreadyDelegated = bothUndefined
    ? undefined
    : Boolean(readA) || Boolean(readB)

  // Connected wallet's LMLN allowance to the Loans contract — drives the
  // "skip approval" path on delegate().
  const { data: myLmlnAllowance, refetch: refetchAllowance } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      address && loansContractAddress
        ? [address, loansContractAddress]
        : undefined,
    query: {
      enabled: !!feeTokenAddress && !!address && !!loansContractAddress
    }
  })
  const hasMaxLmlnAllowance =
    myLmlnAllowance !== undefined && myLmlnAllowance >= EFFECTIVE_MAX_THRESHOLD

  const { writeContractAsync: approveLmln } = useWriteContract({
    mutation: { retry: false }
  })
  const { writeContractAsync: setDelegate } =
    useWriteLoansSetOriginationDelegate({
      mutation: { retry: false }
    })

  const [isApprovingLmln, setIsApprovingLmln] = useState(false)
  const [isWritingDelegation, setIsWritingDelegation] = useState(false)

  // Wait for a tx to land and throw if it reverted — a reverted approval or
  // delegation write must never surface as a success toast.
  const waitForSuccess = useCallback(
    async (hash: `0x${string}`, label: string) => {
      if (!publicClient) return
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'reverted') {
        throw new Error(
          `${label} transaction was reverted on-chain. No changes were made — please try again.`
        )
      }
    },
    [publicClient]
  )

  const refreshAfterTx = useCallback(async () => {
    // Drop all originationDelegations cache entries so any other consumer
    // (e.g. the borrower-side OriginationPayerField) refetches on next read,
    // then explicitly refetch this hook's reads so the local CTA updates
    // immediately.
    queryClient.removeQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey.some(
          (part) =>
            typeof part === 'object' &&
            part !== null &&
            'functionName' in part &&
            (part as { functionName?: string }).functionName ===
              'originationDelegations'
        )
    })
    await Promise.all([refetchA(), refetchB()])
  }, [queryClient, refetchA, refetchB])

  const delegate = useCallback(
    async (borrower: `0x${string}`) => {
      if (!address) throw new Error('Connect a wallet first.')
      if (!loansContractAddress) throw new Error('Loans contract not found.')
      if (!feeTokenAddress) throw new Error('LMLN token not found.')

      if (!hasMaxLmlnAllowance) {
        setIsApprovingLmln(true)
        try {
          const approvalHash = await approveLmln({
            address: feeTokenAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [loansContractAddress, maxUint256]
          })
          await waitForSuccess(approvalHash, 'LMLN approval')
          await refetchAllowance()
        } finally {
          setIsApprovingLmln(false)
        }
      }

      setIsWritingDelegation(true)
      try {
        const hash = await setDelegate({ args: [borrower, true] })
        await waitForSuccess(hash, 'Delegation')
        await refreshAfterTx()
      } finally {
        setIsWritingDelegation(false)
      }
    },
    [
      address,
      loansContractAddress,
      feeTokenAddress,
      hasMaxLmlnAllowance,
      approveLmln,
      waitForSuccess,
      refetchAllowance,
      setDelegate,
      refreshAfterTx
    ]
  )

  const revoke = useCallback(
    async (borrower: `0x${string}`) => {
      if (!address) throw new Error('Connect a wallet first.')
      setIsWritingDelegation(true)
      try {
        const hash = await setDelegate({ args: [borrower, false] })
        await waitForSuccess(hash, 'Revocation')
        await refreshAfterTx()
      } finally {
        setIsWritingDelegation(false)
      }
    },
    [address, setDelegate, waitForSuccess, refreshAfterTx]
  )

  const state: DelegationFormState =
    trimmed.length === 0
      ? 'empty'
      : !formatValid
      ? 'invalid-format'
      : isSelf
      ? 'self'
      : isCheckingDelegation || isAlreadyDelegated === undefined
      ? 'loading'
      : isAlreadyDelegated
      ? 'delegated'
      : 'not-delegated'

  return {
    state,
    normalizedBorrower,
    hasMaxLmlnAllowance,
    delegate,
    revoke,
    isProcessing: isApprovingLmln || isWritingDelegation,
    isApprovingLmln,
    isWritingDelegation
  }
}
