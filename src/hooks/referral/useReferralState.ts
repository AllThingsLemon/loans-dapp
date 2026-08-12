'use client'
import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useReferralParam } from './useReferralParam'
import {
  useReferralRouter,
  type UseReferralRouterReturn
} from './useReferralRouter'
import { evaluateReferralGate, type ReferralGate } from '@/src/utils/referral'

export interface ReferralState {
  /**
   * Affiliate address as it appeared in the LINK. May differ from the one that
   * actually gets credited — see `gate.referrer`, which the UI and the deposit
   * both use. The two are compared to decide whether to warn the visitor.
   */
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

  const router = useReferralRouter({
    referrer,
    commissions,
    account: address,
    expectedPool
  })

  const gate = useMemo(
    () =>
      evaluateReferralGate({
        enabled: router.enabled,
        referrer: router.effectiveReferrer,
        commissions,
        hasLink,
        account: address,
        allowedCommissions: router.allowedCommissions,
        isRegistered: router.isRegistered,
        isPaused: router.isPaused,
        hasPoolMismatch: router.hasPoolMismatch,
        isResolvingSponsor: router.isResolvingSponsor
      }),
    [
      router.enabled,
      router.effectiveReferrer,
      router.isResolvingSponsor,
      router.allowedCommissions,
      router.isRegistered,
      router.isPaused,
      router.hasPoolMismatch,
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
    gate
  }
}
