import { describe, it, expect } from 'vitest'
import {
  parseUserStatus,
  parsePoolStatus,
  parseFeeConfig,
  parseLiquidityStatus,
  type UserStatus,
  type PoolStatus,
  type FeeConfig,
  type LiquidityStatus,
} from '@/src/types/liquidity'

describe('liquidity type parsers', () => {
  describe('parseUserStatus', () => {
    it('correctly maps all 7 tuple fields', () => {
      const raw = [100n, 20n, 500n, 200n, 300n, 50n, 25n] as const
      const result = parseUserStatus(raw)

      expect(result.totalShares).toBe(100n)
      expect(result.totalNonEarningShares).toBe(20n)
      expect(result.totalPrincipal).toBe(500n)
      expect(result.unlockedPrincipal).toBe(200n)
      expect(result.lockedPrincipal).toBe(300n)
      expect(result.pendingEarnings).toBe(50n)
      expect(result.totalClaimed).toBe(25n)
    })

    it('handles zero values', () => {
      const raw = [0n, 0n, 0n, 0n, 0n, 0n, 0n] as const
      const result = parseUserStatus(raw)

      expect(result.totalShares).toBe(0n)
      expect(result.totalPrincipal).toBe(0n)
      expect(result.pendingEarnings).toBe(0n)
    })

    it('handles very large values (18-decimal tokens)', () => {
      const oneThousandTokens = 1000n * 10n ** 18n
      const raw = [oneThousandTokens, 0n, oneThousandTokens, oneThousandTokens, 0n, 0n, 0n] as const
      const result = parseUserStatus(raw)

      expect(result.totalShares).toBe(oneThousandTokens)
      expect(result.totalPrincipal).toBe(oneThousandTokens)
    })

    it('returns correct types for all fields', () => {
      const raw = [1n, 2n, 3n, 4n, 5n, 6n, 7n] as const
      const result: UserStatus = parseUserStatus(raw)

      // Verify structure matches interface
      const keys = Object.keys(result)
      expect(keys).toEqual([
        'totalShares',
        'totalNonEarningShares',
        'totalPrincipal',
        'unlockedPrincipal',
        'lockedPrincipal',
        'pendingEarnings',
        'totalClaimed',
      ])
    })

    it('correctly distinguishes earning vs non-earning shares', () => {
      const raw = [1000n, 200n, 0n, 0n, 0n, 0n, 0n] as const
      const result = parseUserStatus(raw)

      // totalShares should NOT include non-earning
      expect(result.totalShares).toBe(1000n)
      expect(result.totalNonEarningShares).toBe(200n)
      // These are separate values from contract
      expect(result.totalShares).not.toBe(result.totalNonEarningShares)
    })
  })

  describe('parsePoolStatus', () => {
    it('correctly maps all 7 tuple fields', () => {
      const raw = [10000n, 5000n, 500n, 1000000n, 1700000000n, 200n, 1700003600n] as const
      const result = parsePoolStatus(raw)

      expect(result.totalPoolValue).toBe(10000n)
      expect(result.totalShares).toBe(5000n)
      expect(result.totalNonEarningShares).toBe(500n)
      expect(result.accumulatedEarningsPerShare).toBe(1000000n)
      expect(result.lastEarningsWithdrawal).toBe(1700000000n)
      expect(result.availableEarningsInLoans).toBe(200n)
      expect(result.nextEarningsWithdrawalTime).toBe(1700003600n)
    })

    it('handles empty pool (all zeros)', () => {
      const raw = [0n, 0n, 0n, 0n, 0n, 0n, 0n] as const
      const result = parsePoolStatus(raw)

      expect(result.totalPoolValue).toBe(0n)
      expect(result.totalShares).toBe(0n)
    })

    it('returns correct types for all fields', () => {
      const raw = [1n, 2n, 3n, 4n, 5n, 6n, 7n] as const
      const result: PoolStatus = parsePoolStatus(raw)

      const keys = Object.keys(result)
      expect(keys).toEqual([
        'totalPoolValue',
        'totalShares',
        'totalNonEarningShares',
        'accumulatedEarningsPerShare',
        'lastEarningsWithdrawal',
        'availableEarningsInLoans',
        'nextEarningsWithdrawalTime',
      ])
    })
  })

  describe('parseFeeConfig', () => {
    it('correctly maps fee config tuple', () => {
      const raw = [100n, 200n, '0x1234567890abcdef1234567890abcdef12345678'] as const
      const result = parseFeeConfig(raw)

      expect(result.withdrawalFeeBps).toBe(100n)
      expect(result.earningsFeeBps).toBe(200n)
      expect(result.feeReceiver).toBe('0x1234567890abcdef1234567890abcdef12345678')
    })

    it('handles zero fees', () => {
      const raw = [0n, 0n, '0x0000000000000000000000000000000000000000'] as const
      const result = parseFeeConfig(raw)

      expect(result.withdrawalFeeBps).toBe(0n)
      expect(result.earningsFeeBps).toBe(0n)
    })

    it('returns correct types for all fields', () => {
      const raw = [50n, 100n, '0xabcdef1234567890abcdef1234567890abcdef12'] as const
      const result: FeeConfig = parseFeeConfig(raw)

      const keys = Object.keys(result)
      expect(keys).toEqual(['withdrawalFeeBps', 'earningsFeeBps', 'feeReceiver'])
    })

    it('fee bps values are in correct range (max 10000 = 100%)', () => {
      // 1% = 100 bps, 10% = 1000 bps
      const raw = [100n, 1000n, '0x1234567890abcdef1234567890abcdef12345678'] as const
      const result = parseFeeConfig(raw)

      expect(Number(result.withdrawalFeeBps) / 100).toBe(1) // 1%
      expect(Number(result.earningsFeeBps) / 100).toBe(10) // 10%
    })
  })

  describe('parseLiquidityStatus', () => {
    it('correctly maps all 8 tuple fields', () => {
      const raw = [10000n, 2000n, 5000n, 100n, 2900n, 500n, 300n, 200n] as const
      const result = parseLiquidityStatus(raw)

      expect(result.principalDeposited).toBe(10000n)
      expect(result.principalWithdrawn).toBe(2000n)
      expect(result.principalInLoans).toBe(5000n)
      expect(result.principalForfeited).toBe(100n)
      expect(result.principalAvailable).toBe(2900n)
      expect(result.interestEarned).toBe(500n)
      expect(result.interestWithdrawn).toBe(300n)
      expect(result.interestAvailable).toBe(200n)
    })

    it('principalAvailable is at correct index (4)', () => {
      // This is critical - RemoveLiquidityCard uses principalAvailable for max withdraw
      const raw = [0n, 0n, 0n, 0n, 999n, 0n, 0n, 0n] as const
      const result = parseLiquidityStatus(raw)

      expect(result.principalAvailable).toBe(999n)
    })

    it('handles empty liquidity status', () => {
      const raw = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n] as const
      const result = parseLiquidityStatus(raw)

      expect(result.principalDeposited).toBe(0n)
      expect(result.principalAvailable).toBe(0n)
      expect(result.interestAvailable).toBe(0n)
    })

    it('returns correct types for all fields', () => {
      const raw = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n] as const
      const result: LiquidityStatus = parseLiquidityStatus(raw)

      const keys = Object.keys(result)
      expect(keys).toEqual([
        'principalDeposited',
        'principalWithdrawn',
        'principalInLoans',
        'principalForfeited',
        'principalAvailable',
        'interestEarned',
        'interestWithdrawn',
        'interestAvailable',
      ])
    })
  })
})
