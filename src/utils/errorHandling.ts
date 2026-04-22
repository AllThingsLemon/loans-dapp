/**
 * Utility functions for consistent error handling across the application
 */

export interface ContractError {
  message: string
  reason?: string
  code?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cause?: any
  data?: {
    message?: string
    errorName?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: readonly any[]
  }
}

/**
 * Human-readable descriptions for all known contract custom errors.
 */
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  // LiquidityPool
  AddressZero: 'Invalid address — zero address provided.',
  AssetNotSupported: 'This token is not supported for deposits.',
  BelowMinimumDeposit: 'Amount is below the minimum deposit requirement.',
  CannotCancelFundedRequest: 'Cannot cancel a withdrawal that has already been funded.',
  CannotTransferToSelf: 'Cannot transfer to your own address.',
  EarningsTooEarly: 'Earnings distribution is not available yet — please wait for the cooldown period.',
  InsufficientEarnings: 'Insufficient earnings available for this action.',
  InsufficientNativeFee: 'Insufficient network fee — this operation requires a small TLEMX fee. Please try again.',
  InsufficientShares: 'Insufficient shares for this operation.',
  InsufficientUnlocked: 'Insufficient unlocked liquidity — your deposit may still be in its lock period.',
  InvalidAmount: 'Invalid amount provided.',
  InvalidBpsTotal: 'Invalid fee configuration (basis points total is wrong).',
  InvalidTierDuration: 'Invalid lock tier duration.',
  InvalidTierIndex: 'Invalid lock tier index.',
  InvalidTierMultiplier: 'Invalid interest multiplier for lock tier.',
  LockDurationNotAvailable: 'The selected lock duration is not available.',
  LockTierDisabled: 'The selected lock tier is currently disabled.',
  NativeFeeTransferFailed: 'Failed to transfer the required network fee.',
  NoEarningsAvailable: 'No earnings available to distribute.',
  NoPriceAvailable: 'No price available for this token.',
  NotRequestOwner: 'You do not own this withdrawal request.',
  PriceNotConfigured: 'Price feed not configured for this token.',
  PrincipalUnhealthy: 'Pool principal is unhealthy — the deficit must be resolved before this action is allowed.',
  Unauthorized: 'You are not authorized to perform this action.',
  UtilizationBelowThreshold: 'Pool utilization is below the required threshold.',
  WithdrawalAlreadyClaimed: 'This withdrawal has already been claimed.',
  WithdrawalNotFullyFunded: 'Withdrawal has not been fully funded yet.',
  WithdrawalRequestNotFound: 'Withdrawal request not found.',
  // Loans
  InvalidLoanId: 'Invalid loan ID.',
  LoanNotActive: 'This loan is not active.',
  LoanNotDefaulted: 'This loan has not defaulted.',
  LoanAlreadyExists: 'A loan with this ID already exists.',
  InsufficientCollateral: 'Insufficient collateral for this loan.',
  InsufficientLiquidity: 'Insufficient liquidity in the pool.',
  PaymentTooLow: 'Payment amount is too low.',
  // DefaultLiquidator
  BufferTooHigh: 'Liquidation buffer is set too high.',
  EmptySlot: 'Swap slot is empty.',
  InvalidSlotIndex: 'Invalid swap slot index.',
  NoPendingCollateral: 'No pending collateral to liquidate.',
  NoProceeds: 'No proceeds available to pull.',
  OnlyLoans: 'This action can only be called by the Loans contract.',
  SlotBusy: 'Swap slot is already in use.',
  TooSoon: 'Cannot create a new swap yet — please wait for the creation interval.',
  TransferFailed: 'Token transfer failed.',
}

/**
 * Walk the viem error cause chain to find a ContractFunctionRevertedError
 * and extract the decoded custom error name + args.
 */
function findRevertedError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any
): { errorName: string; args?: readonly unknown[] } | null {
  if (!err) return null
  if (
    err.name === 'ContractFunctionRevertedError' &&
    err.data?.errorName
  ) {
    return { errorName: err.data.errorName, args: err.data.args }
  }
  return findRevertedError(err.cause)
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
 * Collect all text from an error object by stringifying the full cause chain.
 * This ensures we can find error names regardless of how deep they are nested.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectErrorText(err: any, depth = 0): string {
  if (!err || depth > 10) return ''
  const parts: string[] = []
  if (typeof err.shortMessage === 'string') parts.push(err.shortMessage)
  if (typeof err.message === 'string') parts.push(err.message)
  if (typeof err.reason === 'string') parts.push(err.reason)
  if (err.data) {
    if (typeof err.data === 'string') parts.push(err.data)
    if (typeof err.data?.message === 'string') parts.push(err.data.message)
    if (typeof err.data?.errorName === 'string') parts.push(err.data.errorName)
  }
  if (err.cause) parts.push(collectErrorText(err.cause, depth + 1))
  return parts.join('\n')
}

/**
 * Scan collected error text for any known contract error name.
 */
function findErrorNameInText(text: string): string | null {
  for (const errorName of Object.keys(CONTRACT_ERROR_MESSAGES)) {
    // Match as a whole word to avoid false partial matches
    if (new RegExp(`\\b${errorName}\\b`).test(text)) {
      return errorName
    }
  }
  return null
}

/**
 * Extract meaningful error message from contract error
 */
export const extractErrorMessage = (error: ContractError): string => {
  // 1. Walk the viem cause chain for a decoded custom error (cleanest path)
  const revertError = findRevertedError(error)
  if (revertError) {
    const friendly = CONTRACT_ERROR_MESSAGES[revertError.errorName]
    return friendly ?? `Contract error: ${revertError.errorName}`
  }

  // 2. Collect all text from the full error / cause chain and scan for known names.
  //    Handles cases where the RPC doesn't return decoded revert data, but viem still
  //    includes the error name as a string somewhere (e.g. "Error: InsufficientNativeFee()").
  const allText = collectErrorText(error)
  const errorNameInText = findErrorNameInText(allText)
  if (errorNameInText) {
    return CONTRACT_ERROR_MESSAGES[errorNameInText]!
  }

  // 3. Gas estimation / simulation errors — try to extract a revert reason string
  if (isGasEstimationError(error)) {
    const revertMatch = allText.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/)
    if (revertMatch && !isGasCapMessage(revertMatch[1].trim())) {
      return revertMatch[1].trim()
    }
    return 'Transaction would fail on-chain. The contract may have a precondition that is not met — check your inputs and try again.'
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.data?.message) {
    return error.data.message
  }

  // 5. Fall back to shortMessage (clean, no raw call args) or a generic message.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shortMsg = (error as any)?.shortMessage as string | undefined
  if (shortMsg && !shortMsg.includes('Raw Call Arguments')) {
    return shortMsg
  }

  // Strip "Raw Call Arguments" noise from the full message as last resort
  const fullMsg = error?.message || ''
  const rawArgsIdx = fullMsg.indexOf('Raw Call Arguments')
  if (rawArgsIdx > 0) {
    return fullMsg.slice(0, rawArgsIdx).trim().replace(/\.$/, '') || 'Transaction failed.'
  }

  return fullMsg || 'Transaction failed.'
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
