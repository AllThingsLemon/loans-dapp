import { describe, it, expect } from 'vitest'
import { bigintRatioToPct, formatReturnPct } from '../utils/returns'

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
