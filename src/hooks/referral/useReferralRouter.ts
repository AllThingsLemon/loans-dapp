'use client'
import { useCallback, useMemo } from 'react'
import { useChainId, useReadContract } from 'wagmi'
import { parseAbi } from 'viem'
import { referralDepositRouterAbi } from '@/src/generated'
import {
  getReferralRouterAddress,
  isReferralEnabled
} from '@/src/config/referral'
/**
 * Referrer eligibility lives on the commissions contract, not the router. Its
 * ABI isn't checked into this repo, and only this one function is needed, so it
 * is declared inline rather than adding a whole ABI file for a single read.
 */
const commissionsAbi = parseAbi([
  'function isRegistered(address account) view returns (bool)'
])

export interface UseReferralRouterParams {
  /** Captured referrer, or null when there is none. */
  referrer: `0x${string}` | null
  /**
   * Per-company commissions contract from the referral link. Not configured
   * per chain — one build serves every partner — so it arrives here already
   * validated as an address, and is checked against allowedCommissionsList()
   * below.
   */
  commissions: `0x${string}` | null
  /**
   * The LiquidityPool the rest of the UI is reading from. Compared against
   * `router.pool()` — a mismatch means the referral path would deposit
   * somewhere other than the pool being displayed.
   */
  expectedPool?: `0x${string}`
}

export interface UseReferralRouterReturn {
  /** True when this chain has a router + commissions contract configured. */
  enabled: boolean
  routerAddress: `0x${string}` | undefined
  /**
   * Every commissions contract the router currently allows. `undefined` while
   * the read is in flight — the gate must not judge a link before it arrives.
   */
  allowedCommissions: readonly `0x${string}`[] | undefined
  /** LiquidityPool the router deposits into. */
  routerPool: `0x${string}` | undefined
  /** True when router.pool() differs from the pool the UI is showing. */
  hasPoolMismatch: boolean
  isPaused: boolean
  /** Whether the referrer is registered with the commissions contract. */
  isRegistered: boolean | undefined
  isRegistrationLoading: boolean
  isLoading: boolean
}

/**
 * All on-chain reads backing the referral UI.
 *
 * Every read is gated on `isReferralEnabled(chainId)`, so a build without a
 * router address configured for the active chain issues zero referral RPC
 * traffic — the referral layer is not merely hidden, it is inert.
 */
export function useReferralRouter({
  referrer,
  commissions,
  expectedPool
}: UseReferralRouterParams): UseReferralRouterReturn {
  const chainId = useChainId()
  const enabled = isReferralEnabled(chainId)
  const routerAddress = getReferralRouterAddress(chainId)
  const commissionsAddress = commissions ?? undefined

  // Reads use useReadContract with a loosened ABI type — the generated hooks
  // hit the same TS deep-instantiation limit as the LiquidityPool ones.
  const routerRead = useCallback(
    (functionName: string, args?: readonly unknown[], extraEnabled = true) =>
      ({
        address: routerAddress,
        abi: referralDepositRouterAbi as unknown as any[],
        functionName,
        args,
        query: { enabled: enabled && !!routerAddress && extraEnabled }
      }) as const,
    [routerAddress, enabled]
  )

  const { data: poolRaw, isLoading: poolLoading } = useReadContract(
    routerRead('pool')
  )
  const { data: pausedRaw, isLoading: pausedLoading } = useReadContract(
    routerRead('paused')
  )
  const { data: allowedRaw, isLoading: allowedLoading } = useReadContract(
    routerRead('allowedCommissionsList')
  )
  const {
    data: isRegisteredRaw,
    isLoading: isRegistrationLoading,
    error: isRegistrationError
  } = useReadContract({
    address: commissionsAddress,
    abi: commissionsAbi,
    functionName: 'isRegistered',
    args: referrer ? [referrer] : undefined,
    query: { enabled: enabled && !!commissionsAddress && !!referrer }
  })

  // Fail closed on a read error rather than leaving the gate on 'checking'
  // forever. `commissions` is URL-supplied, so the call can revert simply
  // because the address is not the contract it claims to be — and an
  // unverifiable affiliate is not a registered one.
  const isRegistered = isRegistrationError
    ? false
    : (isRegisteredRaw as boolean | undefined)

  // Left undefined while pending on purpose: evaluateReferralGate returns
  // 'checking' rather than judging a link against a list it hasn't read yet.
  const allowedCommissions = allowedRaw as readonly `0x${string}`[] | undefined

  const routerPool = poolRaw as `0x${string}` | undefined

  const hasPoolMismatch = useMemo(() => {
    if (!enabled || !routerPool || !expectedPool) return false
    return routerPool.toLowerCase() !== expectedPool.toLowerCase()
  }, [enabled, routerPool, expectedPool])

  return {
    enabled,
    routerAddress,
    allowedCommissions,
    routerPool,
    hasPoolMismatch,
    isPaused: (pausedRaw as boolean | undefined) ?? false,
    isRegistered,
    isRegistrationLoading,
    isLoading: enabled && (poolLoading || pausedLoading || allowedLoading)
  }
}
