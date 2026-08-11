'use client'
import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useReferralParam } from './useReferralParam'
import {
  useReferralRouter,
  type UseReferralRouterReturn
} from './useReferralRouter'
import { evaluateReferralGate, type ReferralGate } from '@/src/utils/referral'

export interface ReferralState {
  /** Affiliate address from the link, or null when missing/malformed. */
  referrer: `0x${string}` | null
  /** Per-company commissions contract from the link, or null. */
  commissions: `0x${string}` | null
  /** True when the visitor arrived with a referral link, valid or not. */
  hasLink: boolean
  /** All router/commissions reads backing the banner. */
  router: UseReferralRouterReturn
  /**
   * The verdict: whether this visitor may deposit, and why not if they may
   * not. Both the banner and the deposit form read this and nothing else, so
   * the two can never disagree about what is allowed.
   */
  gate: ReferralGate
  /**
   * Reported by the deposit form as the user types, so the banner can show an
   * estimate for the amount currently entered. The amount lives in the form,
   * but the banner renders a level above it.
   */
  setPendingStableValue: (value: bigint | undefined) => void
}

/**
 * Composes the referral link capture, the router reads and the access decision
 * so the banner and the deposit form share one instance.
 *
 * Owned by LiquidityDashboard rather than AddLiquidityCard because the banner
 * spans the full width of the dashboard, above both liquidity cards — it cannot
 * render from inside one of them.
 *
 * Inert unless a router is configured for the active chain: see
 * useReferralRouter, which gates every read on isReferralEnabled(chainId), and
 * evaluateReferralGate, which returns 'disabled' so the legacy deposit path
 * applies untouched.
 */
export function useReferralState(expectedPool?: `0x${string}`): ReferralState {
  const { address } = useAccount()
  const { referrer, commissions, hasLink } = useReferralParam()
  const [pendingStableValue, setPendingStableValue] = useState<
    bigint | undefined
  >(undefined)

  const router = useReferralRouter({
    referrer,
    commissions,
    pendingStableValue,
    expectedPool
  })

  const gate = useMemo(
    () =>
      evaluateReferralGate({
        enabled: router.enabled,
        referrer,
        commissions,
        hasLink,
        account: address,
        allowedCommissions: router.allowedCommissions,
        isRegistered: router.isRegistered,
        isPaused: router.isPaused,
        hasPoolMismatch: router.hasPoolMismatch
      }),
    [
      router.enabled,
      router.allowedCommissions,
      router.isRegistered,
      router.isPaused,
      router.hasPoolMismatch,
      referrer,
      commissions,
      hasLink,
      address
    ]
  )

  return {
    referrer,
    commissions,
    hasLink,
    router,
    gate,
    setPendingStableValue
  }
}
