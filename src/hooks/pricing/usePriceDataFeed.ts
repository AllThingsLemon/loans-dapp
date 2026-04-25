import { useCallback } from 'react'
import {
  useReadPriceDataFeedGetSpotPrice,
  useReadPriceDataFeedGetMonthlyAverage,
  useReadPriceDataFeedGetDailyAveragesHistory,
  useReadPriceDataFeedDecimals,
  useReadLoansPriceDataFeed,
  useReadLoansOriginationFeeToken
} from '@/src/generated'

export interface UsePriceDataFeedReturn {
  // Contract addresses
  priceDataFeedAddress: `0x${string}` | undefined
  collateralTokenAddress: `0x${string}` | undefined
  originationFeeTokenAddress: `0x${string}` | undefined

  // Price data
  spotPrice: bigint | undefined
  monthlyAverage: bigint | undefined
  originationFeeTokenPrice: bigint | undefined
  decimals: bigint | undefined

  // Loading states
  isLoading: boolean
  isLoadingAddresses: boolean
  isLoadingPrices: boolean

  // Error states
  error: Error | null

  // Utility functions
  refetch: () => Promise<void>
}

/**
 * Reads price data for a single collateral token plus the origination fee token.
 *
 * The collateral token is passed in by the caller (typically the first asset
 * registered on the CollateralManager). We deliberately do NOT use
 * Loans.nativeGasToken here — that's the chain's gas token (e.g. WBNB on BSC)
 * which the price feed isn't required to track. The price banner cares about
 * the actual collateral the user posts, which lives on CollateralManager.
 */
export const usePriceDataFeed = (
  collateralTokenAddress: `0x${string}` | undefined
): UsePriceDataFeedReturn => {
  const {
    data: priceDataFeedAddress,
    isLoading: isPriceDataFeedAddressLoading,
    error: priceDataFeedAddressError,
    refetch: refetchPriceDataFeedAddress
  } = useReadLoansPriceDataFeed()

  const {
    data: originationFeeTokenAddress,
    isLoading: isOriginationFeeTokenAddressLoading,
    error: originationFeeTokenAddressError,
    refetch: refetchOriginationFeeTokenAddress
  } = useReadLoansOriginationFeeToken()

  const {
    data: spotPrice,
    isLoading: isSpotPriceLoading,
    error: spotPriceError,
    refetch: refetchSpotPrice
  } = useReadPriceDataFeedGetSpotPrice({
    address: priceDataFeedAddress,
    args: collateralTokenAddress ? [collateralTokenAddress] : undefined,
    query: {
      enabled: !!(priceDataFeedAddress && collateralTokenAddress)
    }
  })

  const {
    data: monthlyAverage,
    isLoading: isMonthlyAverageLoading,
    error: monthlyAverageError,
    refetch: refetchMonthlyAverage
  } = useReadPriceDataFeedGetMonthlyAverage({
    address: priceDataFeedAddress,
    args: collateralTokenAddress ? [collateralTokenAddress] : undefined,
    query: {
      enabled: !!(priceDataFeedAddress && collateralTokenAddress)
    }
  })

  // Origination-fee-token price via getDailyAveragesHistory (last 1 day).
  // Returns DailyAverageEntry[]: [{ averagePrice, timestamp, dataPoints, confidence }]
  const {
    data: feeTokenPriceHistory,
    isLoading: isFeeTokenPriceLoading,
    error: feeTokenPriceError,
    refetch: refetchFeeTokenPrice
  } = useReadPriceDataFeedGetDailyAveragesHistory({
    address: priceDataFeedAddress,
    args: originationFeeTokenAddress ? [originationFeeTokenAddress, 1] : undefined,
    query: {
      enabled: !!(priceDataFeedAddress && originationFeeTokenAddress)
    }
  })
  const originationFeeTokenPrice = feeTokenPriceHistory?.[0]?.averagePrice

  const {
    data: decimals,
    isLoading: isDecimalsLoading,
    error: decimalsError,
    refetch: refetchDecimals
  } = useReadPriceDataFeedDecimals({
    address: priceDataFeedAddress,
    query: {
      enabled: !!priceDataFeedAddress
    }
  })

  const isLoadingAddresses =
    isPriceDataFeedAddressLoading || isOriginationFeeTokenAddressLoading
  const isLoadingPrices =
    isSpotPriceLoading ||
    isMonthlyAverageLoading ||
    isDecimalsLoading ||
    isFeeTokenPriceLoading
  const isLoading = isLoadingAddresses || isLoadingPrices

  const error =
    priceDataFeedAddressError ||
    originationFeeTokenAddressError ||
    spotPriceError ||
    monthlyAverageError ||
    decimalsError ||
    feeTokenPriceError

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchPriceDataFeedAddress(),
      refetchOriginationFeeTokenAddress(),
      refetchSpotPrice(),
      refetchMonthlyAverage(),
      refetchFeeTokenPrice(),
      refetchDecimals()
    ])
  }, [
    refetchPriceDataFeedAddress,
    refetchOriginationFeeTokenAddress,
    refetchSpotPrice,
    refetchMonthlyAverage,
    refetchFeeTokenPrice,
    refetchDecimals
  ])

  return {
    priceDataFeedAddress,
    collateralTokenAddress,
    originationFeeTokenAddress,
    spotPrice,
    monthlyAverage,
    originationFeeTokenPrice,
    decimals,
    isLoading,
    isLoadingAddresses,
    isLoadingPrices,
    error,
    refetch
  }
}
