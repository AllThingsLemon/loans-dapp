'use client'

import { useAccount, useChainId, useReadContract, useSwitchChain } from 'wagmi'
import {
  useReadLoansPaused,
  liquidityPoolAbi,
  loansAddress
} from '@/src/generated'
import { useProtocolAddresses } from '@/src/hooks/useProtocolAddresses'
import {
  useIsWrongNetwork,
  hasLoansAddress
} from '@/src/hooks/useIsWrongNetwork'
import { usePricing } from '@/src/hooks/usePricing'
import {
  extractErrorMessage,
  type ContractError
} from '@/src/utils/errorHandling'
import { AlertTriangle, PauseCircle, Network } from 'lucide-react'

/**
 * Display names for chains a wallet is commonly parked on but that this build
 * does not configure. `useAccount().chain` resolves only against the configured
 * list, so without this the banner can only say "another network" — naming the
 * chain the user is actually on is most of what makes the message land.
 * Display only: nothing is ever read from these chains.
 */
const COMMON_CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  10: 'OP Mainnet',
  56: 'BNB Smart Chain',
  97: 'BNB Smart Chain Testnet',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum One',
  43114: 'Avalanche',
  11155111: 'Sepolia'
}

/**
 * Global protocol health banner. Every fee-bearing write depends on the
 * contracts being unpaused and the price feed being fresh — without this
 * banner those states only surface as opaque per-transaction failures deep
 * in a flow (approve succeeds, then the real tx reverts).
 */
export function ProtocolStatusBanner() {
  // `chain` is the WALLET's chain, resolved against the configured list —
  // undefined when the wallet is on a chain this build doesn't support.
  // `useChainId()` cannot be used for this: it returns config.state.chainId,
  // which wagmi clamps to a configured chain, so it reports a supported chain
  // even while the wallet sits on an unsupported one. Detecting with it left
  // the banner silent and the failure surfaced as a raw price-feed error.
  const {
    isConnected,
    chain: walletChain,
    chainId: walletChainId
  } = useAccount()
  const chainId = useChainId()
  const { switchChain, chains } = useSwitchChain()

  // Wrong / unsupported network: without a Loans address every config read
  // silently never resolves, and the only cue was the tiny wallet-button
  // pill. Detect it here and offer a one-click switch. Widen to string —
  // the generated literal types make a zero-address comparison a TS error,
  // but at runtime an unconfigured env var really does yield the zero addr.
  // Two ways to be on the wrong network: the wallet's chain isn't in the
  // configured set at all (walletChain undefined), or it is configured but has
  // no Loans address for this deployment.
  const isUnsupportedNetwork = useIsWrongNetwork()

  // Prefer the configured chain's own name, fall back to the lookup above,
  // and only then to a generic phrase.
  const walletChainName =
    walletChain?.name ??
    (walletChainId ? COMMON_CHAIN_NAMES[walletChainId] : undefined)
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
  const showPriceWarning = !!priceMessage && /price|stale/i.test(priceMessage)

  const isPaused = Boolean(loansPaused) || Boolean(lpPaused)

  // On the wrong network every read returns "0x", so the paused and
  // price-feed warnings are symptoms of that, not independent problems.
  // Showing all three at once buries the one thing the user can act on.
  const showPaused = isPaused && !isUnsupportedNetwork
  const showPrice = showPriceWarning && !isUnsupportedNetwork

  if (!showPaused && !showPrice && !isUnsupportedNetwork) return null

  return (
    <div className='space-y-2'>
      {isUnsupportedNetwork && (
        <div className='flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40 p-4'>
          <Network className='h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400 mt-0.5' />
          <div className='flex-1'>
            <p className='text-sm font-semibold text-orange-800 dark:text-orange-300'>
              Switch to {fallbackChain?.name ?? 'a supported network'}
            </p>
            <p className='text-sm text-orange-700 dark:text-orange-400'>
              Your wallet is on {walletChainName ?? 'another network'}. LemLoans
              runs on {fallbackChain?.name ?? 'a different network'} — switch to
              see your position.
            </p>
          </div>
          {fallbackChain && (
            <button
              onClick={() => switchChain({ chainId: fallbackChain.id })}
              className='shrink-0 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors'
            >
              Switch network
            </button>
          )}
        </div>
      )}
      {showPaused && (
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
      {showPrice && (
        <div className='flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40 p-4'>
          <AlertTriangle className='h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5' />
          <div>
            <p className='text-sm font-semibold text-yellow-800 dark:text-yellow-300'>
              Price feed issue
            </p>
            <p className='text-sm text-yellow-700 dark:text-yellow-400'>
              {priceMessage} Operations that depend on pricing (loans, deposits,
              claims) may fail until the feed updates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
