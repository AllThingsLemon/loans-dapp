import {
  subMonths,
  format,
  subDays,
  subYears,
  startOfDay,
  endOfDay
} from 'date-fns'
import { formatUnits } from 'viem'

export const formatBalance = (
  balance: bigint,
  decimals: number = 18
): string => {
  const formattedBalance = formatUnits(balance, decimals)
  return parseFloat(formattedBalance).toFixed(2)
}

export const handleQuantityChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setQuantity: (value: string) => void
) => {
  const value = e.target.value.replace(/^0+/, '').replace(/[^0-9]/g, '')
  setQuantity(value === '' ? '0' : value)
}

export const calculateTotalCost = (
  quantity: string,
  mintCost: number
): number => {
  return mintCost * (parseInt(quantity, 10) || 0)
}

export const isValidQuantity = (quantity: string): boolean => {
  return parseInt(quantity, 10) > 0
}

export interface DateRange {
  startDate: string
  endDate: string
}

type Breakdown = 'day' | 'week' | 'month' | 'year'

export function getDateRange(amount: number, breakdown: Breakdown): DateRange {
  const endDate = endOfDay(new Date())
  let startDate: Date

  switch (breakdown) {
    case 'day':
      startDate = startOfDay(subDays(endDate, amount - 1))
      break
    case 'week':
      startDate = startOfDay(subDays(endDate, amount * 7 - 1))
      break
    case 'month':
      startDate = startOfDay(subMonths(endDate, amount))
      break
    case 'year':
      startDate = startOfDay(subYears(endDate, amount))
      break
    default:
      throw new Error('Invalid breakdown')
  }

  return {
    startDate: format(startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    endDate: format(endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
  }
}

export interface NftDataItem {
  value: string
  date: string | Date
  key: string
  type: 'token_price' | 'token_holder_count' | 'nft_total_supply'
}

export const processNftDataChart = (nftTotalSupplyData: NftDataItem[]) => {
  if (!nftTotalSupplyData || nftTotalSupplyData.length < 2) {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: 1,
      displayValue: 'N/A'
    }))
  }

  const sortedData = [...nftTotalSupplyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const dailyChanges = sortedData.slice(0, 8).map((item, index, array) => {
    const currentValue = parseFloat(item.value)
    const prevValue =
      index === 0 ? currentValue : parseFloat(array[index - 1].value)
    const change = Math.max(0, currentValue - prevValue)
    return {
      date: item.date,
      value: change,
      displayValue: change === 0 ? 'N/A' : change.toFixed(0)
    }
  })

  return dailyChanges.slice(1)
}

export const processTokenPriceDataChart = (tokenPriceData: NftDataItem[]) => {
  if (!tokenPriceData || tokenPriceData.length === 0) {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      price: 0,
      displayPrice: 'N/A'
    }))
  }

  return [...tokenPriceData]
    .reverse()
    .slice(0, 7)
    .map((item) => ({
      date: item.date,
      price: parseFloat(item.value),
      displayPrice: `$${parseFloat(item.value).toFixed(2)}`
    }))
}

export const formatDate = (date: string, format: 'short' | 'long') => {
  const options: Intl.DateTimeFormatOptions = {
    ...(format === 'short'
      ? { weekday: 'short' }
      : { weekday: 'long', month: 'short', day: 'numeric' }),
    timeZone: 'UTC'
  }

  return new Date(date).toLocaleDateString('en-US', options)
}

export const processTokenHolderDataChart = (tokenHolderData: NftDataItem[]) => {
  if (!tokenHolderData || tokenHolderData.length === 0) {
    return Array(7).fill({ wallets: 1 })
  }

  const processedData = tokenHolderData
    .slice(0, 7)
    .map((item) => ({
      wallets: parseInt(item.value, 10)
    }))
    .reverse()

  const lastValue = processedData[processedData.length - 1].wallets

  while (processedData.length < 7) {
    processedData.push({ wallets: lastValue })
  }

  return processedData
}

export const calculateUserDailyRewardRate = (
  dailyRewardRate: bigint | undefined,
  userTotalStakedBalance: bigint | undefined
): string => {
  if (!dailyRewardRate || !userTotalStakedBalance) return '0'
  return formatBalance(dailyRewardRate)
}

export const calculateUserDailyRewardUSD = (
  userDailyRewardRate: string,
  currentPrice: number
): number => {
  return Number(userDailyRewardRate) * currentPrice
}
