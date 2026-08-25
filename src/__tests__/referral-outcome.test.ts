/**
 * parseReferralOutcome — the function that reads a depositWithReferral
 * receipt and decides whether the user is told "commission paid",
 * "commission skipped", or nothing. It also enforces that only the ROUTER's
 * logs count: any other contract in the call tree could emit an event with a
 * matching signature, and the toast is the user's only record of the outcome.
 */
import { describe, it, expect } from 'vitest'
import { encodeAbiParameters, encodeEventTopics, type Log } from 'viem'
import {
  parseReferralOutcome,
  referralDepositRouterAbi
} from '@/src/utils/referral'

const ROUTER = '0x00000000000000000000000000000000000000A1' as const
const NOT_ROUTER = '0x00000000000000000000000000000000000000B2' as const
const LENDER = '0x1111111111111111111111111111111111111111' as const
const REFERRER = '0x2222222222222222222222222222222222222222' as const
const COMMISSIONS = '0x3333333333333333333333333333333333333333' as const

// This viem build has no encodeEventLog, so the logs are assembled the way
// the EVM does: indexed args become topics, the rest ABI-encode into data.
function paidLog(address: `0x${string}` = ROUTER): Log {
  const topics = encodeEventTopics({
    abi: referralDepositRouterAbi,
    eventName: 'ReferralCommissionPaid',
    args: { commissions: COMMISSIONS, referrer: REFERRER, lender: LENDER }
  } as Parameters<typeof encodeEventTopics>[0])
  const data = encodeAbiParameters(
    [
      { type: 'uint256' }, // rateBps
      { type: 'uint256' }, // basis
      { type: 'uint256' }, // commission
      { type: 'uint256' } // timestamp
    ],
    [500n, 1_000_000n, 50_000n, 1_700_000_000n]
  )
  return { address, data, topics } as unknown as Log
}

function skippedLog(address: `0x${string}` = ROUTER): Log {
  const topics = encodeEventTopics({
    abi: referralDepositRouterAbi,
    eventName: 'ReferralSkipped',
    args: { lender: LENDER, referrer: REFERRER }
  } as Parameters<typeof encodeEventTopics>[0])
  const data = encodeAbiParameters(
    [{ type: 'uint8' }, { type: 'uint256' }], // reason, timestamp
    [3, 1_700_000_000n]
  )
  return { address, data, topics } as unknown as Log
}

/** A log no router event matches (random topic), as pool/token logs would be. */
const UNRELATED_LOG = {
  address: NOT_ROUTER,
  data: '0x',
  topics: [
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  ]
} as unknown as Log

describe('parseReferralOutcome', () => {
  it('reports a paid commission with its numbers', () => {
    const outcome = parseReferralOutcome(
      [paidLog()],
      ROUTER
    )
    expect(outcome).toEqual({
      kind: 'paid',
      commission: 50_000n,
      rateBps: 500n,
      basis: 1_000_000n
    })
  })

  it('reports a skipped commission with its reason code', () => {
    const outcome = parseReferralOutcome(
      [skippedLog()],
      ROUTER
    )
    expect(outcome).toEqual({ kind: 'skipped', reason: 3 })
  })

  it('skips unrelated logs and still finds the router event', () => {
    const outcome = parseReferralOutcome(
      [UNRELATED_LOG, skippedLog()],
      ROUTER
    )
    expect(outcome).toEqual({ kind: 'skipped', reason: 3 })
  })

  it('reports none when there are no logs or no router events', () => {
    expect(parseReferralOutcome(undefined, ROUTER)).toEqual({ kind: 'none' })
    expect(parseReferralOutcome([], ROUTER)).toEqual({ kind: 'none' })
    expect(parseReferralOutcome([UNRELATED_LOG], ROUTER)).toEqual({
      kind: 'none'
    })
  })

  it('ignores a matching event emitted by a contract other than the router', () => {
    // A hostile or buggy token in the call tree emits the exact same event
    // signature — it must not shape the outcome the user is shown.
    const forged = paidLog(NOT_ROUTER)
    expect(parseReferralOutcome([forged], ROUTER)).toEqual({ kind: 'none' })
  })

  it('router address comparison is case-insensitive', () => {
    const outcome = parseReferralOutcome(
      [skippedLog()],
      ROUTER.toLowerCase() as `0x${string}`
    )
    expect(outcome).toEqual({ kind: 'skipped', reason: 3 })
  })
})
