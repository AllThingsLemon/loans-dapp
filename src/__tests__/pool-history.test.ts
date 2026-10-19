import { describe, it, expect } from 'vitest'
import { getAddress } from 'viem'
import {
  DAY_S,
  depositEntryKey,
  distributedSince,
  distributionPerformance,
  sumDepositsByEntry,
  sumShareChanges,
  totalDistributed,
  type ShareChange
} from '../utils/poolHistory'

const E18 = 10n ** 18n
const MIDNIGHT = 1788048000 // 2026-08-30T00:00:00Z

function change(
  id: string,
  timestamp: number,
  liquidity: bigint,
  interest: bigint
): ShareChange {
  return { id, timestamp, liquidity: liquidity * E18, interest: interest * E18 }
}

describe('sumShareChanges', () => {
  it('nets deposits against withdrawals and expiring boosts', () => {
    expect(
      sumShareChanges([
        change('56_1_0', 0, 1000n, 3000n),
        change('56_2_0', 1, 500n, 500n),
        change('56_3_0', 2, -200n, -600n),
        change('56_4_0', 3, 0n, -100n)
      ])
    ).toEqual({ liquidity: 1300n * E18, interest: 2800n * E18 })
  })
})

describe('distributedSince / totalDistributed', () => {
  const pulls = [
    { blockTimestamp: MIDNIGHT - 1, amount: String(900n * E18) },
    { blockTimestamp: MIDNIGHT, amount: String(100n * E18) },
    { blockTimestamp: MIDNIGHT + DAY_S, amount: String(25n * E18) }
  ]

  it('counts only pulls at or after the cutoff', () => {
    expect(distributedSince(pulls, MIDNIGHT)).toBe(125n * E18)
    expect(distributedSince(pulls, MIDNIGHT + DAY_S + 1)).toBe(0n)
  })

  it('sums every pull for the on-chain cross-check', () => {
    expect(totalDistributed(pulls)).toBe(1025n * E18)
  })
})

describe('distributionPerformance', () => {
  const pull = (id: string, t: number, amount: bigint, shares: bigint) => ({
    id,
    blockTimestamp: t,
    amount: String(amount * E18),
    totalInterestShares: String(shares * E18)
  })

  it('divides each pull by the deposits just before it and adds them up', () => {
    const changes = [
      change('56_1_0', 0, 10_000n, 30_000n),
      // arrives between the two pulls, so only the second one sees it
      change('56_3_0', 20, 10_000n, 10_000n)
    ]
    const pulls = [
      pull('56_2_0', 10, 900n, 30_000n), // 900 / 10,000 = 9%
      pull('56_4_0', 30, 200n, 40_000n) // 200 / 20,000 = 1%
    ]
    const r = distributionPerformance(pulls, changes, 0)
    expect(r.avgPct).toBeCloseTo(10, 10)
    // 900 / 30,000 + 200 / 40,000 = 3% + 0.5%
    expect(r.basePct).toBeCloseTo(3.5, 10)
  })

  it("doesn't count a deposit made in the same transaction after the pull", () => {
    const changes = [
      change('56_1_0', 0, 1_000n, 1_000n),
      change('56_5_2', 50, 9_000n, 9_000n) // same block, later log than the pull
    ]
    const r = distributionPerformance(
      [pull('56_5_1', 50, 10n, 1_000n)],
      changes,
      0
    )
    expect(r.avgPct).toBeCloseTo(1, 10) // 10 / 1,000, not 10 / 10,000
  })

  it('skips pulls before the window and zero-amount pulls', () => {
    const changes = [change('56_1_0', 0, 1_000n, 1_000n)]
    const pulls = [
      pull('56_2_0', 5, 500n, 1_000n), // before the window
      pull('56_3_0', 15, 0n, 1_000n),
      pull('56_4_0', 20, 10n, 1_000n)
    ]
    expect(distributionPerformance(pulls, changes, 10)).toEqual({
      avgPct: 1,
      basePct: 1
    })
  })
})

describe('sumDepositsByEntry / depositEntryKey', () => {
  // A real BSC depositor (2026-10): three same-day USDT deposits merged into
  // one 3600-day entry. The entry now reads $2,559.38 on chain, after $59.39
  // of earnings were compounded into it; they deposited $2,500.
  const USDT = '0x55d398326f99059ff775485246999027b3197955'
  const UNLOCK = '2099865600'
  const LOCK = '311040000'
  const deposit = (usd: bigint, overrides = {}) => ({
    token: USDT,
    stableTokenValue: String(usd * E18),
    expiresAt: UNLOCK,
    lockDuration: LOCK,
    ...overrides
  })

  it('sums the deposits behind an entry', () => {
    const values = sumDepositsByEntry([
      deposit(1300n),
      deposit(700n),
      deposit(500n)
    ])
    expect(values.get(depositEntryKey(USDT, UNLOCK, LOCK))).toBe(2500n * E18)
  })

  it('matches the chain entry: checksummed token, bigint unlockTime', () => {
    const values = sumDepositsByEntry([deposit(1300n), deposit(1200n)])
    const entryKey = depositEntryKey(getAddress(USDT), 2099865600n, 311040000n)
    expect(values.get(entryKey)).toBe(2500n * E18)
  })

  it('keeps entries apart when unlock time, lock or token differ', () => {
    const values = sumDepositsByEntry([
      deposit(100n),
      deposit(200n, { expiresAt: String(BigInt(UNLOCK) + BigInt(DAY_S)) }),
      deposit(300n, { lockDuration: '31104000' }),
      deposit(400n, { token: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' })
    ])
    expect(values.size).toBe(4)
    expect(values.get(depositEntryKey(USDT, UNLOCK, LOCK))).toBe(100n * E18)
  })

  it('has no value for an entry made only by compounding', () => {
    const values = sumDepositsByEntry([deposit(2500n)])
    expect(values.get(depositEntryKey(USDT, 2101075200n, LOCK))).toBeUndefined()
  })
})
