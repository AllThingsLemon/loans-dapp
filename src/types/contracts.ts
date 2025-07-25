// Contract response types with proper structure

export interface LoanStructResponse {
  readonly [0]: string // account
  readonly [1]: bigint // createdAt  
  readonly [2]: bigint // loanAmount
  readonly [3]: bigint // duration
  readonly [4]: bigint // interestAmount
  readonly [5]: bigint // interestApr
  readonly [6]: bigint // paidAmount
  readonly [7]: bigint // ltv
  readonly [8]: bigint // originationFee
  readonly [9]: bigint // collateralAmount
  readonly [10]: bigint // loanCycleDuration
  readonly [11]: boolean // collateralWithdrawn
}

export interface LoanConfigResponse {
  readonly [0]: bigint // minLoanAmount
  readonly [1]: bigint // minLoanDuration
  readonly [2]: bigint // maxLoanDuration
  readonly [3]: bigint // balloonPaymentGraceDuration
  readonly [4]: bigint // loanCycleDuration
  readonly [5]: bigint // maxLoanExtension
}

export interface InterestConfigResponse {
  readonly [0]: bigint // minDuration
  readonly [1]: bigint // maxDuration
  readonly [2]: bigint // interestApr
}

// Helper functions to safely parse contract responses
export function parseLoanStruct(data: LoanStructResponse) {
  return {
    account: data[0] as `0x${string}`,
    createdAt: data[1],
    loanAmount: data[2],
    duration: data[3],
    interestAmount: data[4],
    interestApr: data[5],
    paidAmount: data[6],
    ltv: data[7],
    originationFee: data[8],
    collateralAmount: data[9],
    loanCycleDuration: data[10],
    collateralWithdrawn: data[11]
  }
}

export function parseLoanConfig(data: LoanConfigResponse) {
  return {
    minLoanAmount: data[0],
    minLoanDuration: data[1],
    maxLoanDuration: data[2],
    balloonPaymentGraceDuration: data[3],
    loanCycleDuration: data[4],
    maxLoanExtension: data[5]
  }
}

export function parseInterestConfig(data: InterestConfigResponse) {
  return {
    minDuration: data[0],
    maxDuration: data[1],
    interestApr: data[2]
  }
}