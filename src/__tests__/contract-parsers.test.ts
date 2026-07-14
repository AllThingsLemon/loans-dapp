import { describe, it, expect } from 'vitest'
import type { Abi } from 'viem'
import { loansAbi } from '../generated'
import {
  parseLoanStruct,
  parseLoanConfig,
  type LoanStructResponse,
  type LoanConfigResponse
} from '../types/contracts'

/**
 * The app decodes several contract tuples BY INDEX (hand-written parsers in
 * src/types/contracts.ts). If a contract regen reorders, renames, inserts, or
 * removes a field, those indices silently point at the wrong values — these
 * guards pin the ABI shape so the regen fails CI instead.
 */

type AbiFunctionItem = Extract<Abi[number], { type: 'function' }>

function outputsOf(fnName: string): readonly { name?: string; type: string }[] {
  const fn = (loansAbi as Abi).find(
    (item): item is AbiFunctionItem => item.type === 'function' && item.name === fnName
  )
  if (!fn) throw new Error(`${fnName} missing from Loans ABI`)
  return fn.outputs ?? []
}

describe('ABI shape guards (index-based decoders)', () => {
  it('loans() field order matches parseLoanStruct indices', () => {
    expect(outputsOf('loans').map((o) => o.name)).toEqual([
      'account',
      'collateralToken',
      'createdAt',
      'loanAmount',
      'duration',
      'originalDuration',
      'interestAmount',
      'interestApr',
      'paidAmount',
      'ltv',
      'originationFee',
      'collateralAmount',
      'loanCycleDuration',
      'balloonGraceSnapshot'
    ])
  })

  it('loanConfig() field order matches parseLoanConfig indices', () => {
    expect(outputsOf('loanConfig').map((o) => o.name)).toEqual([
      'minLoanAmount',
      'minLoanDuration',
      'maxLoanDuration',
      'balloonPaymentGraceDuration',
      'loanCycleDuration',
      'aprYearDuration'
    ])
  })

  it('calculateLoanDetails() output order matches the destructuring in useLoanOperations', () => {
    expect(outputsOf('calculateLoanDetails').map((o) => o.name)).toEqual([
      'interestAmount',
      'interestApr',
      'originationFee',
      'collateralAmount',
      'loanCycleDuration',
      'firstLoanPayment'
    ])
  })

  it('getLiquidityStatus() output order matches parseLiquidityStatus indices', () => {
    expect(outputsOf('getLiquidityStatus').map((o) => o.name)).toEqual([
      'principalDeposited',
      'principalWithdrawn',
      'principalInLoans',
      'principalDeficitAmount',
      'principalAvailable',
      'interestEarned',
      'interestDistributed',
      'interestAvailable'
    ])
  })
})

describe('parseLoanStruct', () => {
  const base = [
    '0x' + 'aa'.repeat(20), // account
    '0x' + 'bb'.repeat(20), // collateralToken
    1_700_000_000n, // createdAt
    10_000n, // loanAmount
    3_600n, // duration
    3_600n, // originalDuration
    500n, // interestAmount
    12_500_000n, // interestApr
    250n, // paidAmount
    20_000_000n, // ltv
    8_448n, // originationFee
    123_456n, // collateralAmount
    300n, // loanCycleDuration
    86_400n // balloonGraceSnapshot
  ] as unknown as LoanStructResponse

  it('maps every index to the right field, including balloonGraceSnapshot at [13]', () => {
    const loan = parseLoanStruct(base)
    expect(loan.account).toBe('0x' + 'aa'.repeat(20))
    expect(loan.collateralToken).toBe('0x' + 'bb'.repeat(20))
    expect(loan.createdAt).toBe(1_700_000_000n)
    expect(loan.loanAmount).toBe(10_000n)
    expect(loan.duration).toBe(3_600n)
    expect(loan.originalDuration).toBe(3_600n)
    expect(loan.interestAmount).toBe(500n)
    expect(loan.interestApr).toBe(12_500_000n)
    expect(loan.paidAmount).toBe(250n)
    expect(loan.ltv).toBe(20_000_000n)
    expect(loan.originationFee).toBe(8_448n)
    expect(loan.collateralAmount).toBe(123_456n)
    expect(loan.loanCycleDuration).toBe(300n)
    expect(loan.balloonGraceSnapshot).toBe(86_400n)
  })

  it('defaults balloonGraceSnapshot to 0n for pre-upgrade 13-field tuples', () => {
    const preUpgrade = (base as unknown as unknown[]).slice(0, 13) as unknown as LoanStructResponse
    expect(parseLoanStruct(preUpgrade).balloonGraceSnapshot).toBe(0n)
  })
})

describe('parseLoanConfig', () => {
  it('maps all six fields in order', () => {
    const config = parseLoanConfig([
      1_000n,
      300n,
      31_104_000n,
      86_400n,
      2_592_000n,
      31_104_000n
    ] as unknown as LoanConfigResponse)
    expect(config).toEqual({
      minLoanAmount: 1_000n,
      minLoanDuration: 300n,
      maxLoanDuration: 31_104_000n,
      balloonPaymentGraceDuration: 86_400n,
      loanCycleDuration: 2_592_000n,
      aprYearDuration: 31_104_000n
    })
  })
})
