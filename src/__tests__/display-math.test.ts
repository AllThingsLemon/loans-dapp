import { describe, it, expect } from 'vitest'
import {
  formatPercentage,
  parseTokenAmount,
  formatTokenAmount,
  formatSignificantValue
} from '../utils/decimals'
import {
  floorToDecimals,
  formatDuration,
  formatAmountWithSymbol
} from '../utils/format'
import { grossPaymentAmount } from '../utils/fees'
import {
  resolveGraceDuration,
  loanDefaultTimestamp,
  isPastDefault
} from '../utils/loanStatus'

/** Contract convention on this deployment: ltvDecimals = aprDecimals = 8. */
const PCT_DECIMALS = 8

describe('formatPercentage (2-decimal precision)', () => {
  it('keeps whole percentages unchanged', () => {
    expect(formatPercentage(20_000_000n, PCT_DECIMALS)).toBe('20')
    expect(formatPercentage(60_000_000n, PCT_DECIMALS)).toBe('60')
  })

  it('preserves fractional percentages instead of rounding to a whole percent', () => {
    // 12.5% APR used to display as "13" — a wrong number on a financial figure.
    expect(formatPercentage(12_500_000n, PCT_DECIMALS)).toBe('12.5')
    expect(formatPercentage(32_500_000n, PCT_DECIMALS)).toBe('32.5')
    expect(formatPercentage(12_340_000n, PCT_DECIMALS)).toBe('12.34')
  })

  it('LTV tier matching round-trip is lossless for non-integer tiers', () => {
    // The calculator finds the selected tier by comparing the slider value
    // against Number(formatPercentage(tier.ltv)). Every distinct tier must
    // survive that transformation uniquely.
    const tiers = [
      20_000_000n,
      30_000_000n,
      32_500_000n,
      50_000_000n,
      62_500_000n
    ]
    const displayed = tiers.map((t) =>
      Number(formatPercentage(t, PCT_DECIMALS))
    )
    expect(displayed).toEqual([20, 30, 32.5, 50, 62.5])
    expect(new Set(displayed).size).toBe(tiers.length)
  })
})

describe('formatSignificantValue (tiny prices keep 2 significant digits)', () => {
  it('extends decimals until 2 non-zero digits show', () => {
    expect(formatSignificantValue('0.00012345')).toBe('0.00012')
    expect(formatSignificantValue('0.0001')).toBe('0.0001')
    expect(formatSignificantValue('0.000098765')).toBe('0.000099')
    expect(formatSignificantValue('0.051234')).toBe('0.051')
  })

  it('keeps normal-sized values at 2 decimals', () => {
    expect(formatSignificantValue('13.63456')).toBe('13.63')
    expect(formatSignificantValue('0.5')).toBe('0.5')
  })

  it('handles zero and junk', () => {
    expect(formatSignificantValue('0')).toBe('0')
    expect(formatSignificantValue('not a number')).toBe('0')
  })

  it('bounds runaway tiny values at maxDecimals', () => {
    expect(formatSignificantValue('0.0000000000000001', 2, 12)).toBe('0')
  })
})

describe('floorToDecimals (balances must round DOWN)', () => {
  it('floors instead of rounding half-up', () => {
    expect(floorToDecimals(99.996, 2)).toBe(99.99)
    expect(floorToDecimals(99.994, 2)).toBe(99.99)
    expect(floorToDecimals(0.129, 2)).toBe(0.12)
  })

  it('leaves exact values untouched', () => {
    expect(floorToDecimals(100, 2)).toBe(100)
    expect(floorToDecimals(1.25, 2)).toBe(1.25)
    expect(floorToDecimals(0, 2)).toBe(0)
  })

  it('supports 4-decimal displays', () => {
    expect(floorToDecimals(0.00005, 4)).toBe(0)
    expect(floorToDecimals(1.23456789, 4)).toBe(1.2345)
  })
})

describe('formatDuration (cycle captions)', () => {
  it('renders sub-day cycles instead of "0 day"', () => {
    // 5-minute testnet cycles used to render as "0 day loan cycles".
    expect(formatDuration(300n)).toMatch(/minute/i)
    expect(formatDuration(3_600n)).toMatch(/hour/i)
  })

  it('renders financial-calendar days and months', () => {
    expect(formatDuration(86_400n)).toMatch(/day/i)
    expect(formatDuration(2_592_000n)).toMatch(/month|30/i)
  })
})

