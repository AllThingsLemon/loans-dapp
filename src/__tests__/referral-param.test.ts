/**
 * Capture semantics of the referral pair (captureReferral — the pure policy
 * behind useReferralParam).
 *
 * The business rule (owner decision, Aug 2026): the FIRST sponsor is the
 * sponsor, always. On-chain that is enforced from the wallet's first deposit;
 * these tests pin the same rule for the off-chain window before it — a valid
 * captured pair is never replaced or cleared by a later link, valid or broken.
 */
import { describe, it, expect } from 'vitest'
import { captureReferral } from '@/src/utils/referral'

// Digit-only addresses are their own EIP-55 checksum, so they can be compared
// literally without a getAddress round-trip.
const REFERRER_A = '0x1111111111111111111111111111111111111111'
const COMMISSIONS_A = '0x2222222222222222222222222222222222222222'
const REFERRER_B = '0x3333333333333333333333333333333333333333'
const COMMISSIONS_B = '0x4444444444444444444444444444444444444444'

const PAIR_A = { referrer: REFERRER_A, commissions: COMMISSIONS_A }
const PAIR_B = { referrer: REFERRER_B, commissions: COMMISSIONS_B }

describe('captureReferral: fresh visit', () => {
  it('captures and persists a valid pair from the URL', () => {
    expect(
      captureReferral(
        `?affiliate=${REFERRER_A}&commissions=${COMMISSIONS_A}`,
        null
      )
    ).toEqual({ ...PAIR_A, hasLink: true, store: PAIR_A })
  })

  it('reports no link when neither URL nor storage carry one', () => {
    expect(captureReferral('', null)).toEqual({
      referrer: null,
      commissions: null,
      hasLink: false,
      store: null
    })
  })

  it('surfaces a broken link (missing commissions half) without persisting it', () => {
    expect(captureReferral(`?affiliate=${REFERRER_A}`, null)).toEqual({
      referrer: REFERRER_A,
      commissions: null,
      hasLink: true,
      store: null
    })
  })

  it('surfaces a malformed affiliate without persisting it', () => {
    expect(
      captureReferral(`?affiliate=junk&commissions=${COMMISSIONS_A}`, null)
    ).toEqual({
      referrer: null,
      commissions: COMMISSIONS_A,
      hasLink: true,
      store: null
    })
  })
})

describe('captureReferral: first link wins', () => {
  it('keeps the stored pair when a different valid link arrives later', () => {
    expect(
      captureReferral(
        `?affiliate=${REFERRER_B}&commissions=${COMMISSIONS_B}`,
        PAIR_A
      )
    ).toEqual({ ...PAIR_A, hasLink: true, store: PAIR_A })
  })

  it('keeps the stored pair when a broken link arrives later', () => {
    expect(captureReferral('?affiliate=not-an-address', PAIR_A)).toEqual({
      ...PAIR_A,
      hasLink: true,
      store: PAIR_A
    })
  })

  it('restores the stored pair on a navigation that dropped the query string', () => {
    expect(captureReferral('', PAIR_A)).toEqual({
      ...PAIR_A,
      hasLink: true,
      store: PAIR_A
    })
  })

  it('checksums a stored pair on the way out (storage is user-writable)', () => {
    const lower = {
      referrer: '0x52908400098527886E0F7030069857D2E4169EE7'.toLowerCase(),
      commissions: COMMISSIONS_A
    }
    const result = captureReferral('', lower)
    expect(result.referrer).toBe(
      '0x52908400098527886E0F7030069857D2E4169EE7'
    )
    expect(result.commissions).toBe(COMMISSIONS_A)
    expect(result.hasLink).toBe(true)
  })

  it('discards junk in storage instead of letting it shadow a genuine link', () => {
    expect(
      captureReferral(
        `?affiliate=${REFERRER_B}&commissions=${COMMISSIONS_B}`,
        { referrer: 'junk', commissions: 'also-junk' }
      )
    ).toEqual({ ...PAIR_B, hasLink: true, store: PAIR_B })
  })

  it('a half-valid stored pair does not survive — the pair is atomic', () => {
    expect(
      captureReferral('', { referrer: REFERRER_A, commissions: 'junk' })
    ).toEqual({
      referrer: null,
      commissions: null,
      hasLink: false,
      store: null
    })
  })
})
