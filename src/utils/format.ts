import BigNumber from 'bignumber.js'
import { formatUnits } from 'viem'
import { formatTokenAmount } from './decimals'

// New contract-specific formatting utilities
export const formatAmount = (amount: bigint, decimals = 18): string => {
  return formatTokenAmount(amount, decimals)
}

export const formatAmountWithSymbol = (
  amount: bigint,
  symbol: string,
  decimals = 18
): string => {
  const formattedAmount = parseFloat(formatAmount(amount, decimals)).toFixed(2)
  return `${formattedAmount} ${symbol}`
}

export const formatDuration = (seconds: bigint): string => {
  const totalSeconds = Number(seconds)
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const months = Math.round(days / 30)
  const years = Math.round(days / 365)

  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`

  const hours = Math.floor(totalSeconds / (60 * 60))
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`

  const minutes = Math.floor(totalSeconds / 60)
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}

export const formatTimestamp = (timestamp: bigint): Date => {
  return new Date(Number(timestamp) * 1000)
}

export const getLoanStatusLabel = (status: number): string => {
  switch (status) {
    case 0:
      return 'Completed' // Fully paid and collateral withdrawn
    case 1:
      return 'Unlocked' // Paid off but collateral not withdrawn
    case 2:
      return 'Defaulted' // Missed payment or overdue beyond grace period
    case 3:
      return 'Active' // Currently in repayment
    default:
      return 'Unknown'
  }
}

export const getLoanStatusVariant = (
  status: number
): 'default' | 'secondary' | 'destructive' | 'green' => {
  switch (status) {
    case 0:
      return 'secondary' // Completed (grey)
    case 1:
      return 'green' // Unlocked (green)
    case 2:
      return 'destructive' // Defaulted
    case 3:
      return 'default' // Active
    default:
      return 'default'
  }
}

export const truncateAddress = (
  address: string,
  start: number = 6,
  end: number = 4
): string => {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}
