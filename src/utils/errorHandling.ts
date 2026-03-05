/**
 * Utility functions for consistent error handling across the application
 */

export interface ContractError {
  message: string
  reason?: string
  code?: number
  data?: {
    message?: string
  }
}

/**
 * Check if an error is a user rejection (cancelled transaction)
 */
export const isUserRejection = (error: ContractError): boolean => {
  return (
    error?.message?.includes('User rejected') ||
    error?.message?.includes('User denied') ||
    error?.code === 4001
  )
}

/**
 * Check if a string is the RPC gas cap message (not a real Solidity revert reason)
 */
const isGasCapMessage = (text: string): boolean =>
  /tx fee.*exceeds the configured cap|gas required exceeds allowance/i.test(text)

/**
 * Check if any error text field matches a gas estimation / simulation failure
 */
const isGasEstimationError = (error: ContractError): boolean => {
  const texts = [error?.message, error?.reason, error?.data?.message].filter(Boolean)
  return texts.some(
    (t) =>
      t!.includes('exceeds the configured cap') ||
      t!.includes('EstimateGasExecutionError') ||
      t!.includes('gas required exceeds allowance')
  )
}

/**
 * Extract meaningful error message from contract error
 */
export const extractErrorMessage = (error: ContractError): string => {
  // Check gas estimation / simulation errors first — these surface on-chain reverts
  // and can appear in any error field (message, reason, data.message)
  if (isGasEstimationError(error)) {
    const fullText = [error?.message, error?.reason, error?.data?.message].filter(Boolean).join('\n')
    // Try to extract a real Solidity revert reason (not the gas cap message itself)
    const revertMatch = fullText.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/)
    if (revertMatch && !isGasCapMessage(revertMatch[1].trim())) {
      return revertMatch[1].trim()
    }
    const customErrorMatch = fullText.match(/reverted with custom error '([^']+)'/)
    if (customErrorMatch) {
      return `Contract reverted: ${customErrorMatch[1]}`
    }
    return 'Transaction would fail on-chain. The contract may have a precondition that is not met — check your inputs and try again.'
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.data?.message) {
    return error.data.message
  }

  if (error?.message?.includes('insufficient funds')) {
    return 'Contract validation failed - this may be due to loan state, timing, or other contract rules'
  }

  return error?.message || 'Unknown error'
}

/**
 * Handle contract errors consistently across the app
 */
export const handleContractError = (
  error: ContractError,
  showToast: (options: {
    title: string
    description: string
    variant?: 'destructive'
  }) => void,
  successTitle: string = 'Operation Failed'
): void => {
  // Don't show error toast for user rejections - user knows they cancelled
  if (isUserRejection(error)) {
    return
  }

  const errorMessage = extractErrorMessage(error)

  showToast({
    title: successTitle,
    description: errorMessage,
    variant: 'destructive'
  })
}
