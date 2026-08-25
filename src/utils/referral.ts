/**
 * Pure helpers for the referral layer — parsing, tier math and receipt
 * interpretation. Kept free of React and wagmi so the numbers users are shown
 * (and the address we hand to the router) are unit-testable.
 */

import { getAddress, isAddress, decodeEventLog } from 'viem'
import type { Abi, Log } from 'viem'
import referralDepositRouterAbiJson from '@/src/abis/ReferralDepositRouter.json'

/** Query-string key carrying the affiliate. Matches what the affiliate dapp emits. */
export const REFERRAL_PARAM_KEYS = ['affiliate'] as const

/**
 * Query-string keys carrying the commissions contract. This is per-company, so
 * it travels in the link rather than in build-time config — one build serves
 * every partner.
 */
export const COMMISSIONS_PARAM_KEYS = ['commissions'] as const

/** sessionStorage key the captured referral pair is persisted under. */
export const REFERRAL_STORAGE_KEY = 'lemloans.referral'

/**
 * Checksum an address candidate, or return null when it isn't a valid address.
 * Anything user-supplied (URL, storage) goes through here before it can reach a
 * contract call.
 */
export function normalizeReferrer(
  candidate: string | null | undefined
): `0x${string}` | null {
  if (!candidate) return null
  const trimmed = candidate.trim()
  if (!isAddress(trimmed)) return null
  try {
    return getAddress(trimmed)
  } catch {
    return null
  }
}

function toParams(
  search: string | URLSearchParams | null | undefined
): URLSearchParams | null {
  if (!search) return null
  return typeof search === 'string' ? new URLSearchParams(search) : search
}

function firstValue(
  params: URLSearchParams,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const raw = params.get(key)
    if (raw !== null && raw.trim() !== '') return raw
  }
  return null
}

/**
 * Pull the affiliate out of a query string (`?affiliate=`, the parameter
 * royal-citadel-affiliate-dapp generates). Returns null for a missing OR
 * malformed value — the caller distinguishes the two via `hasReferralParams`.
 */
export function parseReferrerFromSearch(
  search: string | URLSearchParams | null | undefined
): `0x${string}` | null {
  const params = toParams(search)
  if (!params) return null
  return normalizeReferrer(firstValue(params, REFERRAL_PARAM_KEYS))
}

/** Pull the per-company commissions contract out of a query string. */
export function parseCommissionsFromSearch(
  search: string | URLSearchParams | null | undefined
): `0x${string}` | null {
  const params = toParams(search)
  if (!params) return null
  return normalizeReferrer(firstValue(params, COMMISSIONS_PARAM_KEYS))
}

/**
 * True when the URL carries any referral key at all, valid or not.
 *
 * This is what separates "arrived without a link" from "arrived with a broken
 * link": both block the deposit, but only the second means the link itself is
 * at fault, and the two need different copy.
 */
export function hasReferralParams(
  search: string | URLSearchParams | null | undefined
): boolean {
  const params = toParams(search)
  if (!params) return false
  return [...REFERRAL_PARAM_KEYS, ...COMMISSIONS_PARAM_KEYS].some(
    (key) => params.get(key) !== null
  )
}

/**
 * Both halves of a referral link. They are captured and validated as a PAIR:
 * a link with an affiliate but no commissions contract is broken, not a licence
 * to reuse whichever contract happened to be in storage from an earlier visit.
 */
export interface ReferralLink {
  referrer: `0x${string}` | null
  commissions: `0x${string}` | null
}

export function parseReferralLink(
  search: string | URLSearchParams | null | undefined
): ReferralLink {
  return {
    referrer: parseReferrerFromSearch(search),
    commissions: parseCommissionsFromSearch(search)
  }
}

/** A validated pair as it is persisted for the visit. */
export interface StoredReferralPair {
  referrer: `0x${string}`
  commissions: `0x${string}`
}

export interface ReferralCapture extends ReferralLink {
  /** True when the visitor has a referral link, from this URL or earlier in the visit. */
  hasLink: boolean
  /** What storage should hold afterwards: a valid pair, or null to clear. */
  store: StoredReferralPair | null
}

/**
 * Decide what this visit's referral pair is, given the URL and whatever an
 * earlier page view left in storage.
 *
 * FIRST LINK WINS. Attribution on the commissions contracts is
 * first-affiliate-wins and permanent, and the business rule is the same
 * off-chain: once a valid pair has been captured for the visit, a later link —
 * valid, different, or broken — neither replaces nor clears it. The affiliate
 * who brought the visitor keeps the referral.
 *
 * Storage is user-writable, so the stored pair is re-validated on the way out;
 * junk is discarded (store: null) rather than honoured, and only a fully valid
 * pair is ever persisted — a broken link is surfaced (hasLink true, halves
 * null) but never stored.
 */
