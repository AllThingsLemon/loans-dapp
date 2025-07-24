import BigNumber from 'bignumber.js'
import { formatUnits } from 'viem'
import {
  formatTokenAmount,
  formatPercentage as formatContractPercentage
} from './decimals'

export const formatCurrency = (number: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  return formatter.format(number)
}

//if a variable can be either a number OR big number object, makes sure that it is a big number object
export const formatBigNumber = (
  value: number | string | BigNumber | BigInt | undefined
): BigNumber => new BigNumber(value?.toString() || Number(value))

export const formatDelta = (
  current: string,
  previous: string
): { change: 'neutral' | 'positive' | 'negative' | string; delta: string } => {
  const today = new BigNumber(current)
  const h24Change = new BigNumber(previous)

  const displayPercentage = h24Change.abs()
  let delta = '±'
  let change = 'neutral'

  if (h24Change.isLessThan(0)) {
    delta = '-'
    change = 'negative'
  } else if (h24Change.isGreaterThan(0)) {
    delta = '+'
    change = 'positive'
  }

  const marketDelta = `${delta}${displayPercentage.toFixed(2)}%`
  return {
    change,
    delta: marketDelta
  }
}

export const formatAtomicUnits = (
  amount: bigint | undefined,
  decimals: bigint,
  symbol: string | undefined,
  decimalPlaces: number = 4,
  hideZero = false
) => {
  if (!amount) {
    return '-'
  }
  if (amount == 0n) {
    return '-'
  }
  const amountBigNum = BigNumber(amount.toString())
  const moveDecimalDivisorBigNum = BigNumber((10n ** decimals).toString())
  const unitsWithDecimals = amountBigNum.div(moveDecimalDivisorBigNum)

  const num = unitsWithDecimals.toNumber().toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  })

  return `${hideZero ? Number(num) : num} ${symbol?.toUpperCase()}`
}

// New contract-specific formatting utilities
export const formatAmount = (amount: bigint, decimals = 18): string => {
  return formatTokenAmount(amount, decimals)
}

export const formatAmountWithSymbol = (
  amount: bigint,
  symbol: string = 'LUSD',
  decimals = 18
): string => {
  const formattedAmount = parseFloat(formatAmount(amount, decimals)).toFixed(2)
  return `${formattedAmount} ${symbol}`
}

// Generalized formatter for contract values that represent percentages
export const formatWithPrecision = (
  value: bigint,
  contractPrecision: bigint
): string => {
  // Use the decimal utility which properly handles precision decimals
  const precisionDecimals = Math.log10(Number(contractPrecision))
  return formatContractPercentage(value, precisionDecimals) + '%'
}

// Legacy formatter - use formatWithPrecision or formatContractPercentage instead
export const formatPercentage = (
  value: bigint,
  precision?: bigint | number
): string => {
  // If no precision provided, assume it's already a percentage
  if (!precision) {
    return (Number(value) / 100).toFixed(2) + '%'
  }
  return formatWithPrecision(value, BigInt(precision))
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
): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 0:
      return 'secondary' // Completed
    case 1:
      return 'secondary' // Unlocked
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
