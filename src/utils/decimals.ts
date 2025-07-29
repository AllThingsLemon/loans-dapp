import { formatUnits, parseUnits } from 'viem'

export class DecimalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DecimalError'
  }
}

/**
 * Convert percentage to contract format (scaled by precision)
 * @param percentage - Percentage as string (e.g., "50")
 * @param decimals - Number of decimals for the specific precision type
 * @returns BigInt value for contract
 */
export function parsePercentage(
  percentage: string,
  precisionDecimals: number
): bigint {
  if (!percentage || isNaN(Number(percentage))) {
    throw new DecimalError('Invalid percentage value')
  }

  const numValue = Number(percentage)
  if (numValue < 0 || numValue > 100) {
    throw new DecimalError('Percentage must be between 0 and 100')
  }

  return parseUnits(percentage, precisionDecimals)
}

/**
 * Convert contract percentage value to display format
 * @param value - BigInt value from contract
 * @param decimals - Number of decimals for the specific precision type
 * @returns Formatted percentage value (e.g., "20" for 20%)
 */
export function formatPercentage(value: bigint, decimals: number): string {
  if (value < 0n) {
    throw new DecimalError('Percentage value cannot be negative')
  }
  // Convert to decimal then multiply by 100 to get percentage
  const decimal = formatUnits(value, decimals)
  const percentage = (Number(decimal) * 100).toString()
  return percentage
}

/**
 * Convert token amount to contract format
 * @param amount - Amount as string
 * @param decimals - Token decimals
 * @returns BigInt value for contract
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount || isNaN(Number(amount))) {
    throw new DecimalError('Invalid token amount')
  }

  const numValue = Number(amount)
  if (numValue < 0) {
    throw new DecimalError('Token amount cannot be negative')
  }

  return parseUnits(amount, decimals)
}

/**
 * Convert contract token value to display format
 * @param value - BigInt value from contract
 * @param decimals - Token decimals
 * @returns Formatted token amount string
 */
export function formatTokenAmount(value: bigint, decimals: number): string {
  if (value < 0n) {
    throw new DecimalError('Token amount cannot be negative')
  }
  return formatUnits(value, decimals)
}

/**
 * Format display value with appropriate decimal places
 * @param value - Value to format
 * @param decimals - Number of decimal places
 * @param maxDecimals - Maximum decimal places to show
 * @returns Formatted string
 */
export function formatDisplayValue(
  value: string,
  decimals: number,
  maxDecimals: number = 4
): string {
  const num = Number(value)
  if (isNaN(num)) return '0'

  const decimalPlaces = Math.min(decimals, maxDecimals)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces
  })
}

/**
 * Formats duration in seconds to human-readable format
 * @param seconds - Duration in seconds (as bigint)
 * @returns Human-readable duration string
 */
export function formatDuration(seconds: bigint): string {
  const secondsNum = Number(seconds)

  const units = [
    { value: 31536000, label: 'year' },
    { value: 2592000, label: 'month' },
    { value: 604800, label: 'week' },
    { value: 86400, label: 'day' },
    { value: 3600, label: 'hour' },
    { value: 60, label: 'minute' }
  ]

  for (const unit of units) {
    if (secondsNum >= unit.value) {
      const count = Math.floor(secondsNum / unit.value)
      return `${count} ${unit.label}${count > 1 ? 's' : ''}`
    }
  }

  return `${secondsNum} second${secondsNum !== 1 ? 's' : ''}`
}

/**
 * Formats a duration range to human-readable format
 * @param minDuration - Minimum duration in seconds (as bigint)
 * @param maxDuration - Maximum duration in seconds (as bigint)
 * @returns Human-readable duration range string
 */
export function formatDurationRange(
  minDuration: bigint,
  maxDuration: bigint
): string {
  const min = formatDuration(minDuration)
  const max = formatDuration(maxDuration)

  // If min and max are the same, just return one
  if (min === max) {
    return min
  }

  return `${min} - ${max}`
}