export function captureReferral(
  search: string | URLSearchParams | null | undefined,
  stored: { referrer?: string | null; commissions?: string | null } | null
): ReferralCapture {
  const storedReferrer = normalizeReferrer(stored?.referrer)
  const storedCommissions = normalizeReferrer(stored?.commissions)
  if (storedReferrer && storedCommissions) {
    return {
      referrer: storedReferrer,
      commissions: storedCommissions,
      hasLink: true,
      store: { referrer: storedReferrer, commissions: storedCommissions }
    }
  }

  if (hasReferralParams(search)) {
    const { referrer, commissions } = parseReferralLink(search)
    return {
      referrer,
      commissions,
      hasLink: true,
      store: referrer && commissions ? { referrer, commissions } : null
    }
  }

  return { referrer: null, commissions: null, hasLink: false, store: null }
}

/**
 * Attribution on a Commissions contract is first-affiliate-wins and permanent.
 * Once a wallet has been credited to a sponsor, `_registerAffiliateIfNeeded`
 * reverts with `CustomerAffiliateMismatch()` if a later deposit names anyone
 * else — so a link pointing at a different affiliate cannot be honoured.
 *
 * Rather than fail that deposit, defer to the chain: whoever already owns the
 * wallet is the real referrer, and the UI is corrected to match. The contract's
 * own `getSponsor` falls back to the shared unified tree, so this single read
 * sees exactly what the deposit will check.
 */
export function resolveEffectiveReferrer({
  linkReferrer,
  existingSponsor
}: {
  linkReferrer: `0x${string}` | null
  existingSponsor?: string | null
}): { referrer: `0x${string}` | null; wasOverridden: boolean } {
  const sponsor =
    existingSponsor && existingSponsor.toLowerCase() !== ZERO_ADDRESS_LOWER
      ? (existingSponsor as `0x${string}`)
      : null
  if (!sponsor) return { referrer: linkReferrer, wasOverridden: false }
  if (linkReferrer && sponsor.toLowerCase() === linkReferrer.toLowerCase()) {
    return { referrer: linkReferrer, wasOverridden: false }
  }
  return { referrer: sponsor, wasOverridden: true }
}

const ZERO_ADDRESS_LOWER = '0x0000000000000000000000000000000000000000'

export type ReferralBlockReason =
  | 'no-link'
  | 'invalid-referrer'
  | 'invalid-commissions'
  | 'commissions-not-allowed'
  | 'self-referral'
  | 'referrer-not-registered'
  | 'router-paused'
  | 'pool-mismatch'

/**
 * The single verdict the deposit form and the banner both read.
 *
 *  - `disabled` — no router on this chain, so there is no referral system to
 *    satisfy. The pre-existing non-referral deposit path applies unchanged.
 *  - `checking` — a well-formed link whose on-chain validation is still in
 *    flight. Hold the CTA, but do NOT show a failure: a good link must never
 *    flash an error while its reads resolve.
 *  - `ready` — deposit through the router with these two addresses.
 *  - `blocked` — deposit is not permitted; `reason` selects the copy.
 */
export type ReferralGate =
  | { status: 'disabled' }
  | { status: 'checking' }
  | { status: 'ready'; referrer: `0x${string}`; commissions: `0x${string}` }
  | { status: 'blocked'; reason: ReferralBlockReason }

export interface ReferralGateInput {
  /** isReferralEnabled(chainId) — false means this chain has no router. */
  enabled: boolean
  /** Validated referrer, or null when missing or malformed. */
  referrer: `0x${string}` | null
  /** Validated commissions contract, or null when missing or malformed. */
  commissions: `0x${string}` | null
  /** Whether any referral key was present in the link at all. */
  hasLink: boolean
  /** Connected wallet, for the self-referral check. */
  account?: `0x${string}`
  /** router.allowedCommissionsList() — undefined while loading. */
  allowedCommissions?: readonly string[]
  /** commissions.isRegistered(referrer) — undefined while loading. */
  isRegistered?: boolean
  isPaused: boolean
  hasPoolMismatch: boolean
  /**
   * True while the connected wallet's existing sponsor is still being read.
   * The verdict must wait: the referrer that ends up being credited can change
   * once it resolves, and a link must not be judged against the wrong one.
   */
  isResolvingSponsor?: boolean
}

/**
 * Decide whether this visitor may deposit.
 *
 * Deliberately pure and exhaustively ordered: local, cheap and unambiguous
 * failures are reported before anything that depends on a pending RPC read, so
 * the user gets the most specific reason available at the earliest moment.
 */
