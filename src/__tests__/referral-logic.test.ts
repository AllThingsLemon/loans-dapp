import { describe, it, expect } from 'vitest'
import { getAddress } from 'viem'
import {
  BPS_DENOMINATOR,
  estimateCommission,
  isSelfReferral,
  normalizeReferrer,
  parseReferrerFromSearch,
  describeSkipReason,
  tierRateForBps,
  truncateAddress,
  type CommissionTier
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

/** The router's live tier table (thresholds ×1e18), read from citron. */
const TIERS: CommissionTier[] = [
  { threshold: 0n, rateBps: 500n },
  { threshold: 250_000n * 10n ** 18n, rateBps: 1000n },
  { threshold: 1_000_000n * 10n ** 18n, rateBps: 1500n },
  { threshold: 5_000_000n * 10n ** 18n, rateBps: 2000n },
  { threshold: 25_000_000n * 10n ** 18n, rateBps: 2500n }
]

const MAX_BASIS = 1_000_000n * 10n ** 18n

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

  it('treats malformed values as absent rather than blocking a deposit', () => {
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

describe('tier rate lookup', () => {
  it('returns the base rate at zero volume', () => {
    expect(tierRateForBps(TIERS, 0n)).toBe(500n)
  })

  it('steps up exactly at each threshold', () => {
    for (const tier of TIERS) {
      expect(tierRateForBps(TIERS, tier.threshold)).toBe(tier.rateBps)
    }
  })

  it('stays on the lower tier one wei below a threshold', () => {
    expect(tierRateForBps(TIERS, 250_000n * 10n ** 18n - 1n)).toBe(500n)
    expect(tierRateForBps(TIERS, 1_000_000n * 10n ** 18n - 1n)).toBe(1000n)
    expect(tierRateForBps(TIERS, 25_000_000n * 10n ** 18n - 1n)).toBe(2000n)
  })

  it('caps at the top tier for volume beyond the last threshold', () => {
    expect(tierRateForBps(TIERS, 100_000_000n * 10n ** 18n)).toBe(2500n)
  })

  it('returns zero when no tiers are configured', () => {
    expect(tierRateForBps([], 10n ** 30n)).toBe(0n)
  })
})

describe('commission estimation', () => {
  it('applies the rate as basis points of the deposit value', () => {
    const value = 1_000n * 10n ** 18n
    const { commission, basis, isCapped } = estimateCommission({
      stableValue: value,
      rateBps: 500n,
      maxCommissionBasisPerTx: MAX_BASIS
    })
    expect(basis).toBe(value)
    expect(commission).toBe((value * 500n) / BPS_DENOMINATOR)
    expect(commission).toBe(50n * 10n ** 18n) // 5% of $1,000
    expect(isCapped).toBe(false)
  })

  it('earns on the cap, not the full value, above maxCommissionBasisPerTx', () => {
    const value = 4_000_000n * 10n ** 18n
    const { commission, basis, isCapped } = estimateCommission({
      stableValue: value,
      rateBps: 1000n,
      maxCommissionBasisPerTx: MAX_BASIS
    })
    expect(isCapped).toBe(true)
    expect(basis).toBe(MAX_BASIS)
    expect(commission).toBe((MAX_BASIS * 1000n) / BPS_DENOMINATOR)
  })

  it('is not capped exactly at the cap', () => {
    const { isCapped, basis } = estimateCommission({
      stableValue: MAX_BASIS,
      rateBps: 500n,
      maxCommissionBasisPerTx: MAX_BASIS
    })
    expect(isCapped).toBe(false)
    expect(basis).toBe(MAX_BASIS)
  })

  it('truncates like Solidity rather than rounding', () => {
    // 1 wei at 5% => 0.05 wei, which floors to 0
    expect(
      estimateCommission({ stableValue: 1n, rateBps: 500n }).commission
    ).toBe(0n)
    // 19 wei at 5% => 0.95 wei, still 0
    expect(
      estimateCommission({ stableValue: 19n, rateBps: 500n }).commission
    ).toBe(0n)
    expect(
      estimateCommission({ stableValue: 20n, rateBps: 500n }).commission
    ).toBe(1n)
  })

  it('returns zero for a zero amount or a zero rate', () => {
    expect(
      estimateCommission({ stableValue: 0n, rateBps: 500n }).commission
    ).toBe(0n)
    expect(
      estimateCommission({ stableValue: 10n ** 20n, rateBps: 0n }).commission
    ).toBe(0n)
  })

  it('ignores an unset or zero cap', () => {
    const value = 10_000_000n * 10n ** 18n
    expect(
      estimateCommission({ stableValue: value, rateBps: 500n }).isCapped
    ).toBe(false)
    expect(
      estimateCommission({
        stableValue: value,
        rateBps: 500n,
        maxCommissionBasisPerTx: 0n
      }).isCapped
    ).toBe(false)
  })

  it('matches the tier table end to end at each threshold boundary', () => {
    const deposit = 10_000n * 10n ** 18n
    const expectedByCumulative: Array<[bigint, bigint]> = [
      [0n, 500n],
      [250_000n * 10n ** 18n, 1000n],
      [1_000_000n * 10n ** 18n, 1500n],
      [5_000_000n * 10n ** 18n, 2000n],
      [25_000_000n * 10n ** 18n, 2500n]
    ]
    for (const [cumulative, expectedBps] of expectedByCumulative) {
      const rateBps = tierRateForBps(TIERS, cumulative)
      expect(rateBps).toBe(expectedBps)
      expect(
        estimateCommission({
          stableValue: deposit,
          rateBps,
          maxCommissionBasisPerTx: MAX_BASIS
        }).commission
      ).toBe((deposit * expectedBps) / BPS_DENOMINATOR)
    }
  })
})

describe('ReferralSkipped reason codes', () => {
  it('renders the raw code rather than guessing a meaning', () => {
    // The verified router source is not available, so no code has a label yet.
    // When the lookup map is filled in, this expectation should be updated.
    expect(describeSkipReason(3)).toContain('reason code 3')
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

describe('address truncation', () => {
  it('shortens a full address', () => {
    expect(truncateAddress(REFERRER)).toBe(
      `${REFERRER.slice(0, 6)}…${REFERRER.slice(-4)}`
    )
  })

  it('leaves short strings alone', () => {
    expect(truncateAddress('0x1234')).toBe('0x1234')
  })
})
