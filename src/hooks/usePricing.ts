import { useMemo } from 'react'
import { usePriceDataFeed } from './pricing/usePriceDataFeed'
import { useCollateralManager } from './useCollateralManager'
import { useContractTokenConfiguration } from './useContractTokenConfiguration'
import { formatTokenAmount, formatDisplayValue } from '@/src/utils/decimals'

// Re-export specialized hooks
export { usePriceDataFeed } from './pricing/usePriceDataFeed'
export type { UsePriceDataFeedReturn } from './pricing/usePriceDataFeed'

export interface PriceData {
  // Raw values (bigint from contract)
  spotPriceRaw: bigint | undefined
  monthlyAverageRaw: bigint | undefined
  feeTokenPriceRaw: bigint | undefined

  // Formatted values (human-readable strings)
  spotPrice: string | undefined
  monthlyAverage: string | undefined
  feeTokenPrice: string | undefined

  // Contract addresses
  priceDataFeedAddress: `0x${string}` | undefined
  collateralTokenAddress: `0x${string}` | undefined
  originationFeeTokenAddress: `0x${string}` | undefined

  // Token information
  collateralSymbol: string | undefined
  feeTokenSymbol: string | undefined

  // States
  isLoading: boolean
  error: Error | null

  // Utility
  refetch: () => Promise<void>
}

/**
 * Aggregated pricing data for the dashboard banner.
 *
 * The collateral token surfaced for spot/monthly average is the first asset
 * registered on the CollateralManager. The fee token (LMLN) is read from
 * Loans.originationFeeToken().
 */
export const usePricing = (): PriceData => {
  const {
    supportedCollateralTokens,
    isLoading: collateralLoading,
    error: collateralError
  } = useCollateralManager()
  const {
    tokenConfig,
    isLoading: isTokenConfigLoading,
    error: tokenConfigError
  } = useContractTokenConfiguration()

  // Surface the first configured collateral token. The dashboard banner is
  // a single-row summary; for multi-collateral deployments it gives a
  // representative price (the calculator picks per-loan).
  const collateral = supportedCollateralTokens[0]
  const priceDataFeed = usePriceDataFeed(collateral?.address)

  const isLoading =
    collateralLoading || priceDataFeed.isLoading || isTokenConfigLoading
  const error = collateralError || priceDataFeed.error || tokenConfigError

  const priceDecimals = priceDataFeed.decimals
    ? Number(priceDataFeed.decimals)
    : undefined
  const collateralSymbol = collateral?.symbol
  const feeTokenSymbol = tokenConfig?.feeToken.symbol

  const spotPrice = useMemo(() => {
    if (!priceDataFeed.spotPrice || priceDecimals === undefined) return undefined
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

  const feeTokenPrice = useMemo(() => {
    if (!priceDataFeed.originationFeeTokenPrice || priceDecimals === undefined)
      return undefined
    const rawPrice = formatTokenAmount(
      priceDataFeed.originationFeeTokenPrice,
      priceDecimals
    )
    return formatDisplayValue(rawPrice, 4, 4) // smaller-value token → more decimals
  }, [priceDataFeed.originationFeeTokenPrice, priceDecimals])

  return {
    spotPriceRaw: priceDataFeed.spotPrice,
    monthlyAverageRaw: priceDataFeed.monthlyAverage,
    feeTokenPriceRaw: priceDataFeed.originationFeeTokenPrice,

    spotPrice,
    monthlyAverage,
    feeTokenPrice,

    priceDataFeedAddress: priceDataFeed.priceDataFeedAddress,
    collateralTokenAddress: priceDataFeed.collateralTokenAddress,
    originationFeeTokenAddress: priceDataFeed.originationFeeTokenAddress,

    collateralSymbol,
    feeTokenSymbol,

    isLoading,
    error,

    refetch: priceDataFeed.refetch
  }
}