export function evaluateReferralGate(input: ReferralGateInput): ReferralGate {
  const {
    enabled,
    referrer,
    commissions,
    hasLink,
    account,
    allowedCommissions,
    isRegistered,
    isPaused,
    hasPoolMismatch
  } = input

  // No router for this chain — the referral system does not apply here and the
  // legacy deposit path stays exactly as it was.
  if (!enabled) return { status: 'disabled' }

  if (!hasLink) return { status: 'blocked', reason: 'no-link' }
  if (input.isResolvingSponsor) return { status: 'checking' }
  if (!referrer) return { status: 'blocked', reason: 'invalid-referrer' }
  if (!commissions) return { status: 'blocked', reason: 'invalid-commissions' }
  if (isSelfReferral(referrer, account)) {
    return { status: 'blocked', reason: 'self-referral' }
  }

  // Operator-side misconfiguration. Checked before the pending reads because
  // both are already resolved by the time they can be true.
  if (hasPoolMismatch) return { status: 'blocked', reason: 'pool-mismatch' }
  if (isPaused) return { status: 'blocked', reason: 'router-paused' }

  // Everything below needs chain data. Withhold a verdict until it arrives.
  if (allowedCommissions === undefined) return { status: 'checking' }

  // The allowlist is checked BEFORE waiting on isRegistered, and the order is
  // load-bearing: `commissions` comes from the URL, so it may not be a contract
  // at all, in which case isRegistered() reverts and never resolves. Judging the
  // allowlist first means a junk address is rejected outright instead of
  // spinning on "verifying" forever.
  const isAllowed = allowedCommissions.some(
    (a) => a.toLowerCase() === commissions.toLowerCase()
  )
  if (!isAllowed) {
    return { status: 'blocked', reason: 'commissions-not-allowed' }
  }

  if (isRegistered === undefined) return { status: 'checking' }
  if (!isRegistered) {
    return { status: 'blocked', reason: 'referrer-not-registered' }
  }

  return { status: 'ready', referrer, commissions }
}

/**
 * User-facing copy per block reason. Every one of them ends in the same
 * remedy — the visitor cannot fix any of this themselves, and the person who
 * referred them can.
 */
export function describeReferralBlock(reason: ReferralBlockReason): {
  title: string
  detail: string
} {
  switch (reason) {
    case 'no-link':
      return {
        title: 'A referral link is required to deposit',
        detail:
          'Deposits are only available through a partner referral link. Please use the link from the person who referred you.'
      }
    case 'invalid-referrer':
      return {
        title: 'This referral link is incomplete',
        detail:
          'The link is missing a valid affiliate address, so we cannot credit the referral.'
      }
    case 'invalid-commissions':
      return {
        title: 'This referral link is incomplete',
        detail:
          'The link is missing a valid commissions contract, so we cannot tell which partner referred you.'
      }
    case 'commissions-not-allowed':
      return {
        title: 'This referral link is not recognised',
        detail:
          'The commissions contract in this link is not approved by the protocol.'
      }
    case 'self-referral':
      return {
        title: 'You cannot refer yourself',
        detail:
          'This link points at your own wallet, which the contract rejects. Use the link from the person who referred you.'
      }
    case 'referrer-not-registered':
      return {
        title: 'This affiliate is not registered yet',
        detail:
          'The affiliate in this link has not been registered with the commissions contract, so the referral cannot be credited.'
      }
    case 'router-paused':
      return {
        title: 'Deposits are temporarily paused',
        detail: 'The referral router is paused. Please try again shortly.'
      }
    case 'pool-mismatch':
      return {
        title: 'Deposits are temporarily unavailable',
        detail:
          'The referral router points at a different liquidity pool than the one shown here.'
      }
  }
}

/**
 * Shown above the affiliate address when the chain's sponsor replaced the one
 * from the link. Attribution is permanent, so this is a correction, not an
 * error — the deposit proceeds and credits the address on screen.
 */
export const REFERRAL_OVERRIDE_NOTICE =
  'Your referral link had a different wallet address as the referrer, but we have updated it to show the correct wallet address.'

/** The remedy shown under every block reason the visitor cannot self-fix. */
export const REFERRAL_BLOCK_REMEDY =
  'Please contact the person who referred you for a working link.'

/**
 * Reasons the pre-flight re-check can stop a deposit at the moment of signing.
 *
 * The gate already vets all of these when the page loads, but its reads are not
 * polled — so on a tab that has been open a while they can go stale. Worse, the
 * router checks the allowlist and the registration only AFTER the deposit has
 * landed, meaning a stale gate would let a deposit through and merely emit
 * `ReferralSkipped`. Re-reading immediately before signing collapses that window
 * to a single block and moves the failure to BEFORE the user spends gas.
 */
export type ReferralPreflightFailure =
  | 'pool-mismatch'
  | 'router-paused'
  | 'commissions-not-allowed'
  | 'referrer-not-registered'
  | 'commission-would-fail'

