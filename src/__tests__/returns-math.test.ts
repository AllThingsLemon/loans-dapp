import { describe, it, expect } from 'vitest'
import {
  bigintRatioToPct,
  formatReturnPct,
  formatUsd,
  poolReturns,
  UNMEASURED
} from '../utils/returns'

describe('bigintRatioToPct', () => {
  it('matches the hand-verified prod figures (18-dec USDT)', () => {
    // 500 USDT of 30-day interest over 3,773.020096... liquidity shares
    const interest = 500_000000000000000000n
    const liquidityShares = 3773_020096242387680515n
    expect(bigintRatioToPct(interest, liquidityShares)).toBeCloseTo(13.252, 3)

    // …and over 9,630 interest shares → the 1.00x base rate
    const interestShares = 9629_999999999999999973n
    expect(bigintRatioToPct(interest, interestShares)).toBeCloseTo(5.1921, 4)
  })

  it('keeps tiny early-protocol returns above zero (8-dec chain)', () => {
    // $0.074 of interest over $210k of shares — floors to 0 without the
    // 1e12 headroom; must survive as a nonzero pct.
    const pct = bigintRatioToPct(7395814n, 21004350000000n)
    expect(pct).toBeGreaterThan(0)
    expect(pct).toBeLessThan(0.01)
  })

  it('returns 0 for a zero numerator', () => {
    expect(bigintRatioToPct(0n, 21004350000000n)).toBe(0)
  })
})

describe('poolReturns', () => {
  // BSC mainnet, 2026-09-30 18:41 UTC: interest distributed in the last 30
  // days, and the pool's deposits and interest shares at that moment
  const DISTRIBUTED = 2599_770000000000000000n
  const LIQUIDITY = 33636_347692371250000000n
  const INTEREST_SHARES = 97705_707296008260000000n

  it('matches the hand-computed figures', () => {
    const r = poolReturns(DISTRIBUTED, LIQUIDITY, INTEREST_SHARES)
    expect(r.avgPct).toBeCloseTo(7.729, 3)
    expect(r.basePct).toBeCloseTo(2.6608, 4)
  })

  it('averages the tier figures to the headline by construction', () => {
    const r = poolReturns(DISTRIBUTED, LIQUIDITY, INTEREST_SHARES)
    // headline = 1.00x rate × (interest shares / deposits)
    expect(r.avgPct).toBeCloseTo(
      r.basePct! * (Number(INTEREST_SHARES) / Number(LIQUIDITY)),
      8
    )
  })

  it('is unmeasured for an empty pool', () => {
    expect(poolReturns(DISTRIBUTED, 0n, 0n)).toEqual(UNMEASURED)
    expect(poolReturns(DISTRIBUTED, LIQUIDITY, 0n)).toEqual(UNMEASURED)
  })
})

describe('formatReturnPct', () => {
  it('renders normal figures at two decimals', () => {
    expect(formatReturnPct(13.252)).toBe('13.25%')
    expect(formatReturnPct(5.1921)).toBe('5.19%')
  })

  it('renders measurable-but-tiny as <0.01%', () => {
    expect(formatReturnPct(0.0000352)).toBe('<0.01%')
    expect(formatReturnPct(0.0099)).toBe('<0.01%')
  })

  it('renders exactly zero as 0.00%', () => {
    expect(formatReturnPct(0)).toBe('0.00%')
  })

  it('renders unmeasurable as an em dash', () => {
    expect(formatReturnPct(null)).toBe('—')
    expect(formatReturnPct(undefined)).toBe('—')
  })
})

describe('formatUsd', () => {
  it('formats dollar amounts to the cent', () => {
    expect(formatUsd(2599.77)).toBe('$2,599.77')
  })
})
