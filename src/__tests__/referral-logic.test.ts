import { describe, it, expect } from 'vitest'
import { getAddress } from 'viem'
import {
  REFERRAL_BLOCK_REMEDY,
  describeReferralBlock,
  describeSkipReason,
  evaluateReferralGate,
  hasReferralParams,
  isSelfReferral,
  normalizeReferrer,
  parseCommissionsFromSearch,
  parseReferralLink,
  parseReferrerFromSearch,
  type ReferralBlockReason,
  type ReferralGateInput
} from '../utils/referral'
import { __testables } from '../config/referral'
import { extractErrorMessage, type ContractError } from '../utils/errorHandling'
import referralDepositRouterAbi from '../abis/ReferralDepositRouter.json'
import { encodeErrorResult, type Abi } from 'viem'

const { normalizeAddress } = __testables

// Lowercase form of a real citron address — normalizeReferrer must checksum it.
const REFERRER_LOWER = '0x33308a3a74eece1e7656bf73baf2789fb2e31cd4'
const REFERRER = getAddress(REFERRER_LOWER)
const OTHER = getAddress('0xc6e1cc44bbc9e047b5c25966dffe7ea673e913e0')

describe('referral param parsing', () => {
  it('accepts ?ref=', () => {
    expect(parseReferrerFromSearch(`?ref=${REFERRER}`)).toBe(REFERRER)
  })

  it('accepts ?affiliate= — the sibling affiliate dapp generates these links', () => {
    expect(parseReferrerFromSearch(`?affiliate=${REFERRER}`)).toBe(REFERRER)
  })

  it('prefers ref over affiliate when both are present', () => {
    expect(parseReferrerFromSearch(`?affiliate=${OTHER}&ref=${REFERRER}`)).toBe(
      REFERRER
    )
  })

  it('checksums a lowercase address', () => {
    const parsed = parseReferrerFromSearch(`?ref=${REFERRER_LOWER}`)
    expect(parsed).toBe(REFERRER)
    expect(parsed).not.toBe(REFERRER_LOWER)
  })

  it('accepts a URLSearchParams instance as well as a raw string', () => {
    const params = new URLSearchParams({ ref: REFERRER })
    expect(parseReferrerFromSearch(params)).toBe(REFERRER)
  })

  it('returns null for malformed values — the gate turns that into a block', () => {
    expect(parseReferrerFromSearch('?ref=0x123')).toBeNull()
    expect(parseReferrerFromSearch('?ref=not-an-address')).toBeNull()
    expect(parseReferrerFromSearch('?ref=')).toBeNull()
    // Right length, invalid characters
    expect(parseReferrerFromSearch(`?ref=0x${'z'.repeat(40)}`)).toBeNull()
  })

  it('returns null when the param is missing entirely', () => {
    expect(parseReferrerFromSearch('?foo=bar')).toBeNull()
    expect(parseReferrerFromSearch('')).toBeNull()
    expect(parseReferrerFromSearch(null)).toBeNull()
    expect(parseReferrerFromSearch(undefined)).toBeNull()
  })

  it('rejects a mixed-case address with a bad checksum', () => {
    // Flip one character's case so the EIP-55 checksum no longer validates.
    const bad =
      REFERRER.slice(0, 4) +
      (REFERRER[4] === 'A' ? 'a' : 'A') +
      REFERRER.slice(5)
    expect(normalizeReferrer(bad)).toBeNull()
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeReferrer(`  ${REFERRER}  `)).toBe(REFERRER)
  })
})

describe('self-referral detection', () => {
  it('flags a referrer equal to the connected account, ignoring case', () => {
    expect(isSelfReferral(REFERRER, REFERRER_LOWER)).toBe(true)
    expect(isSelfReferral(REFERRER_LOWER, REFERRER)).toBe(true)
  })

  it('does not flag a different account', () => {
    expect(isSelfReferral(REFERRER, OTHER)).toBe(false)
  })

  it('is false when either side is missing — a disconnected wallet is not a self-referral', () => {
    expect(isSelfReferral(REFERRER, null)).toBe(false)
    expect(isSelfReferral(null, REFERRER)).toBe(false)
    expect(isSelfReferral(null, null)).toBe(false)
  })
})

describe('referral address config resolution', () => {
  it('resolves a well-formed address', () => {
    expect(normalizeAddress(REFERRER)).toBe(REFERRER)
  })

  it('treats the zero address as unset — wagmi.config.ts substitutes it as a fallback', () => {
    expect(
      normalizeAddress('0x0000000000000000000000000000000000000000')
    ).toBeUndefined()
    // Case must not matter for the zero check
    expect(
      normalizeAddress(
        '0x0000000000000000000000000000000000000000'
          .toUpperCase()
          .replace('0X', '0x')
      )
    ).toBeUndefined()
  })

  it('treats unset, empty and malformed values as unset', () => {
    expect(normalizeAddress(undefined)).toBeUndefined()
    expect(normalizeAddress('')).toBeUndefined()
    expect(normalizeAddress('   ')).toBeUndefined()
    expect(normalizeAddress('0xdeadbeef')).toBeUndefined()
    expect(normalizeAddress('not-an-address')).toBeUndefined()
  })

  it('accepts a non-checksummed address — env values are operator-supplied', () => {
    expect(normalizeAddress(REFERRER_LOWER)).toBe(REFERRER_LOWER)
  })
})

