'use client'
import { useEffect, useState } from 'react'
import {
  REFERRAL_STORAGE_KEY,
  hasReferralParams,
  normalizeReferrer,
  parseReferralLink
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

function writeStored(pair: StoredPair | null) {
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
 * A link carries two halves — the affiliate (`?ref=` or `?affiliate=`) and the
 * per-company commissions contract (`?commissions=`) — and they are treated as
 * a PAIR throughout:
 *
 *  - If the URL carries ANY referral key, the URL is authoritative for BOTH.
 *    A link with an affiliate but no commissions contract is broken, and must
 *    not silently fall back to whatever a previous link left in storage.
 *  - A broken URL therefore also CLEARS storage. Otherwise the visitor would be
 *    blocked while a stale-but-valid pair sat in storage waiting to reappear on
 *    the next navigation, which is impossible to explain.
 *  - Only a fully valid pair is persisted, so what comes back out of storage is
 *    always usable.
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

    const search = window.location.search

    if (hasReferralParams(search)) {
      const { referrer, commissions } = parseReferralLink(search)
      writeStored(referrer && commissions ? { referrer, commissions } : null)
      setCaptured({ referrer, commissions, hasLink: true })
      return
    }

    const stored = readStored()
    if (!stored) {
      setCaptured({
        referrer: null,
        commissions: null,
        hasLink: false
      })
      return
    }

    // Re-validate on the way out: storage is user-writable.
    const referrer = normalizeReferrer(stored.referrer)
    const commissions = normalizeReferrer(stored.commissions)
    setCaptured({ referrer, commissions, hasLink: true })
  }, [])

  return captured
}
