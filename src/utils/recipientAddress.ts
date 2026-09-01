import { getAddress, isAddress } from 'viem'
import { ZERO_ADDRESS } from '@/src/config/referral'

export type RecipientValidation =
  | { ok: true; address: `0x${string}` }
  | { ok: false; reason: string }

/**
 * Validate a "deposit on behalf of" recipient address.
 *
 * Rules, in order:
 *  - must parse as an address; mixed-case input must pass its EIP-55 checksum
 *    (a failed checksum means at least one character is wrong — never send
 *    funds there). All-lowercase input carries no checksum and is accepted,
 *    normalized to checksummed form so the user can eyeball it.
 *  - the zero address is rejected.
 *  - the depositor's own wallet is rejected — a plain deposit does that.
 *  - protocol contract addresses are rejected: shares assigned to the pool,
 *    Loans, tokens, etc. are unrecoverable (nothing can call withdraw from
 *    inside them).
 *
 * Deliberately NOT here: the is-it-a-contract check. That needs an RPC call,
 * so it lives with the caller — and it's a warning, not a rejection (a
 * multisig is a legitimate recipient).
 */
export function validateRecipient(
  input: string,
  context: {
    self?: string
    protocolAddresses: readonly (string | undefined)[]
  }
): RecipientValidation {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, reason: 'Enter a recipient address.' }
  }
  if (!isAddress(trimmed, { strict: false })) {
    return { ok: false, reason: 'Not a valid address.' }
  }

  // All-lowercase and all-uppercase hex carry no EIP-55 checksum; only mixed
  // case does. For mixed case, verify the checksum (isAddress strict) —
  // getAddress alone would silently RE-checksum a mistyped address.
  const body = trimmed.slice(2)
  const hasChecksum = body !== body.toLowerCase() && body !== body.toUpperCase()
  if (hasChecksum && !isAddress(trimmed, { strict: true })) {
    return {
      ok: false,
      reason:
        'Address fails its checksum — at least one character is wrong. Re-copy it from the source.'
    }
  }
  const checksummed = getAddress(trimmed.toLowerCase())

  if (checksummed.toLowerCase() === ZERO_ADDRESS) {
    return { ok: false, reason: 'The zero address cannot receive a deposit.' }
  }
  if (
    context.self &&
    checksummed.toLowerCase() === context.self.toLowerCase()
  ) {
    return {
      ok: false,
      reason:
        'This is your connected wallet — clear this field to deposit normally.'
    }
  }
  const isProtocol = context.protocolAddresses.some(
    (a) => a && a.toLowerCase() === checksummed.toLowerCase()
  )
  if (isProtocol) {
    return {
      ok: false,
      reason:
        'This is a protocol contract address. Shares sent here would be permanently unrecoverable.'
    }
  }

  return { ok: true, address: checksummed }
}
