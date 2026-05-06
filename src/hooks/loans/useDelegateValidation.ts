import { useMemo } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { erc20Abi, isAddress, getAddress } from 'viem'
import {
  loansAbi,
  loansAddress,
  useReadLoansOriginationFeeToken
} from '@/src/generated'

export type DelegateValidationState =
  | 'empty'
  | 'invalid-format'
  | 'self'
  | 'loading'
  | 'not-delegated'
  | 'valid'

export interface DelegateValidationResult {
  state: DelegateValidationState
  isValid: boolean
  /** Normalized checksummed address, or undefined if not parseable. */
  normalizedAddress: `0x${string}` | undefined
  /** True when the candidate equals the connected wallet. */
  isSelf: boolean
  /** Delegate wallet's LMLN balance (used by the field for an info line). */
  delegateLmlnBalance: bigint | undefined
}

/**
 * Validates a candidate origination-fee payer.
 *
 * - 'self' (always valid): the candidate equals the connected wallet. The
 *   contract skips the delegation check when `originationPayer == msg.sender`.
 * - 'valid': the candidate has authorized the borrower as a delegate, in
 *   either storage direction (the ABI doesn't name the mapping args, so we
 *   read both `[a][b]` and `[b][a]` and accept whichever returns true).
 * - Balance/allowance shortfalls are surfaced separately by LoanSummary's
 *   existing "insufficient LMLN balance" warning, which already reads the
 *   delegate's wallet whenever `originationPayer` is wired through useLoans.
 */
export function useDelegateValidation(
  candidate: string
): DelegateValidationResult {
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  const loansContractAddress = loansAddress[chainId as keyof typeof loansAddress]
  const { data: feeTokenAddress } = useReadLoansOriginationFeeToken()

  const trimmed = candidate.trim()
  const formatValid = trimmed.length > 0 && isAddress(trimmed)
  const normalizedAddress = formatValid
    ? (getAddress(trimmed) as `0x${string}`)
    : undefined
  const isSelf =
    !!normalizedAddress &&
    !!connectedAddress &&
    normalizedAddress.toLowerCase() === connectedAddress.toLowerCase()

  const enable = !!normalizedAddress && !!connectedAddress && !isSelf

  const { data: readA, isLoading: isLoadingA } = useReadContract({
    address: loansContractAddress,
    abi: loansAbi,
    functionName: 'originationDelegations',
    args:
      enable && connectedAddress && normalizedAddress
        ? [connectedAddress, normalizedAddress]
        : undefined,
    query: { enabled: enable && !!loansContractAddress }
  })
  const { data: readB, isLoading: isLoadingB } = useReadContract({
    address: loansContractAddress,
    abi: loansAbi,
    functionName: 'originationDelegations',
    args:
      enable && connectedAddress && normalizedAddress
        ? [normalizedAddress, connectedAddress]
        : undefined,
    query: { enabled: enable && !!loansContractAddress }
  })
  const isCheckingDelegation = isLoadingA || isLoadingB
  const isAuthorized = Boolean(readA) || Boolean(readB)

  // Delegate's LMLN balance — shown for context once verified. Useful for
  // the borrower to see their delegate has funds before submitting.
  const { data: delegateLmlnBalance } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: enable && normalizedAddress ? [normalizedAddress] : undefined,
    query: { enabled: enable && !!feeTokenAddress }
  })

  return useMemo<DelegateValidationResult>(() => {
    if (trimmed.length === 0) {
      return {
        state: 'empty',
        isValid: false,
        normalizedAddress: undefined,
        isSelf: false,
        delegateLmlnBalance: undefined
      }
    }
    if (!formatValid || !normalizedAddress) {
      return {
        state: 'invalid-format',
        isValid: false,
        normalizedAddress: undefined,
        isSelf: false,
        delegateLmlnBalance: undefined
      }
    }
    if (isSelf) {
      return {
        state: 'self',
        isValid: true,
        normalizedAddress,
        isSelf: true,
        delegateLmlnBalance: undefined
      }
    }
    if (isCheckingDelegation) {
      return {
        state: 'loading',
        isValid: false,
        normalizedAddress,
        isSelf: false,
        delegateLmlnBalance
      }
    }
    if (!isAuthorized) {
      return {
        state: 'not-delegated',
        isValid: false,
        normalizedAddress,
        isSelf: false,
        delegateLmlnBalance
      }
    }
    return {
      state: 'valid',
      isValid: true,
      normalizedAddress,
      isSelf: false,
      delegateLmlnBalance
    }
  }, [
    trimmed,
    formatValid,
    normalizedAddress,
    isSelf,
    isAuthorized,
    isCheckingDelegation,
    delegateLmlnBalance
  ])
}
