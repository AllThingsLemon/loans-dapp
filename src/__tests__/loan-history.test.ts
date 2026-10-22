import { describe, it, expect } from 'vitest'
import {
  breakDownPayments,
  compareEventIds,
  interestPaidSince,
  parseEventId,
  recentLoanActivity
} from '../utils/loanHistory'
import type { LoanPaymentRow } from '../graphql/types'

const E18 = 10n ** 18n

function payment(
  id: string,
  loanId: string,
  paymentAmount: bigint,
  remainingPrincipal: bigint,
  timestamp = 0
): LoanPaymentRow {
  return {
    id,
    chainId: 56,
    srcAddress: '0x2e03e03f346b034f2fae3212b89ca246e4d0921d',
    blockTimestamp: timestamp,
    transactionHash: '0xtx',
    loanId,
    payer: '0xpayer',
    paymentAmount: String(paymentAmount),
    remainingInterest: '0',
    remainingPrincipal: String(remainingPrincipal),
    totalPaidAmount: '0'
  }
}

describe('parseEventId / compareEventIds', () => {
  it('parses chain, block and log index', () => {
    expect(parseEventId('56_119218374_318')).toEqual({
      chainId: 56,
      blockNumber: 119218374n,
      logIndex: 318
    })
  })

  it('rejects ids without three parts', () => {
    expect(() => parseEventId('56_119218374')).toThrow()
  })

  it('orders by block numerically, where string order gets it wrong', () => {
    // '56_99…' > '56_123…' as strings, but block 99 came first
    expect('56_99_0' > '56_123_0').toBe(true)
    expect(compareEventIds('56_99_0', '56_123_0')).toBeLessThan(0)
  })

  it('orders by log index within a block', () => {
    expect(compareEventIds('56_5_9', '56_5_10')).toBeLessThan(0)
    expect(compareEventIds('56_5_10', '56_5_10')).toBe(0)
  })
})

describe('breakDownPayments', () => {
  const loans = [
    { loanId: 'A', loanAmount: String(1000n * E18) },
    { loanId: 'B', loanAmount: String(500n * E18) }
  ]

  it('splits principal from each loan balance and interest from the rest', () => {
    const out = breakDownPayments(loans, [
      // interest-only payment: principal unchanged
      payment('56_10_0', 'A', 25n * E18, 1000n * E18),
      // 100 principal + 20 interest
      payment('56_20_0', 'A', 120n * E18, 900n * E18),
      payment('56_15_3', 'B', 10n * E18, 500n * E18)
    ])
    expect(out.map((p) => [p.id, p.principalPaid, p.interestPaid])).toEqual([
      ['56_10_0', 0n, 25n * E18],
      ['56_15_3', 0n, 10n * E18],
      ['56_20_0', 100n * E18, 20n * E18]
    ])
  })

  it('sorts payments chronologically before tracking balances', () => {
    // Delivered out of order (and string-misordered): block 99 precedes 123.
    const out = breakDownPayments(loans, [
      payment('56_123_0', 'A', 150n * E18, 800n * E18),
      payment('56_99_0', 'A', 110n * E18, 900n * E18)
    ])
    expect(out.map((p) => [p.principalPaid, p.interestPaid])).toEqual([
      [100n * E18, 10n * E18],
      [100n * E18, 50n * E18]
    ])
  })

  it('never counts forgiven interest as paid', () => {
    // Citron-shaped row: the payment is 15 and principal is untouched, so all
    // 15 is interest — however far remainingInterest itself fell.
    const out = breakDownPayments(loans, [
      { ...payment('1005_282912_2', 'A', 15n * E18, 1000n * E18) }
    ])
    expect(out[0].interestPaid).toBe(15n * E18)
  })

  it('skips payments for loans with no initiation row', () => {
    const out = breakDownPayments(loans, [
      payment('56_10_0', 'UNKNOWN', 5n * E18, 0n)
    ])
    expect(out).toEqual([])
  })

  it('clamps anomalies instead of producing negative figures', () => {
    const out = breakDownPayments(loans, [
      // principal balance rose, and a payment smaller than the principal drop
      payment('56_10_0', 'A', 5n * E18, 1100n * E18),
      payment('56_11_0', 'A', 5n * E18, 1000n * E18)
    ])
    expect(out.map((p) => [p.principalPaid, p.interestPaid])).toEqual([
      [0n, 5n * E18],
      [100n * E18, 0n]
    ])
  })
})

describe('interestPaidSince', () => {
  it('sums interest paid at or after the cutoff', () => {
    const out = breakDownPayments(
      [{ loanId: 'A', loanAmount: String(1000n * E18) }],
      [
        payment('56_1_0', 'A', 10n * E18, 1000n * E18, 1_000),
        payment('56_2_0', 'A', 20n * E18, 1000n * E18, 2_000),
        payment('56_3_0', 'A', 40n * E18, 1000n * E18, 3_000)
      ]
    )
    expect(interestPaidSince(out, 2_000)).toBe(60n * E18)
    expect(interestPaidSince(out, 3_001)).toBe(0n)
  })
})

describe('recentLoanActivity', () => {
  const L1 = '0x' + '1'.repeat(64)
  const L2 = '0x' + '2'.repeat(64)
  const loans = [
    { id: L1, createdAt: 1000n, loanAmount: 1000n * E18 },
    { id: L2, createdAt: 5000n, loanAmount: 250n * E18 }
  ]
  const none = {
    payments: [],
    extensions: [],
    repaid: [],
    collateralWithdrawn: [],
    defaulted: []
  }

  it('shows openings from the chain when there is no indexer', () => {
    const events = recentLoanActivity(loans, undefined, 5)
    expect(events.map((e) => [e.kind, e.loanId, e.amount])).toEqual([
      ['opened', L2, 250n * E18],
      ['opened', L1, 1000n * E18]
    ])
  })

  it('merges indexed events, newest first, up to the limit', () => {
    const events = recentLoanActivity(
      loans,
      {
        ...none,
        payments: [
          // The first cycle is paid in the same block the loan opens.
          {
            id: '56_50_3',
            loanId: L2,
            blockTimestamp: 5000,
            paymentAmount: '7'
          },
          {
            id: '56_20_1',
            loanId: L1,
            blockTimestamp: 2000,
            paymentAmount: '9'
          }
        ],
        repaid: [{ id: '56_30_0', loanId: L1, blockTimestamp: 3000 }],
        collateralWithdrawn: [
          {
            id: '56_30_1',
            loanId: L1,
            blockTimestamp: 3000,
            collateralAmount: '42'
          }
        ]
      },
      5
    )
    expect(events.map((e) => `${e.kind}@${e.timestamp}`)).toEqual([
      'payment@5000',
      'opened@5000',
      'collateralWithdrawn@3000',
      'repaid@3000',
      'payment@2000'
    ])
    expect(events[2].amount).toBe(42n)
  })

  it('carries an extension as a duration', () => {
    const [event] = recentLoanActivity(
      [],
      {
        ...none,
        extensions: [
          {
            id: '56_9_0',
            loanId: L1,
            blockTimestamp: 9000,
            extensionDuration: String(90 * 86400)
          }
        ]
      },
      5
    )
    expect(event).toMatchObject({
      kind: 'extended',
      extensionDuration: BigInt(90 * 86400)
    })
  })
})
