export enum ErrorType {
  APPROVAL_ERROR = 'Approval Error',
  MINTING_ERROR = 'Minting Error',
  INSUFFICIENT_FUNDS = 'Insufficient Funds',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  WALLET_CONNECTION_ERROR = 'WALLET_CONNECTION_ERROR',
  CONTRACT_INTERACTION_ERROR = 'CONTRACT_INTERACTION_ERROR',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_GAS = 'Insufficient Gas',
  GAS_LIMIT_TOO_LOW = 'Gas Limit Too Low'
}

export class MintError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'MintError'
  }
}

export function parseContractError(error: any): MintError {
  const errorMessage = error.message || String(error)
  const lowerCaseError = errorMessage.toLowerCase()

  if (lowerCaseError.includes('gas limit is too low')) {
    return new MintError(
      ErrorType.GAS_LIMIT_TOO_LOW,
      'The gas limit for this transaction is too low. Please increase your gas limit and try again.'
    )
  }

  if (
    lowerCaseError.includes('insufficient gas') ||
    lowerCaseError.includes('out of gas')
  ) {
    return new MintError(
      ErrorType.INSUFFICIENT_GAS,
      "There isn't enough gas to complete this transaction. Please increase your gas limit and try again."
    )
  }

  if (
    errorMessage.toLowerCase().includes('transfer amount exceeds allowance')
  ) {
    return new MintError(
      ErrorType.INSUFFICIENT_ALLOWANCE,
      "You haven't approved enough tokens for this transaction. Please increase your allowance and try again."
    )
  }

  if (errorMessage.toLowerCase().includes('insufficient funds')) {
    return new MintError(
      ErrorType.INSUFFICIENT_FUNDS,
      "You don't have enough funds to complete this transaction. Please check your balance and try again."
    )
  }

  if (errorMessage.toLowerCase().includes('user rejected')) {
    return new MintError(
      ErrorType.USER_REJECTED,
      "You've rejected the transaction. Please try again if you want to proceed."
    )
  }
  if (errorMessage.toLowerCase().includes('transfer amount exceeds balance')) {
    return new MintError(
      ErrorType.INSUFFICIENT_FUNDS,
      "You don't have enough funds to complete this transaction. Please check your balance and try again."
    )
  }

  // If none of the above, return a generic contract interaction error
  return new MintError(
    ErrorType.CONTRACT_INTERACTION_ERROR,
    'An unexpected error occurred while interacting with the contract. Please try again later or contact support if the problem persists.',
    error
  )
}
