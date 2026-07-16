'use client'

import { useAccount, useChainId, useReadContract, useSwitchChain } from 'wagmi'
import {
  useReadLoansPaused,
  liquidityPoolAbi,
  loansAddress
} from '@/src/generated'
import { useProtocolAddresses } from '@/src/hooks/useProtocolAddresses'
import { usePricing } from '@/src/hooks/usePricing'
import {
  extractErrorMessage,
  type ContractError
} from '@/src/utils/errorHandling'
import { AlertTriangle, PauseCircle, Network } from 'lucide-react'

/**
 * Global protocol health banner. Every fee-bearing write depends on the
 * contracts being unpaused and the price feed being fresh — without this
 * banner those states only surface as opaque per-transaction failures deep
 * in a flow (approve succeeds, then the real tx reverts).
 */
export function ProtocolStatusBanner() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, chains } = useSwitchChain()

  // Wrong / unsupported network: without a Loans address every config read
  // silently never resolves, and the only cue was the tiny wallet-button
  // pill. Detect it here and offer a one-click switch. Widen to string —
  // the generated literal types make a zero-address comparison a TS error,
  // but at runtime an unconfigured env var really does yield the zero addr.
  const hasLoansAddress = (id: number): boolean => {
    const addr = loansAddress[id as keyof typeof loansAddress] as
      | string
      | undefined
    return !!addr && addr !== '0x0000000000000000000000000000000000000000'
  }
  const isUnsupportedNetwork = isConnected && !hasLoansAddress(chainId)
  const fallbackChain = chains.find((c) => hasLoansAddress(c.id))

  // @ts-ignore - wagmi deep type instantiation
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

  if (!isPaused && !showPriceWarning && !isUnsupportedNetwork) return null

  return (
    <div className='space-y-2'>
      {isUnsupportedNetwork && (
        <div className='flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40 p-4'>
          <Network className='h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400 mt-0.5' />
          <div className='flex-1'>
            <p className='text-sm font-semibold text-orange-800 dark:text-orange-300'>
              Unsupported network
            </p>
            <p className='text-sm text-orange-700 dark:text-orange-400'>
              Your wallet is connected to a network this app doesn&apos;t
              support, so no data can load.
            </p>
          </div>
          {fallbackChain && (
            <button
              onClick={() => switchChain({ chainId: fallbackChain.id })}
              className='shrink-0 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors'
            >
              Switch to {fallbackChain.name}
            </button>
          )}
        </div>
      )}
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
