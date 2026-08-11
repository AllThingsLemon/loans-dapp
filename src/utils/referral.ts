/**
 * Pure helpers for the referral layer — parsing, tier math and receipt
 * interpretation. Kept free of React and wagmi so the numbers users are shown
 * (and the address we hand to the router) are unit-testable.
 */

import { getAddress, isAddress, decodeEventLog } from 'viem'
import type { Abi, Log } from 'viem'
import referralDepositRouterAbiJson from '@/src/abis/ReferralDepositRouter.json'

/** Basis-point denominator used by the router's tier rates. */
export const BPS_DENOMINATOR = 10_000n

/** Query-string keys that may carry a referrer, in priority order. */
export const REFERRAL_PARAM_KEYS = ['ref', 'affiliate'] as const

/** sessionStorage key the captured referrer is persisted under. */
export const REFERRAL_STORAGE_KEY = 'lemloans.referrer'

export interface CommissionTier {
  threshold: bigint
  rateBps: bigint
}

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

/**
 * Pull a referrer out of a query string, accepting both `?ref=` (this dapp) and
 * `?affiliate=` (the links royal-citadel-affiliate-dapp generates). `ref` wins
 * when both are present. Invalid values are treated as absent rather than
 * blocking — a malformed link must still allow a plain deposit.
 */
export function parseReferrerFromSearch(
  search: string | URLSearchParams | null | undefined
): `0x${string}` | null {
  if (!search) return null
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search
  for (const key of REFERRAL_PARAM_KEYS) {
    const found = normalizeReferrer(params.get(key))
    if (found) return found
  }
  return null
}

/** True when the referrer is the depositor — `depositWithReferral` reverts. */
export function isSelfReferral(
  referrer: string | null | undefined,
  account: string | null | undefined
): boolean {
  if (!referrer || !account) return false
  return referrer.toLowerCase() === account.toLowerCase()
}

/**
 * Mirror of the router's `tierRateFor(cumulative)`: tiers are sorted ascending
 * by threshold and the rate is that of the highest tier whose threshold has
 * been reached. Used for display only — the contract remains the authority, and
 * the on-chain `tierRateFor` read is preferred when available.
 */
export function tierRateForBps(
  tiers: readonly CommissionTier[],
  cumulative: bigint
): bigint {
  let rate = 0n
  for (const tier of tiers) {
    if (cumulative >= tier.threshold) rate = tier.rateBps
    else break
  }
  return rate
}

/**
 * Indicative commission for a deposit, in the commission token's units.
 *
 * The router caps the basis a single transaction can earn on at
 * `maxCommissionBasisPerTx`, so a large deposit earns on the cap rather than
 * the full value. Truncating division matches Solidity.
 */
export function estimateCommission({
  stableValue,
  rateBps,
  maxCommissionBasisPerTx
}: {
  stableValue: bigint
  rateBps: bigint
  maxCommissionBasisPerTx?: bigint
}): { basis: bigint; commission: bigint; isCapped: boolean } {
  if (stableValue <= 0n || rateBps <= 0n) {
    return { basis: 0n, commission: 0n, isCapped: false }
  }
  const cap = maxCommissionBasisPerTx
  const isCapped = cap !== undefined && cap > 0n && stableValue > cap
  const basis = isCapped ? cap! : stableValue
  return {
    basis,
    commission: (basis * rateBps) / BPS_DENOMINATOR,
    isCapped
  }
}

export const referralDepositRouterAbi = referralDepositRouterAbiJson as Abi

/**
 * TODO: fill in from the verified source at
 * https://explorer-testnet.lemonchain.io/address/0x4aE07bB550DC860eb52eF570776423589AdD0DBe
 *
 * `ReferralSkipped(lender, referrer, uint8 reason, timestamp)` carries a numeric
 * reason code whose meaning is not published in any ABI or local repo. Until the
 * verified source is available we render the raw code with a generic message
 * rather than guessing — adding a wrong label here would be worse than none.
 */
export const REFERRAL_SKIPPED_REASONS: Record<number, string> = {
  // 0: '...',
  // 1: '...',
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
 */
export function parseReferralOutcome(
  logs: readonly Log[] | undefined
): ReferralOutcome {
  if (!logs) return { kind: 'none' }
  for (const log of logs) {
    let decoded: { eventName?: string; args?: unknown }
    try {
      decoded = decodeEventLog({
        abi: referralDepositRouterAbi,
        data: log.data,
        topics: log.topics
      }) as { eventName?: string; args?: unknown }
    } catch {
      continue // logs from the pool/token contracts won't match — expected
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

/** Shorten an address for display, e.g. 0x4aE0…0DBe. */
export function truncateAddress(address: string): string {
  if (address.length < 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
