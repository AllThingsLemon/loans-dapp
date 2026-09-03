/**
 * Single source of truth for the referral layer's configuration.
 *
 * Nothing else in the app may read these env vars directly — every consumer
 * goes through the helpers here so the "referral is inert unless a router is
 * configured" rule holds in exactly one place.
 *
 * Two things worth remembering about these values:
 *  - `NEXT_PUBLIC_*` is inlined at BUILD time, so changing any of them requires
 *    a rebuild, not just a redeploy. The literal `process.env.X` reads below are
 *    deliberate: Next only substitutes statically-analysable member expressions,
 *    so a computed lookup like `process.env[key]` would silently be undefined in
 *    the browser bundle.
 *  - `wagmi.config.ts` substitutes the zero address when a router env var is
 *    unset, so a truthiness check alone is not enough to detect "unconfigured".
 */

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const

const CHAINS = {
  LEMON: 1006,
  CITRON: 1005,
  BSC: 56,
  BSC_TESTNET: 97
} as const

/** Normalise an env value to a usable address, treating 0x0…0 as unset. */
function normalizeAddress(raw?: string): `0x${string}` | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return undefined
  if (trimmed.toLowerCase() === ZERO_ADDRESS) return undefined
  return trimmed as `0x${string}`
}

const REFERRAL_ROUTER_ADDRESSES: Record<number, string | undefined> = {
  [CHAINS.LEMON]: process.env.NEXT_PUBLIC_LEMON_REFERRAL_ROUTER_ADDRESS,
  [CHAINS.CITRON]: process.env.NEXT_PUBLIC_CITRON_REFERRAL_ROUTER_ADDRESS,
  [CHAINS.BSC]: process.env.NEXT_PUBLIC_BSC_REFERRAL_ROUTER_ADDRESS,
  [CHAINS.BSC_TESTNET]:
    process.env.NEXT_PUBLIC_BSC_TESTNET_REFERRAL_ROUTER_ADDRESS
}

/**
 * ReferralDepositRouter address for a chain, or undefined when the chain has no
 * router configured (env var unset, zero address, or malformed).
 */
export function getReferralRouterAddress(
  chainId?: number
): `0x${string}` | undefined {
  if (chainId === undefined) return undefined
  return normalizeAddress(REFERRAL_ROUTER_ADDRESSES[chainId])
}

/**
 * The master switch, and the kill switch.
 *
 * True means this chain runs referral-only: a deposit requires a valid referral
 * link. False means there is no router to deposit through, so the app behaves
 * exactly as it did before the referral layer existed — unsetting the router
 * address restores the plain deposit flow on that chain.
 *
 * Only the router is configured per chain. The commissions contract is
 * per-company and arrives in the referral link, so one build serves every
 * partner.
 */
export function isReferralEnabled(chainId?: number): boolean {
  return getReferralRouterAddress(chainId) !== undefined
}

/**
 * Hides the loans page (nav item + the `/` route) when set. Build-time flag —
 * only the exact string 'true' enables it; anything else leaves loans visible.
 */
export const isLoansPageHidden =
  process.env.NEXT_PUBLIC_HIDE_LOANS_PAGE === 'true'

/**
 * Exported for tests — lets a suite exercise the resolution rules (including
 * "zero address means unset") without depending on build-time inlining.
 */
export const __testables = { normalizeAddress }
