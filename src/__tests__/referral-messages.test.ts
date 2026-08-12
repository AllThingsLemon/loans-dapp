import { describe, it, expect } from 'vitest'
import { encodeErrorResult, type Abi } from 'viem'
import { extractErrorMessage, type ContractError } from '../utils/errorHandling'
import referralDepositRouterAbi from '../abis/ReferralDepositRouter.json'
import {
  REFERRAL_BLOCK_REMEDY,
  REFERRAL_OVERRIDE_NOTICE,
  REFERRAL_PREFLIGHT_MESSAGES,
  describeReferralBlock,
  describeSkipReason,
  type ReferralBlockReason
} from '../utils/referral'

/**
 * Locks the exact user-facing copy of the referral layer.
 *
 * The strings here are the contract with the user, not implementation detail —
 * they are reviewed as copy and reproduced in the message inventory. A silent
 * reword should fail a test, not ship.
 */

const abi = referralDepositRouterAbi as Abi

/** Decode a revert exactly as a node returns it: nested `data`, no ABI attached. */
function messageForRevert(errorName: string): string {
  const data = encodeErrorResult({ abi, errorName })
  return extractErrorMessage({
    message: 'Execution reverted for an unknown reason.',
    cause: { cause: { data } }
  } as unknown as ContractError)
}

describe('router revert → toast body', () => {
  const EXPECTED: Array<[string, string]> = [
    [
      'InsufficientGasForCommission',
      'Not enough gas was left to settle the referral commission. Try again with a higher gas limit — your deposit is unaffected.'
    ],
    [
      'InsufficientNativeFee',
      'Insufficient network fee — this operation requires a small TLEMX fee. Please try again.'
    ],
    [
      'BelowMinimum',
      'Amount is below the minimum deposit — please increase your amount and try again.'
    ],
    ['NoLock', 'The selected lock duration is not available for this token.'],
    [
      'SelfReferral',
      'You cannot refer yourself — remove the referral link and deposit normally.'
    ],
    [
      'EnforcedPause',
      'This contract is paused — deposits are temporarily unavailable.'
    ],
    ['NoCommission', 'No commission is available for this referrer.'],
    ['NativeRefundFailed', 'Failed to refund the unused network fee.'],
    ['ZeroAmount', 'Amount must be greater than zero.'],
    ['ZeroAddress', 'Invalid address provided.'],
    ['OnlySelf', 'This action can only be performed by the contract itself.'],
    ['InvalidRate', 'Invalid commission rate configuration.'],
    [
      'TiersNotSorted',
      'Commission tiers are misconfigured (thresholds are not in ascending order).'
    ]
  ]

  for (const [errorName, expected] of EXPECTED) {
    it(`${errorName}`, () => {
      expect(messageForRevert(errorName)).toBe(expected)
    })
  }
})

describe('gate block copy', () => {
  const EXPECTED: Array<[ReferralBlockReason, string, string]> = [
    [
      'no-link',
      'A referral link is required to deposit',
      'Deposits are only available through a partner referral link. Please use the link from the person who referred you.'
    ],
    [
      'invalid-referrer',
      'This referral link is incomplete',
      'The link is missing a valid affiliate address, so we cannot credit the referral.'
    ],
    [
      'invalid-commissions',
      'This referral link is incomplete',
      'The link is missing a valid commissions contract, so we cannot tell which partner referred you.'
    ],
    [
      'commissions-not-allowed',
      'This referral link is not recognised',
      'The commissions contract in this link is not approved by the protocol.'
    ],
    [
      'self-referral',
      'You cannot refer yourself',
      'This link points at your own wallet, which the contract rejects. Use the link from the person who referred you.'
    ],
    [
      'referrer-not-registered',
      'This affiliate is not registered yet',
      'The affiliate in this link has not been registered with the commissions contract, so the referral cannot be credited.'
    ],
    [
      'router-paused',
      'Deposits are temporarily paused',
      'The referral router is paused. Please try again shortly.'
    ],
    [
      'pool-mismatch',
      'Deposits are temporarily unavailable',
      'The referral router points at a different liquidity pool than the one shown here.'
    ]
  ]

  for (const [reason, title, detail] of EXPECTED) {
    it(`${reason}`, () => {
      expect(describeReferralBlock(reason)).toEqual({ title, detail })
    })
  }

  it('every reason closes with the same remedy', () => {
    expect(REFERRAL_BLOCK_REMEDY).toBe(
      'Please contact the person who referred you for a working link.'
    )
  })
})

