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
 * Extract meaningful error message from contract error
 */
export const extractErrorMessage = (error: ContractError): string => {
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
