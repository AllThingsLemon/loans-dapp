import { useQuery } from '@tanstack/react-query'
import {
  getApiV1TokenStatsOptions,
  getApiV1TokenStatsLatestOptions
} from '../client/@tanstack/react-query.gen'
import { getDateRange } from './helpers'
import { useChainAddress } from '../hooks/useChainAddress'

export function useHistoricTokenData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const { startDate: dayStartDate, endDate: dayEndDate } = getDateRange(
    7,
    'day'
  )
  const tokenKey = useChainAddress('token')
  const nftKey = useChainAddress('nft')

  const safeQueryOptions = {
    retry: false, // Disable retries
    onError: (error: unknown) => {
      console.warn('Data unavailable:', error)
    },
    enabled: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  }

  const queries = {
    historicTokenPrice: useQuery({
      ...getApiV1TokenStatsOptions({
        baseUrl,
        query: {
          type: 'token_price',
          key: tokenKey,
          startDate: new Date(dayStartDate),
          endDate: new Date(dayEndDate),
          aggregate: 'avg',
          breakdown: 'day'
        }
      }),
      ...safeQueryOptions
    }),
    historicTokenHolderCount: useQuery({
      ...getApiV1TokenStatsOptions({
        baseUrl,
        query: {
          type: 'token_holder_count',
          key: tokenKey,
          startDate: new Date(dayStartDate),
          endDate: new Date(dayEndDate),
          aggregate: 'avg',
          breakdown: 'day'
        }
      }),
      ...safeQueryOptions
    }),
    currentTokenHolderCount: useQuery({
      ...getApiV1TokenStatsLatestOptions({
        baseUrl,
        query: { type: 'token_holder_count', key: tokenKey }
      }),
      ...safeQueryOptions
    }),
    currentTokenPrice: useQuery({
      ...getApiV1TokenStatsLatestOptions({
        baseUrl,
        query: { type: 'token_price', key: tokenKey }
      }),
      ...safeQueryOptions
    }),
    nftTotalSupply: useQuery({
      ...getApiV1TokenStatsOptions({
        baseUrl,
        query: {
          type: 'nft_total_supply',
          key: nftKey,
          startDate: new Date(dayStartDate),
          endDate: new Date(dayEndDate),
          aggregate: 'max',
          breakdown: 'day'
        }
      }),
      ...safeQueryOptions
    })
  }

  const isLoading = Object.values(queries).some((query) => query.isLoading)
  const isError = Object.values(queries).some((query) => query.isError)

  const tokenPriceData = queries.historicTokenPrice.data?.data ?? []
  const historicTokenHolderCountData =
    queries.historicTokenHolderCount.data?.data ?? []
  const currentPrice = parseFloat(
    queries.currentTokenPrice.data?.data?.value ?? '0'
  )
  const currentTokenHolderCount = parseInt(
    queries.currentTokenHolderCount.data?.data?.value ?? '0'
  )

  const oneDayAgoDataPoint = tokenPriceData.find((data) => {
    const timeDiff = new Date().getTime() - new Date(data.date).getTime()
    return timeDiff >= 24 * 60 * 60 * 1000
  })

  const previousDayPrice = oneDayAgoDataPoint
    ? parseFloat(oneDayAgoDataPoint.value)
    : currentPrice

  const priceChange =
    ((currentPrice - previousDayPrice) / previousDayPrice) * 100 || 0

  return {
    tokenPriceData,
    historicTokenHolderCountData,
    currentTokenHolderCountData: currentTokenHolderCount,
    nftTotalSupplyData: queries.nftTotalSupply.data?.data ?? [],
    currentPrice,
    priceChange,
    isLoading,
    isError
  }
}
