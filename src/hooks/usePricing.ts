import { useMemo } from 'react'
import { usePriceDataFeed } from './pricing/usePriceDataFeed'
import { useContractTokenConfiguration } from './useContractTokenConfiguration'
import { formatTokenAmount, formatDisplayValue } from '@/src/utils/decimals'
import type { UsePriceDataFeedReturn } from './pricing/usePriceDataFeed'

// Re-export specialized hooks
export { usePriceDataFeed } from './pricing/usePriceDataFeed'
export type { UsePriceDataFeedReturn } from './pricing/usePriceDataFeed'

export interface PriceData {
  // Raw values (bigint from contract)
  spotPriceRaw: bigint | undefined
  monthlyAverageRaw: bigint | undefined

  // Formatted values (human-readable strings)
  spotPrice: string | undefined
  monthlyAverage: string | undefined


  // Contract addresses
  priceDataFeedAddress: `0x${string}` | undefined
  collateralTokenAddress: `0x${string}` | undefined

  // Token information
  tokenSymbol: string | undefined
  tokenDecimals: number | undefined

  // States
  isLoading: boolean
  error: Error | null

  // Utility
  refetch: () => Promise<void>
}

export const usePricing = (): PriceData => {
  // Use focused hooks for specific concerns
  const priceDataFeed = usePriceDataFeed()
  const {
    tokenConfig,
    isLoading: isTokenConfigLoading,
    error: tokenConfigError
  } = useContractTokenConfiguration()

  // Combined loading and error states
  const isLoading = priceDataFeed.isLoading || isTokenConfigLoading
  const error = priceDataFeed.error || tokenConfigError

  // Get token decimals for price formatting
  const priceDecimals = tokenConfig?.collateralTokenPriceDecimals
  const tokenSymbol = tokenConfig?.nativeToken.symbol
  const tokenDecimals = tokenConfig?.collateralTokenDecimals

  // Format price values
  const spotPrice = useMemo(() => {
    if (!priceDataFeed.spotPrice || priceDecimals === undefined)
      return undefined
    const rawPrice = formatTokenAmount(priceDataFeed.spotPrice, priceDecimals)
    return formatDisplayValue(rawPrice, 2, 2)
  }, [priceDataFeed.spotPrice, priceDecimals])

  const monthlyAverage = useMemo(() => {
    if (!priceDataFeed.monthlyAverage || priceDecimals === undefined)
      return undefined
    const rawPrice = formatTokenAmount(priceDataFeed.monthlyAverage, priceDecimals)
    return formatDisplayValue(rawPrice, 2, 2)
  }, [priceDataFeed.monthlyAverage, priceDecimals])


  return {
    // Raw values from usePriceDataFeed
    spotPriceRaw: priceDataFeed.spotPrice,
    monthlyAverageRaw: priceDataFeed.monthlyAverage,

    // Formatted values
    spotPrice,
    monthlyAverage,

    // Contract addresses from usePriceDataFeed
    priceDataFeedAddress: priceDataFeed.priceDataFeedAddress,
    collateralTokenAddress: priceDataFeed.collateralTokenAddress,

    // Token information from useContractTokenConfiguration
    tokenSymbol,
    tokenDecimals,

    // Combined states
    isLoading,
    error,

    // Utility from usePriceDataFeed
    refetch: priceDataFeed.refetch
  }
}