describe('deposit toast bodies', () => {
  // Mirrors the template in AddLiquidityCard.handleConfirmDeposit.
  const toast = (note: string) =>
    `Deposited $100 (100.00 LUSD) into the liquidity pool.${note}`
  const skipped = (reason: number) =>
    ` The deposit succeeded, but the referral commission was skipped — ${describeSkipReason(reason)}.`

  it('commission paid — generic, no rate quoted', () => {
    expect(toast(' A referral commission was awarded to the referrer.')).toBe(
      'Deposited $100 (100.00 LUSD) into the liquidity pool. A referral commission was awarded to the referrer.'
    )
  })

  it('commission skipped, reason 1', () => {
    expect(toast(skipped(1))).toBe(
      'Deposited $100 (100.00 LUSD) into the liquidity pool. The deposit succeeded, but the referral commission was skipped — the referrer is not registered with the commissions contract.'
    )
  })

  it('commission skipped, reason 3 — the one seen in practice', () => {
    expect(toast(skipped(3))).toBe(
      'Deposited $100 (100.00 LUSD) into the liquidity pool. The deposit succeeded, but the referral commission was skipped — the commission could not be priced or paid out.'
    )
  })

  it('commission skipped, reason 4', () => {
    expect(toast(skipped(4))).toBe(
      'Deposited $100 (100.00 LUSD) into the liquidity pool. The deposit succeeded, but the referral commission was skipped — the commissions contract is not allowlisted by the router.'
    )
  })

  it('unknown reason falls back to the raw code', () => {
    expect(skipped(9)).toContain(
      'the referrer was not eligible (reason code 9)'
    )
  })
})

describe('pre-flight re-check messages', () => {
  // Thrown at the moment of signing and surfaced as the body of a
  // "Deposit Failed" toast. Every one must make clear nothing was sent.
  const EXPECTED: Array<[keyof typeof REFERRAL_PREFLIGHT_MESSAGES, string]> = [
    [
      'pool-mismatch',
      'Referral deposits are unavailable: the referral router points at a different liquidity pool than the one shown here. No transaction was sent — please contact support.'
    ],
    [
      'router-paused',
      'Referral deposits are paused right now. No transaction was sent — please try again shortly.'
    ],
    [
      'commissions-not-allowed',
      'This referral link is no longer valid: its commissions contract is no longer approved by the protocol. No transaction was sent — please contact the person who referred you for a working link.'
    ],
    [
      'referrer-not-registered',
      'This referral link is no longer valid: the affiliate is no longer registered with the commissions contract. No transaction was sent — please contact the person who referred you for a working link.'
    ],
    [
      'commission-would-fail',
      'This deposit would not pay a referral commission, so it was stopped before any gas was spent. No transaction was sent — please contact the person who referred you for a working link.'
    ]
  ]

  for (const [kind, expected] of EXPECTED) {
    it(`${kind}`, () => {
      expect(REFERRAL_PREFLIGHT_MESSAGES[kind]).toBe(expected)
    })
  }

  it('every pre-flight message states that nothing was sent', () => {
    for (const msg of Object.values(REFERRAL_PREFLIGHT_MESSAGES)) {
      expect(msg).toContain('No transaction was sent')
    }
  })
})

describe('referrer-corrected notice', () => {
  it('reads exactly as reviewed', () => {
    expect(REFERRAL_OVERRIDE_NOTICE).toBe(
      'Your referral link had a different wallet address as the referrer, but we have updated it to show the correct wallet address.'
    )
  })
})
