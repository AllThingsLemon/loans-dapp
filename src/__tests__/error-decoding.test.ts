import { describe, it, expect } from 'vitest'
import { encodeErrorResult } from 'viem'
import { extractErrorMessage, type ContractError } from '../utils/errorHandling'
import { loansAbi, priceDataFeedAbi } from '../generated'

/**
 * The revert-data decoding pipeline: raw revert payloads (selector + args)
 * must resolve to friendly messages wherever they appear in the error shape —
 * this is exactly what a raw eth_call re-simulation error looks like, where
 * viem reports only "Execution reverted for an unknown reason." and the
 * payload survives solely in a nested `data` field.
 */
describe('extractErrorMessage — ABI-driven revert data decoding', () => {
  const loanNotActiveData = encodeErrorResult({
    abi: loansAbi,
    errorName: 'LoanNotActive',
    args: ['0x' + '11'.repeat(32) as `0x${string}`]
  })

  const priceStaleData = encodeErrorResult({
    abi: priceDataFeedAbi,
    errorName: 'PriceStale',
    args: ['0x' + '22'.repeat(20) as `0x${string}`, 12345n]
  })

  it('decodes parameterized Loans errors from nested cause data (raw eth_call shape)', () => {
    const err = {
      message: 'Execution reverted for an unknown reason.',
      cause: { cause: { data: loanNotActiveData } }
    } as unknown as ContractError
    expect(extractErrorMessage(err)).toBe(
      'This loan is no longer active — it may have defaulted or already been paid off.'
    )
  })

  it('decodes sub-contract (PriceDataFeed) errors surfacing through another contract', () => {
    const err = {
      message: 'Execution reverted for an unknown reason.',
      cause: { data: priceStaleData }
    } as unknown as ContractError
    expect(extractErrorMessage(err)).toBe(
      'Price data is stale — the LMLN price feed needs to be updated before this operation can proceed.'
    )
  })

  it('decodes revert data that only appears inside message text', () => {
    const err = {
      message: `The contract function reverted with the following signature:\n${loanNotActiveData.slice(0, 10)}`
    } as unknown as ContractError
    expect(extractErrorMessage(err)).toBe(
      'This loan is no longer active — it may have defaulted or already been paid off.'
    )
  })

  it('falls through gracefully on unknown selectors', () => {
    const err = {
      message: 'Execution reverted for an unknown reason.',
      cause: { data: '0xdeadbeef' }
    } as unknown as ContractError
    expect(extractErrorMessage(err)).toBe(
      'Execution reverted for an unknown reason.'
    )
  })
})
