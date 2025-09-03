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
  lmlnPriceRaw: bigint | undefined

  // Formatted values (human-readable strings)
  spotPrice: string | undefined
  monthlyAverage: string | undefined
  lmlnPrice: string | undefined

  // Contract addresses
  priceDataFeedAddress: `0x${string}` | undefined
  collateralTokenAddress: `0x${string}` | undefined
  originationFeeTokenAddress: `0x${string}` | undefined

  // Token information
  tokenSymbol: string | undefined
  feeTokenSymbol: string | undefined
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
  const priceDecimals = priceDataFeed.decimals
    ? Number(priceDataFeed.decimals)
    : undefined
  const tokenSymbol = tokenConfig?.nativeToken.symbol
  const feeTokenSymbol = tokenConfig?.feeToken.symbol
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
    const rawPrice = formatTokenAmount(
      priceDataFeed.monthlyAverage,
      priceDecimals
    )
    return formatDisplayValue(rawPrice, 2, 2)
  }, [priceDataFeed.monthlyAverage, priceDecimals])

  const lmlnPrice = useMemo(() => {
    if (!priceDataFeed.originationFeeTokenPrice || priceDecimals === undefined)
      return undefined
    const rawPrice = formatTokenAmount(
      priceDataFeed.originationFeeTokenPrice,
      priceDecimals
    )
    return formatDisplayValue(rawPrice, 4, 4) // More decimals for LMLN since it's lower value
  }, [priceDataFeed.originationFeeTokenPrice, priceDecimals])

  return {
    // Raw values from usePriceDataFeed
    spotPriceRaw: priceDataFeed.spotPrice,
    monthlyAverageRaw: priceDataFeed.monthlyAverage,
    lmlnPriceRaw: priceDataFeed.originationFeeTokenPrice,

    // Formatted values
    spotPrice,
    monthlyAverage,
    lmlnPrice,

    // Contract addresses from usePriceDataFeed
    priceDataFeedAddress: priceDataFeed.priceDataFeedAddress,
    collateralTokenAddress: priceDataFeed.collateralTokenAddress,
    originationFeeTokenAddress: priceDataFeed.originationFeeTokenAddress,

    // Token information from useContractTokenConfiguration
    tokenSymbol,
    feeTokenSymbol,
    tokenDecimals,

    // Combined states
    isLoading,
    error,

    // Utility from usePriceDataFeed
    refetch: priceDataFeed.refetch
  }
}
