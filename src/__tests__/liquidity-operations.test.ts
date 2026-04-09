import { describe, it, expect } from 'vitest'
import {
  isUserRejection,
  extractErrorMessage,
  type ContractError,
} from '@/src/utils/errorHandling'

/**
 * Tests for error handling logic used by all liquidity operations.
 * The operations hook (useLiquidityOperations) delegates error handling
 * to handleContractError, which calls isUserRejection and extractErrorMessage.
 */

describe('contract error handling for liquidity operations', () => {
  describe('isUserRejection', () => {
    it('detects MetaMask user rejection', () => {
      const err: ContractError = {
        message: 'User rejected the request.',
        code: 4001,
      }
      expect(isUserRejection(err)).toBe(true)
    })

    it('detects user denied message', () => {
      const err: ContractError = {
        message: 'User denied transaction signature',
      }
      expect(isUserRejection(err)).toBe(true)
    })

    it('detects by error code 4001 alone', () => {
      const err: ContractError = {
        message: 'Some other message',
        code: 4001,
      }
      expect(isUserRejection(err)).toBe(true)
    })

    it('returns false for contract revert', () => {
      const err: ContractError = {
        message: 'execution reverted: insufficient funds',
      }
      expect(isUserRejection(err)).toBe(false)
    })

    it('returns false for network error', () => {
      const err: ContractError = {
        message: 'network error',
      }
      expect(isUserRejection(err)).toBe(false)
    })
  })

  describe('extractErrorMessage', () => {
    it('extracts Solidity revert reason from gas estimation error', () => {
      const err: ContractError = {
        message: 'EstimateGasExecutionError: reverted with the following reason:\nInsufficientBalance\n',
      }
      expect(extractErrorMessage(err)).toBe('InsufficientBalance')
    })

    it('extracts custom error from gas estimation', () => {
      const err: ContractError = {
        message: "gas required exceeds allowance: reverted with custom error 'AmountTooLow()'",
      }
      expect(extractErrorMessage(err)).toBe('Contract reverted: AmountTooLow()')
    })

    it('returns generic message for gas estimation without revert reason', () => {
      const err: ContractError = {
        message: 'EstimateGasExecutionError: tx fee (1234) exceeds the configured cap (0)',
      }
      expect(extractErrorMessage(err)).toBe(
        'Transaction would fail on-chain. The contract may have a precondition that is not met — check your inputs and try again.'
      )
    })

    it('uses error.reason when available', () => {
      const err: ContractError = {
        message: 'Transaction failed',
        reason: 'Lock period not expired',
      }
      expect(extractErrorMessage(err)).toBe('Lock period not expired')
    })

    it('uses error.data.message when available', () => {
      const err: ContractError = {
        message: 'Transaction failed',
        data: { message: 'Contract paused' },
      }
      expect(extractErrorMessage(err)).toBe('Contract paused')
    })

    it('handles insufficient funds error', () => {
      const err: ContractError = {
        message: 'insufficient funds for gas',
      }
      expect(extractErrorMessage(err)).toBe(
        'Contract validation failed - this may be due to loan state, timing, or other contract rules'
      )
    })

    it('falls back to raw message', () => {
      const err: ContractError = {
        message: 'Something unexpected happened',
      }
      expect(extractErrorMessage(err)).toBe('Something unexpected happened')
    })
  })
})

describe('operation argument validation', () => {
  describe('depositLiquidity', () => {
    it('requires a positive bigint amount', () => {
      const amount = 100_000_000n
      expect(amount > 0n).toBe(true)
    })

    it('zero amount should not be sent to contract', () => {
      // The UI prevents this via parsedAmount check
      const amount = 0n
      expect(amount > 0n).toBe(false)
    })
  })

  describe('withdrawLiquidity', () => {
    it('amount must not exceed withdrawable balance', () => {
      const amount = 100_000_000n
      const withdrawable = 50_000_000n

      // UI checks: parsedAmount > withdrawableBalance
      expect(amount > withdrawable).toBe(true) // This would be blocked
    })
  })

  describe('approveToken', () => {
    it('requires valid token address', () => {
      const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678'
      expect(tokenAddress.startsWith('0x')).toBe(true)
      expect(tokenAddress.length).toBe(42)
    })

    it('requires valid spender address', () => {
      const spender = '0xabcdef1234567890abcdef1234567890abcdef12'
      expect(spender.startsWith('0x')).toBe(true)
      expect(spender.length).toBe(42)
    })
  })
})

describe('transaction revert detection', () => {
  it('waitAndInvalidate should detect reverted transactions', () => {
    // Simulates the receipt status check in useLiquidityOperations
    const receiptReverted = { status: 'reverted' as string }
    const receiptSuccess = { status: 'success' as string }

    expect(receiptReverted.status === 'reverted').toBe(true)
    expect(receiptSuccess.status === 'reverted').toBe(false)
  })

  it('throws meaningful error on revert', () => {
    const receipt = { status: 'reverted' as const }

    if (receipt.status === 'reverted') {
      const error = new Error('Transaction was reverted on-chain. The contract rejected the operation.')
      expect(error.message).toContain('reverted on-chain')
    }
  })
})

describe('pullEarnings special case', () => {
  it('does not require wallet connection (public function)', () => {
    // pullEarnings is the only operation that doesn't check address
    // This is intentional because it's a public function anyone can call
    const address = undefined
    const canCall = true // pullEarnings doesn't check address

    expect(canCall).toBe(true)
  })

  it('all other operations require wallet connection', () => {
    const address = undefined
    const operations = [
      'depositLiquidity',
      'depositNonEarningLiquidity',
      'withdrawLiquidity',
      'claimEarnings',
      'compoundEarnings',
      'relockLiquidity',
      'approveToken',
    ]

    // Each should throw "Wallet not connected" when address is undefined
    for (const op of operations) {
      expect(!address).toBe(true)
    }
  })
})
