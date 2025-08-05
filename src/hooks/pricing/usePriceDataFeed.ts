import { useCallback } from 'react'
import {
  useReadPriceDataFeedGetSpotPrice,
  useReadPriceDataFeedGetMonthlyAverage,
  useReadLoansPriceDataFeed,
  useReadLoansCollateralToken
} from '@/src/generated'

export interface UsePriceDataFeedReturn {
  // Contract addresses
  priceDataFeedAddress: `0x${string}` | undefined
  collateralTokenAddress: `0x${string}` | undefined

  // Price data
  spotPrice: bigint | undefined
  monthlyAverage: bigint | undefined

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

  // Combined loading states
  const isLoadingAddresses =
    isPriceDataFeedAddressLoading || isCollateralTokenAddressLoading
  const isLoadingPrices = isSpotPriceLoading || isMonthlyAverageLoading
  const isLoading = isLoadingAddresses || isLoadingPrices

  // Combined error state
  const error =
    priceDataFeedAddressError ||
    collateralTokenAddressError ||
    spotPriceError ||
    monthlyAverageError

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchPriceDataFeedAddress(),
      refetchCollateralTokenAddress(),
      refetchSpotPrice(),
      refetchMonthlyAverage()
    ])
  }, [
    refetchPriceDataFeedAddress,
    refetchCollateralTokenAddress,
    refetchSpotPrice,
    refetchMonthlyAverage
  ])

  return {
    // Contract addresses
    priceDataFeedAddress,
    collateralTokenAddress,

    // Price data
    spotPrice,
    monthlyAverage,

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