describe('ReferralSkipped reason codes', () => {
  // Sourced from the verified implementation behind the router proxy
  // (0xde6d…196a), which documents them on the ReferralSkipped event.
  it('labels every code the contract can emit', () => {
    expect(describeSkipReason(1)).toBe(
      'the referrer is not registered with the commissions contract'
    )
    expect(describeSkipReason(3)).toBe(
      'the commission could not be priced or paid out'
    )
    expect(describeSkipReason(4)).toBe(
      'the commissions contract is not allowlisted by the router'
    )
  })

  it('falls back to the raw code for anything unrecognised', () => {
    // A future implementation could add codes; better a number than a wrong label.
    expect(describeSkipReason(9)).toContain('reason code 9')
  })
})

/**
 * Companion to error-coverage.test.ts: that suite proves every error in the ABI
 * decodes to a friendly message, this one proves the errors this feature
 * actually depends on are still IN the ABI. An upgrade that renames or drops
 * SelfReferral would otherwise pass the coverage guard silently.
 */
describe('ReferralDepositRouter error ABI drift guard', () => {
  const REQUIRED_ERRORS = [
    'SelfReferral',
    'BelowMinimum',
    'ZeroAmount',
    'ZeroAddress',
    'NoCommission',
    'NoLock',
    'InsufficientNativeFee',
    'InsufficientGasForCommission',
    'NativeRefundFailed',
    'EnforcedPause',
    'InvalidRate',
    'TiersNotSorted',
    'OnlySelf'
  ] as const

  const abi = referralDepositRouterAbi as Abi
  const errorNames = new Set(
    abi
      .filter((item) => item.type === 'error')
      .map((item) => (item as { name: string }).name)
  )

  for (const name of REQUIRED_ERRORS) {
    it(`ABI still declares ${name}`, () => {
      expect(errorNames.has(name)).toBe(true)
    })

    it(`${name} decodes to a human-readable message`, () => {
      const data = encodeErrorResult({ abi, errorName: name })
      const message = extractErrorMessage({
        message: 'Execution reverted for an unknown reason.',
        cause: { cause: { data } }
      } as unknown as ContractError)
      expect(message).not.toBe(`Contract error: ${name}`)
      expect(message).not.toBe('Execution reverted for an unknown reason.')
    })
  }

  it('declares the depositWithReferral signature the deposit branch calls', () => {
    const fn = abi.find(
      (item) => item.type === 'function' && item.name === 'depositWithReferral'
    ) as
      | { inputs: { name: string; type: string }[]; stateMutability: string }
      | undefined
    expect(fn).toBeDefined()
    expect(fn!.stateMutability).toBe('payable')
    expect(fn!.inputs.map((i) => i.type)).toEqual([
      'address',
      'uint256',
      'uint256',
      'address',
      'address',
      'address'
    ])
    expect(fn!.inputs.map((i) => i.name)).toEqual([
      'token',
      'amount',
      'lockDuration',
      'referrer',
      'destination',
      'commissions'
    ])
  })
})

describe('commissions param parsing', () => {
  it('reads ?commissions=', () => {
    expect(parseCommissionsFromSearch(`?commissions=${OTHER}`)).toBe(OTHER)
  })

  it('checksums and rejects malformed values like the affiliate param', () => {
    expect(
      parseCommissionsFromSearch(`?commissions=${OTHER.toLowerCase()}`)
    ).toBe(OTHER)
    expect(parseCommissionsFromSearch('?commissions=0x123')).toBeNull()
    expect(parseCommissionsFromSearch('?commissions=')).toBeNull()
    expect(parseCommissionsFromSearch('?ref=' + REFERRER)).toBeNull()
  })
})

describe('hasReferralParams', () => {
  it('is true whenever a referral key is present, even if the value is junk', () => {
    expect(hasReferralParams('?ref=nonsense')).toBe(true)
    expect(hasReferralParams('?affiliate=')).toBe(true)
    expect(hasReferralParams('?commissions=0x123')).toBe(true)
  })

  it('is false for an unrelated or empty query string', () => {
    expect(hasReferralParams('?utm_source=x')).toBe(false)
    expect(hasReferralParams('')).toBe(false)
    expect(hasReferralParams(null)).toBe(false)
  })
})

