import { describe, it, expect } from 'vitest'
import { validateRecipient } from '../utils/recipientAddress'

const SELF = '0xAc61a8A1eDB6811bAb50dB5dC0b21a1ed368b74B'
const POOL = '0x0317e4b330766b22d980D04e1DD1c703FaF54F5d'
const OTHER = '0x1111111111111111111111111111111111111111'
const CTX = { self: SELF, protocolAddresses: [POOL] }

describe('validateRecipient', () => {
  it('accepts a valid checksummed address', () => {
    const r = validateRecipient(
      '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      CTX
    )
    expect(r).toEqual({
      ok: true,
      address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
    })
  })

  it('accepts all-lowercase and returns the checksummed form', () => {
    const r = validateRecipient(
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
      CTX
    )
    expect(r).toEqual({
      ok: true,
      address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
    })
  })

  it('trims surrounding whitespace', () => {
    const r = validateRecipient(`  ${OTHER}  `, CTX)
    expect(r.ok).toBe(true)
  })

  it('rejects a failed EIP-55 checksum (mixed case, one char wrong case)', () => {
    // Lowercase the leading 'B' of a checksummed address — checksum now fails.
    const r = validateRecipient(
      '0x8ba1f109551bd432803012645Ac136ddd64DBA72',
      CTX
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/checksum/i)
  })

  it('rejects garbage and short input', () => {
    expect(validateRecipient('vitalik.eth', CTX).ok).toBe(false)
    expect(validateRecipient('0x1234', CTX).ok).toBe(false)
    expect(validateRecipient('', CTX).ok).toBe(false)
  })

  it('rejects the zero address', () => {
    const r = validateRecipient(
      '0x0000000000000000000000000000000000000000',
      CTX
    )
    expect(r.ok).toBe(false)
  })

  it('rejects the connected wallet itself (case-insensitively)', () => {
    const r = validateRecipient(SELF.toLowerCase(), CTX)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/your connected wallet/i)
  })

  it('rejects protocol contract addresses (case-insensitively)', () => {
    const r = validateRecipient(POOL.toUpperCase().replace('0X', '0x'), {
      self: SELF,
      protocolAddresses: [POOL.toLowerCase()]
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/protocol contract/i)
  })

  it('ignores undefined entries in the protocol address list', () => {
    const r = validateRecipient(OTHER, {
      self: SELF,
      protocolAddresses: [undefined, POOL]
    })
    expect(r.ok).toBe(true)
  })
})
