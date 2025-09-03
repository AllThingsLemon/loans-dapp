import { useCallback } from 'react'
import {
  useReadPriceDataFeedGetSpotPrice,
  useReadPriceDataFeedGetMonthlyAverage,
  useReadPriceDataFeedGetDailyAveragesHistory,
  useReadPriceDataFeedDecimals,
  useReadLoansPriceDataFeed,
  useReadLoansCollateralToken,
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

export const usePriceDataFeed = (): UsePriceDataFeedReturn => {
  // Get contract addresses from Loans contract
  const {
    data: priceDataFeedAddress,
    isLoading: isPriceDataFeedAddressLoading,
    error: priceDataFeedAddressError,
    refetch: refetchPriceDataFeedAddress
  } = useReadLoansPriceDataFeed()

  const {
    data: collateralTokenAddress,
    isLoading: isCollateralTokenAddressLoading,
    error: collateralTokenAddressError,
    refetch: refetchCollateralTokenAddress
  } = useReadLoansCollateralToken()

  const {
    data: originationFeeTokenAddress,
    isLoading: isOriginationFeeTokenAddressLoading,
    error: originationFeeTokenAddressError,
    refetch: refetchOriginationFeeTokenAddress
  } = useReadLoansOriginationFeeToken()

  // Get spot price from PriceDataFeed contract
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

  // Get 30-day average price from PriceDataFeed contract
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

  // Get LMLN price using getDailyAveragesHistory (last 1 day)
  const {
    data: lmlnPriceData,
    isLoading: isLmlnPriceLoading,
    error: lmlnPriceError,
    refetch: refetchLmlnPrice
  } = useReadPriceDataFeedGetDailyAveragesHistory({
    address: priceDataFeedAddress,
    args: originationFeeTokenAddress ? [originationFeeTokenAddress, 1] : undefined,
    query: {
      enabled: !!(priceDataFeedAddress && originationFeeTokenAddress)
    }
  })

  // Extract the averagePrice from the DailyAverageEntry struct
  // getDailyAveragesHistory returns: [{ averagePrice, timestamp, dataPoints, confidence }]
  const originationFeeTokenPrice = lmlnPriceData?.[0]?.averagePrice

  // Get decimals from PriceDataFeed contract
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

  // Combined loading states
  const isLoadingAddresses =
    isPriceDataFeedAddressLoading || 
    isCollateralTokenAddressLoading || 
    isOriginationFeeTokenAddressLoading
  const isLoadingPrices =
    isSpotPriceLoading || 
    isMonthlyAverageLoading || 
    isDecimalsLoading || 
    isLmlnPriceLoading
  const isLoading = isLoadingAddresses || isLoadingPrices

  // Combined error state
  const error =
    priceDataFeedAddressError ||
    collateralTokenAddressError ||
    originationFeeTokenAddressError ||
    spotPriceError ||
    monthlyAverageError ||
    decimalsError ||
    lmlnPriceError

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchPriceDataFeedAddress(),
      refetchCollateralTokenAddress(),
      refetchOriginationFeeTokenAddress(),
      refetchSpotPrice(),
      refetchMonthlyAverage(),
      refetchLmlnPrice(),
      refetchDecimals()
    ])
  }, [
    refetchPriceDataFeedAddress,
    refetchCollateralTokenAddress,
    refetchOriginationFeeTokenAddress,
    refetchSpotPrice,
    refetchMonthlyAverage,
    refetchLmlnPrice,
    refetchDecimals
  ])

  return {
    // Contract addresses
    priceDataFeedAddress,
    collateralTokenAddress,
    originationFeeTokenAddress,

    // Price data
    spotPrice,
    monthlyAverage,
    originationFeeTokenPrice,
    decimals,

    // Loading states
    isLoading,
    isLoadingAddresses,
    isLoadingPrices,

    // Error state
    error,

    // Utility functions
    refetch
  }
}
