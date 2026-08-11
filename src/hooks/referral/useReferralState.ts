'use client'
import { useState } from 'react'
import { useReferralParam } from './useReferralParam'
import {
  useReferralRouter,
  type UseReferralRouterReturn
} from './useReferralRouter'

export interface ReferralState {
  /** Checksummed referrer captured from the URL, or null. */
  referrer: `0x${string}` | null
  /** True when the referrer is the connected wallet — reverts on-chain. */
  isSelfReferral: boolean
  /** All router/commissions reads backing the banner and the deposit branch. */
  router: UseReferralRouterReturn
  /**
   * Reported by the deposit form as the user types, so the banner can show an
   * estimate for the amount currently entered. The amount lives in the form,
   * but the banner renders a level above it.
   */
  setPendingStableValue: (value: bigint | undefined) => void
}

/**
 * Composes the referral param capture with the router reads so the banner and
 * the deposit form share one instance.
 *
 * This is owned by LiquidityDashboard rather than AddLiquidityCard because the
 * banner spans the full width of the dashboard, above both liquidity cards —
 * it cannot render from inside one of them.
 *
 * Inert unless a router is configured for the active chain: see
 * useReferralRouter, which gates every read on isReferralEnabled(chainId).
 */
export function useReferralState(expectedPool?: `0x${string}`): ReferralState {
  const { referrer, isSelfReferral } = useReferralParam()
  const [pendingStableValue, setPendingStableValue] = useState<
    bigint | undefined
  >(undefined)

  const router = useReferralRouter({
    referrer,
    pendingStableValue,
    expectedPool
  })

  return { referrer, isSelfReferral, router, setPendingStableValue }
}
