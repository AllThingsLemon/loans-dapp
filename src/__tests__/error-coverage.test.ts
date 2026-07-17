import { describe, it, expect } from 'vitest'
import { encodeErrorResult, type Abi } from 'viem'
import { extractErrorMessage, isUserRejection, type ContractError } from '../utils/errorHandling'
import {
  loansAbi,
  liquidityPoolAbi,
  priceDataFeedAbi,
  priceHelperAbi,
  collateralManagerAbi
} from '../generated'
import defaultLiquidatorAbi from '../abis/DefaultLiquidator.json'

/**
 * ABI-drift QA guards.
 *
 * These tests enumerate every custom error in every protocol ABI and assert
 * that the full pipeline — encode revert data exactly as a node returns it →
 * extractErrorMessage — produces a human-readable message. When a contract
 * regen adds a new error, the coverage test FAILS until a friendly message is
 * added to CONTRACT_ERROR_MESSAGES, which is exactly the reminder we want.
 */

type AbiErrorItem = Extract<Abi[number], { type: 'error' }>

const CONTRACTS: Array<{ name: string; abi: Abi }> = [
  { name: 'Loans', abi: loansAbi as Abi },
  { name: 'LiquidityPool', abi: liquidityPoolAbi as Abi },
  { name: 'PriceDataFeed', abi: priceDataFeedAbi as Abi },
  { name: 'PriceHelper', abi: priceHelperAbi as Abi },
  { name: 'CollateralManager', abi: collateralManagerAbi as Abi },
  { name: 'DefaultLiquidator', abi: defaultLiquidatorAbi as Abi }
]

/** Placeholder arg values per solidity type, enough to encode any error. */
function placeholderArg(type: string): unknown {
  if (type === 'address') return '0x' + '11'.repeat(20)
  if (type === 'bytes32') return '0x' + '22'.repeat(32)
  if (type.startsWith('uint') || type.startsWith('int')) return 1n // fits every width incl. uint8
  if (type === 'bool') return true
  if (type === 'string') return 'x'
  if (type === 'bytes') return '0xdeadbeef'
  throw new Error(`No placeholder for solidity type ${type} — extend the test`)
}

function allErrors(abi: Abi): AbiErrorItem[] {
  return abi.filter((item): item is AbiErrorItem => item.type === 'error')
}

describe('contract error coverage (ABI drift guard)', () => {
  for (const { name, abi } of CONTRACTS) {
    describe(`${name}`, () => {
      for (const err of allErrors(abi)) {
        it(`decodes ${err.name}(${(err.inputs || []).map((i) => i.type).join(',')}) to a friendly message`, () => {
          const data = encodeErrorResult({
            abi: [err],
            errorName: err.name,
            args: (err.inputs || []).map((i) => placeholderArg(i.type)) as never
          })

          // Shape of a raw eth_call revert: viem reports an unknown reason
          // and the payload survives only in a nested `data` field.
          const rawCallError = {
            message: 'Execution reverted for an unknown reason.',
            cause: { cause: { data } }
          } as unknown as ContractError

          const message = extractErrorMessage(rawCallError)

          // Decoding must have worked (not the raw viem string)…
          expect(message).not.toBe('Execution reverted for an unknown reason.')
          // …and every error must have a human-readable entry, not the
          // "Contract error: X" fallback. A failure here means a new error
          // was added to an ABI without a message in CONTRACT_ERROR_MESSAGES.
          expect(message).not.toBe(`Contract error: ${err.name}`)
        })
      }
    })
  }

  it('selector-only revert data (no args) still resolves parameterized errors', () => {
    const loanNotActive = allErrors(loansAbi as Abi).find((e) => e.name === 'LoanNotActive')!
    const full = encodeErrorResult({
      abi: [loanNotActive],
      errorName: 'LoanNotActive',
      args: ['0x' + '33'.repeat(32)] as never
    })
    const selectorOnly = full.slice(0, 10)
    const err = {
      message: `reverted with the following signature:\n${selectorOnly}`
    } as unknown as ContractError
    expect(extractErrorMessage(err)).toBe(
      'This loan is no longer active — it may have defaulted or already been paid off.'
    )
  })

  it('unknown selectors fall through without crashing', () => {
    const err = {
      message: 'Execution reverted for an unknown reason.',
      cause: { data: '0x12345678' }
    } as unknown as ContractError
    expect(extractErrorMessage(err)).toBe('Execution reverted for an unknown reason.')
  })
})

describe('isUserRejection wallet variants', () => {
  it('detects MetaMask phrasings', () => {
    expect(isUserRejection({ message: 'User rejected the request.' } as ContractError)).toBe(true)
    expect(isUserRejection({ message: 'MetaMask Tx Signature: User denied transaction signature.' } as ContractError)).toBe(true)
  })

  it('detects WalletConnect / other-wallet phrasings case-insensitively', () => {
    expect(isUserRejection({ message: 'user canceled' } as ContractError)).toBe(true)
    expect(isUserRejection({ message: 'User cancelled the transaction' } as ContractError)).toBe(true)
    expect(isUserRejection({ message: 'Transaction declined' } as ContractError)).toBe(true)
  })

  it('detects EIP-1193 code 4001 at top level and nested in the cause chain', () => {
    expect(isUserRejection({ message: 'x', code: 4001 } as ContractError)).toBe(true)
    expect(
      isUserRejection({
        message: 'request failed',
        cause: { cause: { code: 4001 } }
      } as unknown as ContractError)
    ).toBe(true)
  })

  it('detects viem UserRejectedRequestError by name in the chain', () => {
    expect(
      isUserRejection({
        message: 'something wrapped',
        cause: { name: 'UserRejectedRequestError', message: 'rejected' }
      } as unknown as ContractError)
    ).toBe(true)
  })

  it('does NOT flag real failures as rejections', () => {
    expect(isUserRejection({ message: 'Execution reverted for an unknown reason.' } as ContractError)).toBe(false)
    expect(isUserRejection({ message: 'insufficient funds for gas * price + value' } as ContractError)).toBe(false)
    expect(isUserRejection({ message: 'LoanNotActive()' } as ContractError)).toBe(false)
  })
})
