'use client'

import { useReadContract } from 'wagmi'
import { useReadLoansPaused, liquidityPoolAbi } from '@/src/generated'
import { useProtocolAddresses } from '@/src/hooks/useProtocolAddresses'
import { usePricing } from '@/src/hooks/usePricing'
import {
  extractErrorMessage,
  type ContractError
} from '@/src/utils/errorHandling'
import { AlertTriangle, PauseCircle } from 'lucide-react'

/**
 * Global protocol health banner. Every fee-bearing write depends on the
 * contracts being unpaused and the price feed being fresh — without this
 * banner those states only surface as opaque per-transaction failures deep
 * in a flow (approve succeeds, then the real tx reverts).
 */
export function ProtocolStatusBanner() {
  const { data: loansPaused } = useReadLoansPaused({
    query: { refetchInterval: 30_000 }
  })

  const { liquidityPool: lpAddress } = useProtocolAddresses()
  const { data: lpPaused } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi,
    functionName: 'paused',
    query: { enabled: !!lpAddress, refetchInterval: 30_000 }
  })

  // The price reads revert with PriceStale/NoPriceAvailable when the feed
  // needs updating — decode and surface that here instead of letting each
  // transaction fail with it individually.
  const { error: pricingError } = usePricing()
  const priceMessage = pricingError
    ? extractErrorMessage(pricingError as unknown as ContractError)
    : undefined
  const showPriceWarning =
    !!priceMessage && /price|stale/i.test(priceMessage)

  const isPaused = Boolean(loansPaused) || Boolean(lpPaused)

  if (!isPaused && !showPriceWarning) return null

  return (
    <div className='space-y-2'>
      {isPaused && (
        <div className='flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4'>
          <PauseCircle className='h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5' />
          <div>
            <p className='text-sm font-semibold text-red-800 dark:text-red-300'>
              Protocol paused
            </p>
            <p className='text-sm text-red-700 dark:text-red-400'>
              {loansPaused && lpPaused
                ? 'Loans and liquidity operations are temporarily paused.'
                : loansPaused
                  ? 'Loan operations are temporarily paused.'
                  : 'Liquidity pool operations are temporarily paused.'}{' '}
              Transactions will fail until the protocol is unpaused — please
              check back later.
            </p>
          </div>
        </div>
      )}
      {showPriceWarning && (
        <div className='flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40 p-4'>
          <AlertTriangle className='h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5' />
          <div>
            <p className='text-sm font-semibold text-yellow-800 dark:text-yellow-300'>
              Price feed issue
            </p>
            <p className='text-sm text-yellow-700 dark:text-yellow-400'>
              {priceMessage} Operations that depend on pricing (loans,
              deposits, claims) may fail until the feed updates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