describe('parse/format token amounts', () => {
  it('parseTokenAmount is exact where float math is not', () => {
    // 1.1 * 1e18 in IEEE-754 is 1100000000000000128 — parseUnits must be exact.
    expect(parseTokenAmount('1.1', 18)).toBe(1_100_000_000_000_000_000n)
    expect(parseTokenAmount('123456789.123456789123456789', 18)).toBe(
      123_456_789_123_456_789_123_456_789n
    )
  })

  it('round-trips exactly through formatTokenAmount', () => {
    const wei = parseTokenAmount('42.000001', 18)
    expect(parseTokenAmount(formatTokenAmount(wei, 18), 18)).toBe(wei)
  })

  it('formatAmountWithSymbol renders two decimals with the symbol', () => {
    expect(formatAmountWithSymbol(1_500_000_000_000_000_000n, 'USDT', 18)).toBe(
      '1.50 USDT'
    )
  })

  it('formatAmountWithSymbol respects non-18 token decimals', () => {
    // 8-decimal chains (BSC testnet mocks) rendered as 0.00 when decimals
    // were defaulted — 1e10 at 8 decimals is 100, not dust.
    expect(formatAmountWithSymbol(10_000_000_000n, 'LUSD', 8)).toBe(
      '100.00 LUSD'
    )
  })

  it('formatAmountWithSymbol falls back to 18 while decimals are loading', () => {
    expect(
      formatAmountWithSymbol(1_500_000_000_000_000_000n, 'USDT', undefined)
    ).toBe('1.50 USDT')
  })
})

describe('grossPaymentAmount (protocol fee coverage)', () => {
  const DENOM = 10_000n

  it('adds the exact fee for cleanly divisible amounts', () => {
    // 10_000 wei at 25 bps → fee 25
    expect(grossPaymentAmount(10_000n, 25n, DENOM)).toBe(10_025n)
  })

  it('rounds the fee UP so the approval always covers the on-chain pull', () => {
    // 10_001 * 25 / 10_000 = 25.0025 → contract pulls ≤ 26; we approve 26.
    expect(grossPaymentAmount(10_001n, 25n, DENOM)).toBe(10_001n + 26n)
    // 1 wei payment still reserves 1 wei of fee.
    expect(grossPaymentAmount(1n, 25n, DENOM)).toBe(2n)
  })

  it('gross always covers amount + floor(amount*fee/denom) (contract-side floor)', () => {
    for (const amount of [1n, 3n, 999n, 10_000n, 123_456_789n, 10n ** 24n]) {
      for (const bps of [1n, 25n, 100n, 999n]) {
        const gross = grossPaymentAmount(amount, bps, DENOM)
        const contractPull = amount + (amount * bps) / DENOM
        expect(gross >= contractPull).toBe(true)
        // and never overshoots by more than one rounding unit
        expect(gross - contractPull <= 1n).toBe(true)
      }
    }
  })

  it('handles zero fee and zero amount', () => {
    expect(grossPaymentAmount(10_000n, 0n, DENOM)).toBe(10_000n)
    expect(grossPaymentAmount(0n, 25n, DENOM)).toBe(0n)
  })
})

describe('loan default timing (balloonGraceSnapshot)', () => {
  const createdAt = 1_700_000_000n
  const duration = 3_600n

  it('uses the per-loan snapshot when present', () => {
    expect(resolveGraceDuration(86_400n, 43_200n)).toBe(86_400n)
  })

  it('falls back to the global config for pre-upgrade loans (snapshot = 0)', () => {
    expect(resolveGraceDuration(0n, 43_200n)).toBe(43_200n)
  })

  it('a global grace change does NOT move a snapshotted loan’s default moment', () => {
    const snapshot = 86_400n
    const before = loanDefaultTimestamp(
      createdAt,
      duration,
      resolveGraceDuration(snapshot, 43_200n)
    )
    const afterConfigChange = loanDefaultTimestamp(
      createdAt,
      duration,
      resolveGraceDuration(snapshot, 1n)
    )
    expect(afterConfigChange).toBe(before)
  })

  it('flips to defaulted exactly at createdAt + duration + grace', () => {
    const grace = 86_400n
    const defaultAt = createdAt + duration + grace
    expect(isPastDefault(createdAt, duration, grace, 0n, defaultAt - 1n)).toBe(
      false
    )
    expect(isPastDefault(createdAt, duration, grace, 0n, defaultAt)).toBe(true)
  })

  it('shortening the global grace CAN default a pre-upgrade loan (documented fallback)', () => {
    const now = createdAt + duration + 10_000n
    expect(isPastDefault(createdAt, duration, 0n, 86_400n, now)).toBe(false)
    expect(isPastDefault(createdAt, duration, 0n, 5_000n, now)).toBe(true)
  })
})
