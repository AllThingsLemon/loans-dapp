'use client'
import { useEffect, useState } from 'react'
import {
  REFERRAL_STORAGE_KEY,
  captureReferral,
  type StoredReferralPair
} from '@/src/utils/referral'

export interface UseReferralParamReturn {
  /** Checksummed affiliate address, or null when missing or malformed. */
  referrer: `0x${string}` | null
  /** Checksummed per-company commissions contract, or null. */
  commissions: `0x${string}` | null
  /** True when the visitor arrived with a referral link, valid or not. */
  hasLink: boolean
}

interface StoredPair {
  referrer: string
  commissions: string
}

function readStored(): StoredPair | null {
  try {
    const raw = window.sessionStorage.getItem(REFERRAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredPair>
    if (!parsed || typeof parsed !== 'object') return null
    if (!parsed.referrer || !parsed.commissions) return null
    return { referrer: parsed.referrer, commissions: parsed.commissions }
  } catch {
    // Private-mode storage, or a value written by an older build.
    return null
  }
}

function writeStored(pair: StoredReferralPair | null) {
  try {
    if (pair) {
      window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(pair))
    } else {
      window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
    }
  } catch {
    // Storage unavailable — the link still works for this page view, it just
    // won't survive navigation.
  }
}

/**
 * Captures the referral link and remembers it for the visit.
 *
 * A link carries two halves — the affiliate (`?affiliate=`) and the
 * per-company commissions contract (`?commissions=`) — treated as a PAIR, and
 * the FIRST valid pair of the visit wins; a later link never replaces or
 * clears it. The policy itself lives in captureReferral (pure, unit-tested);
 * this hook only wires it to window.location and sessionStorage.
 *
 * Session (not local) storage keeps the attribution scoped to the visit, and
 * survives the navigation and wallet-connect round-trip that drop the query
 * string.
 *
 * Reading `window.location` rather than `useSearchParams()` is deliberate: the
 * latter forces the consuming route into a Suspense boundary under the app
 * router, which would restructure pages this change must leave alone.
 */
export function useReferralParam(): UseReferralParamReturn {
  const [captured, setCaptured] = useState<UseReferralParamReturn>({
    referrer: null,
    commissions: null,
    hasLink: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const { referrer, commissions, hasLink, store } = captureReferral(
      window.location.search,
      readStored()
    )
    writeStored(store)
    setCaptured({ referrer, commissions, hasLink })
  }, [])

  return captured
}