describe('parseReferralLink', () => {
  it('reads both halves of a complete link', () => {
    const link = parseReferralLink(
      `?affiliate=${REFERRER}&commissions=${OTHER}`
    )
    expect(link).toEqual({ referrer: REFERRER, commissions: OTHER })
  })

  it('reports a half-built link as a null half rather than guessing', () => {
    expect(parseReferralLink(`?affiliate=${REFERRER}`)).toEqual({
      referrer: REFERRER,
      commissions: null
    })
    expect(parseReferralLink(`?commissions=${OTHER}`)).toEqual({
      referrer: null,
      commissions: OTHER
    })
  })
})

describe('referral gate', () => {
  const ready: ReferralGateInput = {
    enabled: true,
    referrer: REFERRER,
    commissions: OTHER,
    hasLink: true,
    account: getAddress('0xad1c4acbb1d3b13bc0e06bc9cbeae0103bcc878b'),
    allowedCommissions: [OTHER],
    isRegistered: true,
    isPaused: false,
    hasPoolMismatch: false
  }

  const gate = (over: Partial<ReferralGateInput> = {}) =>
    evaluateReferralGate({ ...ready, ...over })

  it('lets a fully valid link through', () => {
    expect(gate()).toEqual({
      status: 'ready',
      referrer: REFERRER,
      commissions: OTHER
    })
  })

  it('is disabled — not blocked — when the chain has no router', () => {
    // This is the kill switch: without it, unsetting the router env var would
    // brick deposits instead of restoring the plain path.
    expect(gate({ enabled: false })).toEqual({ status: 'disabled' })
    // …and it wins even when everything else about the link is broken.
    expect(
      gate({
        enabled: false,
        referrer: null,
        commissions: null,
        hasLink: false
      })
    ).toEqual({ status: 'disabled' })
  })

  const blockedCases: Array<
    [string, Partial<ReferralGateInput>, ReferralBlockReason]
  > = [
    [
      'no link at all',
      { hasLink: false, referrer: null, commissions: null },
      'no-link'
    ],
    ['missing/malformed affiliate', { referrer: null }, 'invalid-referrer'],
    [
      'missing/malformed commissions',
      { commissions: null },
      'invalid-commissions'
    ],
    ['self-referral', { account: REFERRER }, 'self-referral'],
    [
      'commissions not allowlisted',
      { allowedCommissions: [REFERRER] },
      'commissions-not-allowed'
    ],
    [
      'affiliate not registered',
      { isRegistered: false },
      'referrer-not-registered'
    ],
    ['router paused', { isPaused: true }, 'router-paused'],
    ['pool mismatch', { hasPoolMismatch: true }, 'pool-mismatch']
  ]

  for (const [label, over, reason] of blockedCases) {
    it(`blocks on ${label}`, () => {
      expect(gate(over)).toEqual({ status: 'blocked', reason })
    })
  }

  it('withholds a verdict while the allowlist / registration reads are pending', () => {
    // A valid link must never flash an error while its reads resolve.
    expect(gate({ allowedCommissions: undefined })).toEqual({
      status: 'checking'
    })
    expect(gate({ isRegistered: undefined })).toEqual({ status: 'checking' })
  })

  it('rejects a non-allowlisted contract without waiting on isRegistered', () => {
    // `commissions` is URL-supplied and may not be a contract at all, in which
    // case isRegistered() reverts and never resolves. Judging the allowlist
    // first is what stops that spinning on 'checking' forever.
    expect(
      gate({ allowedCommissions: [REFERRER], isRegistered: undefined })
    ).toEqual({ status: 'blocked', reason: 'commissions-not-allowed' })
  })

  it('reports local failures immediately, without waiting on chain reads', () => {
    expect(
      gate({
        allowedCommissions: undefined,
        isRegistered: undefined,
        referrer: null
      })
    ).toEqual({ status: 'blocked', reason: 'invalid-referrer' })
    expect(
      gate({
        allowedCommissions: undefined,
        isRegistered: undefined,
        account: REFERRER
      })
    ).toEqual({ status: 'blocked', reason: 'self-referral' })
  })

  it('matches the allowlist case-insensitively', () => {
    expect(gate({ allowedCommissions: [OTHER.toLowerCase()] }).status).toBe(
      'ready'
    )
  })

  it('does not treat a disconnected wallet as a self-referral', () => {
    expect(gate({ account: undefined }).status).toBe('ready')
  })

  it('gives every block reason copy that points at the referrer', () => {
    const reasons: ReferralBlockReason[] = [
      'no-link',
      'invalid-referrer',
      'invalid-commissions',
      'commissions-not-allowed',
      'self-referral',
      'referrer-not-registered',
      'router-paused',
      'pool-mismatch'
    ]
    for (const reason of reasons) {
      const { title, detail } = describeReferralBlock(reason)
      expect(title.length).toBeGreaterThan(0)
      expect(detail.length).toBeGreaterThan(0)
    }
    expect(REFERRAL_BLOCK_REMEDY).toMatch(/referred you/i)
  })
})
