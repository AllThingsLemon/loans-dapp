import BigNumber from 'bignumber.js'
import { formatUnits } from 'viem'
import { formatTokenAmount, significantFractionDigits } from './decimals'

// New contract-specific formatting utilities
export const formatAmount = (
  amount: bigint,
  decimals: number | undefined
): string => {
  return formatTokenAmount(amount, decimals ?? 18)
}

/**
 * Floor a value to N decimal places for display. Balances and receivable
 * amounts must round DOWN — half-up rounding shows users money they don't
 * quite have (99.996 renders as "100.00", and typing that back in then fails
 * the exact-amount balance check).
 */
export const floorToDecimals = (value: number, decimals: number): number => {
  const factor = 10 ** decimals
  return Math.floor(value * factor) / factor
}

// `decimals` is deliberately required (undefined allowed while token config is
// still loading). A defaulted-18 third argument let call sites silently render
// 8-decimal chains as 0.00 — every caller must state where its decimals come from.
export const formatAmountWithSymbol = (
  amount: bigint,
  symbol: string,
  decimals: number | undefined
): string => {
  const num = parseFloat(formatAmount(amount, decimals))
  // Always at least 2 fraction digits (money-style "1,000.00"), extended as
  // far as needed so tiny amounts keep 2 significant digits — 0.0000126 BTCB
  // must render as "0.000013", never "0.00".
  const formattedAmount = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.max(2, significantFractionDigits(num))
  })
  return `${formattedAmount} ${symbol}`
}

export const formatDuration = (seconds: bigint): string => {
  // Define constants once
  const SECONDS_PER_MINUTE = 60
  const SECONDS_PER_HOUR = 60 * 60
  const SECONDS_PER_DAY = 24 * 60 * 60
  const SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY // Financial calendar
  const SECONDS_PER_YEAR = 360 * SECONDS_PER_DAY // Financial calendar

  let remaining = Number(seconds)

  // Define units in descending order
  const units = [
    { name: 'year', seconds: SECONDS_PER_YEAR },
    { name: 'month', seconds: SECONDS_PER_MONTH },
    { name: 'day', seconds: SECONDS_PER_DAY },
    { name: 'hour', seconds: SECONDS_PER_HOUR },
    { name: 'minute', seconds: SECONDS_PER_MINUTE }
  ]

  const parts: string[] = []

  for (const unit of units) {
    const count = Math.floor(remaining / unit.seconds)
    if (count > 0) {
      parts.push(`${count} ${unit.name}${count > 1 ? 's' : ''}`)
      remaining -= count * unit.seconds
    }

    // Stop after 2 significant units
    if (parts.length >= 2) break
  }

  return parts.length > 0 ? parts.join(' ') : '0 minutes'
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
    case 4:
      return 'Liquidated' // Liquidated
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
    case 4:
      return 'destructive' // Liquidated
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
