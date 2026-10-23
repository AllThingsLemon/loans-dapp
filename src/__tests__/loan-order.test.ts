import { describe, it, expect } from 'vitest'
import { LOAN_STATUS } from '../constants'
import {
  paymentCountdown,
  sortByNextPayment,
  type CountdownLoan
} from '../utils/loanStatus'

/**
 * The active-loans countdown and the list order built on it: soonest payment
 * first, in the order the cards' timers read.
 */

const DAY = 86_400n
const DAY_MS = 86_400_000
const CYCLE = 30n * DAY
const T0 = 1_790_000_000n // a loan's createdAt
const GRACE = 30n * DAY

/** A 12-cycle, 360-day active loan; override any field. */
function loan(
  overrides: Partial<CountdownLoan> & { id?: string } = {}
): CountdownLoan & { id: string } {
  const createdAt = overrides.createdAt ?? T0
  return {
    id: 'loan',
    status: LOAN_STATUS.ACTIVE,
    createdAt,
    dueTimestamp: createdAt + 12n * CYCLE,
    loanCycleDuration: CYCLE,
    transpiredCycles: 0n,
    cyclesAhead: 0n,
    totalCycles: 12n,
    balloonGraceSnapshot: 0n,
    ...overrides
  }
}

const ms = (seconds: bigint) => Number(seconds) * 1000

describe('paymentCountdown', () => {
  const now = ms(T0 + 70n * DAY) // during the 3rd cycle

  it('counts to the next unpaid cycle − 1 day while interest is owed', () => {
    const c = paymentCountdown(loan({ transpiredCycles: 2n }), GRACE, now)
    expect(c).toEqual({
      targetMs: ms(T0 + 3n * CYCLE) - DAY_MS,
      label: 'Time Until Default'
    })
  })

  it('skips cycles already prepaid', () => {
    const c = paymentCountdown(
      loan({ transpiredCycles: 2n, cyclesAhead: 3n }),
      GRACE,
      now
    )
    expect(c?.targetMs).toBe(ms(T0 + 6n * CYCLE) - DAY_MS)
  })

  it('caps the next cycle at the loan end', () => {
    const short = loan({ transpiredCycles: 11n })
    short.dueTimestamp = T0 + 12n * CYCLE - 10n * DAY
    const c = paymentCountdown(short, GRACE, now)
    expect(c?.targetMs).toBe(ms(short.dueTimestamp) - DAY_MS)
  })

  it('counts to the loan end once all interest is paid', () => {
    const c = paymentCountdown(
      loan({ transpiredCycles: 2n, cyclesAhead: 10n }),
      GRACE,
      now
    )
    expect(c).toEqual({
      targetMs: ms(T0 + 12n * CYCLE),
      label: 'Time to Loan End'
    })
  })

  it('counts to the end of grace − 1 day past the loan end', () => {
    const late = ms(T0 + 12n * CYCLE + 5n * DAY)
    const paid = loan({ transpiredCycles: 12n })
    expect(paymentCountdown(paid, GRACE, late)).toEqual({
      targetMs: ms(T0 + 12n * CYCLE + GRACE) - DAY_MS,
      label: 'Time Until Default'
    })
    // The loan's own grace snapshot wins over the global config.
    const snapshot = loan({ transpiredCycles: 12n, balloonGraceSnapshot: DAY })
    expect(paymentCountdown(snapshot, GRACE, late)?.targetMs).toBe(
      ms(T0 + 12n * CYCLE + DAY) - DAY_MS
    )
  })

  it('has nothing due once the loan is repaid', () => {
    expect(
      paymentCountdown(loan({ status: LOAN_STATUS.UNLOCKED }), GRACE, now)
    ).toBeNull()
  })
})

describe('sortByNextPayment', () => {
  const now = ms(T0 + 70n * DAY)

  it('puts the soonest countdown first and loans with nothing due last', () => {
    const loans = [
      // Next payment at the end of cycle 4: T0 + 120d − 1d.
      loan({ id: 'cycle-4', transpiredCycles: 3n }),
      // Opened 50 days later; next payment at its cycle 2: T0 + 110d − 1d.
      loan({ id: 'later', createdAt: T0 + 50n * DAY, transpiredCycles: 1n }),
      // Repaid, collateral not yet withdrawn: nothing due.
      loan({ id: 'unlocked', status: LOAN_STATUS.UNLOCKED }),
      // Next payment at the end of cycle 3: T0 + 90d − 1d — the soonest.
      loan({ id: 'cycle-3', transpiredCycles: 2n }),
      // Interest all paid; the loan ends T0 + 100d (no buffer).
      loan({
        id: 'ends-soon',
        createdAt: T0 - 260n * DAY,
        transpiredCycles: 11n,
        cyclesAhead: 1n
      })
    ]
    expect(sortByNextPayment(loans, GRACE, now).map((l) => l.id)).toEqual([
      'cycle-3',
      'ends-soon',
      'later',
      'cycle-4',
      'unlocked'
    ])
  })

  it('keeps the order loans were opened when their countdowns tie', () => {
    const loans = [
      // Opened a cycle later, one cycle paid: also due at T0 + 90d − 1d.
      loan({ id: 'second', createdAt: T0 + CYCLE, transpiredCycles: 1n }),
      loan({ id: 'first', createdAt: T0, transpiredCycles: 2n }),
      loan({ id: 'u2', status: LOAN_STATUS.UNLOCKED, createdAt: T0 + 9n }),
      loan({ id: 'u1', status: LOAN_STATUS.UNLOCKED, createdAt: T0 + 5n })
    ]
    expect(sortByNextPayment(loans, GRACE, now).map((l) => l.id)).toEqual([
      'first',
      'second',
      'u1',
      'u2'
    ])
  })

  it("doesn't reorder the caller's array", () => {
    const loans = [
      loan({ id: 'x', transpiredCycles: 5n }),
      loan({ id: 'y', transpiredCycles: 2n })
    ]
    sortByNextPayment(loans, GRACE, now)
    expect(loans.map((l) => l.id)).toEqual(['x', 'y'])
  })
})
