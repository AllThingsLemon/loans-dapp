'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  REFERRAL_STORAGE_KEY,
  isSelfReferral,
  normalizeReferrer,
  parseReferrerFromSearch
} from '@/src/utils/referral'

export interface UseReferralParamReturn {
  /** Checksummed referrer address, or null when none was captured. */
  referrer: `0x${string}` | null
  /** Where the referrer came from — null when there is none. */
  source: 'url' | 'storage' | null
  /** True when a referrer is present and well-formed. */
  isValid: boolean
  /** True when the referrer is the connected wallet — reverts on-chain. */
  isSelfReferral: boolean
}

/**
 * Captures the referrer from `?ref=0x…` or `?affiliate=0x…` and remembers it.
 *
 * The affiliate dapp generates `?affiliate=`, this dapp's own links use `?ref=`,
 * so both are accepted. The value is persisted to sessionStorage because the
 * user typically lands on the link, navigates to /liquidity and completes a
 * wallet-connect round-trip before depositing — any of which drops the query
 * string. Session (not local) storage keeps the attribution scoped to the visit.
 *
 * Reading `window.location` rather than `useSearchParams()` is deliberate: the
 * latter forces the consuming route into a Suspense boundary under the app
 * router, which would restructure pages this task must leave alone.
 */
export function useReferralParam(): UseReferralParamReturn {
  const { address } = useAccount()
  const [captured, setCaptured] = useState<{
    referrer: `0x${string}` | null
    source: 'url' | 'storage' | null
  }>({ referrer: null, source: null })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const fromUrl = parseReferrerFromSearch(window.location.search)
    if (fromUrl) {
      try {
        window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, fromUrl)
      } catch {
        // Private-mode / disabled storage — the referrer still works for this
        // page view, it just won't survive navigation.
      }
      setCaptured({ referrer: fromUrl, source: 'url' })
      return
    }

    let stored: string | null = null
    try {
      stored = window.sessionStorage.getItem(REFERRAL_STORAGE_KEY)
    } catch {
      stored = null
    }
    const fromStorage = normalizeReferrer(stored)
    setCaptured(
      fromStorage
        ? { referrer: fromStorage, source: 'storage' }
        : { referrer: null, source: null }
    )
  }, [])

  return useMemo(
    () => ({
      referrer: captured.referrer,
      source: captured.source,
      isValid: captured.referrer !== null,
      isSelfReferral: isSelfReferral(captured.referrer, address)
    }),
    [captured, address]
  )
}
