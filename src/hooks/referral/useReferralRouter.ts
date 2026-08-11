'use client'
import { useCallback, useMemo } from 'react'
import { useChainId, useReadContract, useReadContracts } from 'wagmi'
import { erc20Abi, parseAbi } from 'viem'
import { referralDepositRouterAbi } from '@/src/generated'
import {
  getReferralRouterAddress,
  isReferralEnabled
} from '@/src/config/referral'
import {
  estimateCommission,
  tierRateForBps,
  type CommissionTier
} from '@/src/utils/referral'

/**
 * Referrer eligibility lives on the commissions contract, not the router. Its
 * ABI isn't checked into this repo, and only this one function is needed, so it
 * is declared inline rather than adding a whole ABI file for a single read.
 */
const commissionsAbi = parseAbi([
  'function isRegistered(address account) view returns (bool)',
  'function commissionToken() view returns (address)'
])

/** Max tiers read individually. `tierCount()` is 5 today; this is a sanity cap. */
const MAX_TIERS = 32

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
  /** Stable-token value of the deposit currently entered, for the estimate. */
  pendingStableValue?: bigint
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
  tiers: CommissionTier[]
  /** Total referred volume credited to this referrer so far. */
  cumulativeReferred: bigint | undefined
  /** The referrer's current commission rate, in basis points. */
  rateBps: bigint | undefined
  maxCommissionBasisPerTx: bigint | undefined
  /** Whether the referrer is registered with the commissions contract. */
  isRegistered: boolean | undefined
  isRegistrationLoading: boolean
  /** Symbol of the token commissions are allocated in (mLEMX on citron). */
  commissionTokenSymbol: string | undefined
  /** Indicative commission for `pendingStableValue` at the current rate. */
  estimated: { basis: bigint; commission: bigint; isCapped: boolean }
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
  pendingStableValue,
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
  const { data: tierCountRaw } = useReadContract(routerRead('tierCount'))
  const { data: maxBasisRaw } = useReadContract(
    routerRead('maxCommissionBasisPerTx')
  )
  const { data: cumulativeRaw, isLoading: cumulativeLoading } = useReadContract(
    routerRead(
      'cumulativeReferred',
      referrer ? [referrer] : undefined,
      !!referrer
    )
  )

  const tierCount = useMemo(() => {
    const raw = tierCountRaw as bigint | undefined
    if (raw === undefined) return 0
    return Math.min(Number(raw), MAX_TIERS)
  }, [tierCountRaw])

  const { data: tiersRaw, isLoading: tiersLoading } = useReadContracts({
    contracts: Array.from({ length: tierCount }, (_, i) => ({
      address: routerAddress,
      abi: referralDepositRouterAbi as unknown as any[],
      functionName: 'tiers',
      args: [BigInt(i)]
    })) as any[],
    query: { enabled: enabled && !!routerAddress && tierCount > 0 }
  })

  const tiers = useMemo((): CommissionTier[] => {
    if (!tiersRaw) return []
    return tiersRaw
      .map((entry) => {
        // `tiers(uint256)` returns two values, which viem surfaces as a tuple.
        const result = entry?.result as
          | readonly [bigint, number | bigint]
          | undefined
        if (!result) return null
        return { threshold: result[0], rateBps: BigInt(result[1]) }
      })
      .filter((t): t is CommissionTier => t !== null)
  }, [tiersRaw])

  const cumulativeReferred = cumulativeRaw as bigint | undefined

  // Prefer the contract's own tierRateFor() over the local mirror — the local
  // table is only a fallback while the read is in flight.
  const { data: rateBpsRaw } = useReadContract(
    routerRead(
      'tierRateFor',
      cumulativeReferred !== undefined ? [cumulativeReferred] : undefined,
      cumulativeReferred !== undefined
    )
  )

  const rateBps = useMemo(() => {
    const onChain = rateBpsRaw as bigint | undefined
    if (onChain !== undefined) return onChain
    if (cumulativeReferred === undefined || tiers.length === 0) return undefined
    return tierRateForBps(tiers, cumulativeReferred)
  }, [rateBpsRaw, cumulativeReferred, tiers])

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

  const { data: commissionTokenRaw } = useReadContract({
    address: commissionsAddress,
    abi: commissionsAbi,
    functionName: 'commissionToken',
    query: { enabled: enabled && !!commissionsAddress }
  })

  const { data: commissionTokenSymbolRaw } = useReadContract({
    address: commissionTokenRaw as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: enabled && !!commissionTokenRaw }
  })

  // Left undefined while pending on purpose: evaluateReferralGate returns
  // 'checking' rather than judging a link against a list it hasn't read yet.
  const allowedCommissions = allowedRaw as readonly `0x${string}`[] | undefined

  const routerPool = poolRaw as `0x${string}` | undefined

  const hasPoolMismatch = useMemo(() => {
    if (!enabled || !routerPool || !expectedPool) return false
    return routerPool.toLowerCase() !== expectedPool.toLowerCase()
  }, [enabled, routerPool, expectedPool])

  const maxCommissionBasisPerTx = maxBasisRaw as bigint | undefined

  const estimated = useMemo(
    () =>
      estimateCommission({
        stableValue: pendingStableValue ?? 0n,
        rateBps: rateBps ?? 0n,
        maxCommissionBasisPerTx
      }),
    [pendingStableValue, rateBps, maxCommissionBasisPerTx]
  )

  return {
    enabled,
    routerAddress,
    allowedCommissions,
    routerPool,
    hasPoolMismatch,
    isPaused: (pausedRaw as boolean | undefined) ?? false,
    tiers,
    cumulativeReferred,
    rateBps,
    maxCommissionBasisPerTx,
    isRegistered,
    isRegistrationLoading,
    commissionTokenSymbol: commissionTokenSymbolRaw as string | undefined,
    estimated,
    isLoading:
      enabled &&
      (poolLoading ||
        pausedLoading ||
        allowedLoading ||
        tiersLoading ||
        cumulativeLoading)
  }
}