/**
 * Written for a toast rather than the banner, so each one is a complete
 * thought. "No transaction was sent" is load-bearing — the user pressed
 * Confirm and needs to know nothing happened and no gas was spent.
 */
export const REFERRAL_PREFLIGHT_MESSAGES: Record<
  ReferralPreflightFailure,
  string
> = {
  'pool-mismatch':
    'Referral deposits are unavailable: the referral router points at a different liquidity pool than the one shown here. No transaction was sent — please contact support.',
  'router-paused':
    'Referral deposits are paused right now. No transaction was sent — please try again shortly.',
  'commissions-not-allowed':
    'This referral link is no longer valid: its commissions contract is no longer approved by the protocol. No transaction was sent — please contact the person who referred you for a working link.',
  'referrer-not-registered':
    'This referral link is no longer valid: the affiliate is no longer registered with the commissions contract. No transaction was sent — please contact the person who referred you for a working link.',
  'commission-would-fail':
    'This deposit would not pay a referral commission, so it was stopped before any gas was spent. No transaction was sent — please contact the person who referred you for a working link.'
}

/**
 * Referrer eligibility and the commission token live on the commissions
 * contract, whose ABI is not checked into this repo. Only these two functions
 * are needed, so they are declared here rather than adding a whole ABI file.
 */
export const commissionsAbi = [
  {
    type: 'function',
    name: 'isRegistered',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'getSponsor',
    stateMutability: 'view',
    inputs: [{ name: 'affiliate', type: 'address' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    name: 'commissionToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const satisfies Abi

/** True when the referrer is the depositor — `depositWithReferral` reverts. */
export function isSelfReferral(
  referrer: string | null | undefined,
  account: string | null | undefined
): boolean {
  if (!referrer || !account) return false
  return referrer.toLowerCase() === account.toLowerCase()
}

export const referralDepositRouterAbi = referralDepositRouterAbiJson as Abi

/**
 * `ReferralSkipped(lender, referrer, uint8 reason, timestamp)` reason codes,
 * taken from the verified implementation behind the router proxy
 * (0xde6d50310554046e6f4b8249d21959e036a3196a), which documents them on the
 * event itself:
 *
 *   /// @param reason 1 = referrer not registered, 3 = pay/pricing failed,
 *   ///        4 = commissions not allowlisted
 *
 * 0 and 2 are unused. A zero-address or self referrer reverts the whole call
 * rather than skipping, so neither ever reaches this map.
 */
export const REFERRAL_SKIPPED_REASONS: Record<number, string> = {
  1: 'the referrer is not registered with the commissions contract',
  3: 'the commission could not be priced or paid out',
  4: 'the commissions contract is not allowlisted by the router'
}

export function describeSkipReason(reason: number): string {
  return (
    REFERRAL_SKIPPED_REASONS[reason] ??
    `the referrer was not eligible (reason code ${reason})`
  )
}

export type ReferralOutcome =
  | { kind: 'paid'; commission: bigint; rateBps: bigint; basis: bigint }
  | { kind: 'skipped'; reason: number }
  | { kind: 'none' }

/**
 * Read the commission result out of a `depositWithReferral` receipt.
 *
 * `settleCommission` is a gas-capped self-call, so it can fail while the
 * deposit itself succeeds — the router then emits `ReferralSkipped` instead of
 * `ReferralCommissionPaid`. "Deposit succeeded, commission skipped" is a real
 * outcome the user must be told about, not an error.
 *
 * Only logs EMITTED BY THE ROUTER are considered: any other contract in the
 * call tree (a deposit token, the pool) could emit an event with a matching
 * signature and misreport the outcome — the toast is the user's only record
 * of whether the commission was paid.
 */
export function parseReferralOutcome(
  logs: readonly Log[] | undefined,
  routerAddress: `0x${string}`
): ReferralOutcome {
  if (!logs) return { kind: 'none' }
  const router = routerAddress.toLowerCase()
  for (const log of logs) {
    if (log.address.toLowerCase() !== router) continue
    let decoded: { eventName?: string; args?: unknown }
    try {
      decoded = decodeEventLog({
        abi: referralDepositRouterAbi,
        data: log.data,
        topics: log.topics
      }) as { eventName?: string; args?: unknown }
    } catch {
      continue // non-matching router logs — expected
    }
    if (decoded.eventName === 'ReferralCommissionPaid') {
      const args = decoded.args as {
        commission?: bigint
        rateBps?: bigint
        basis?: bigint
      }
      return {
        kind: 'paid',
        commission: args.commission ?? 0n,
        rateBps: args.rateBps ?? 0n,
        basis: args.basis ?? 0n
      }
    }
    if (decoded.eventName === 'ReferralSkipped') {
      const args = decoded.args as { reason?: number }
      return { kind: 'skipped', reason: Number(args.reason ?? 0) }
    }
  }
  return { kind: 'none' }
}
