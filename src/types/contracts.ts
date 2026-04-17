// Contract response types with proper structure

export interface LoanStructResponse {
  readonly [0]: string // account
  readonly [1]: bigint // createdAt
  readonly [2]: bigint // loanAmount
  readonly [3]: bigint // duration
  readonly [4]: bigint // originalDuration
  readonly [5]: bigint // interestAmount
  readonly [6]: bigint // interestApr
  readonly [7]: bigint // paidAmount
  readonly [8]: bigint // ltv
  readonly [9]: bigint // originationFee
  readonly [10]: bigint // collateralAmount
  readonly [11]: bigint // loanCycleDuration
  readonly [12]: boolean // collateralWithdrawn
}

export interface LoanConfigResponse {
  readonly [0]: bigint // minLoanAmount
  readonly [1]: bigint // minLoanDuration
  readonly [2]: bigint // maxLoanDuration
  readonly [3]: bigint // balloonPaymentGraceDuration
  readonly [4]: bigint // loanCycleDuration
  readonly [5]: bigint // maxLoanExtension
  readonly [6]: bigint // aprYearDuration
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
    originalDuration: data[4],
    interestAmount: data[5],
    interestApr: data[6],
    paidAmount: data[7],
    ltv: data[8],
    originationFee: data[9],
    collateralAmount: data[10],
    loanCycleDuration: data[11],
    collateralWithdrawn: data[12]
  }
}

export function parseLoanConfig(data: LoanConfigResponse) {
  return {
    minLoanAmount: data[0],
    minLoanDuration: data[1],
    maxLoanDuration: data[2],
    balloonPaymentGraceDuration: data[3],
    loanCycleDuration: data[4],
    maxLoanExtension: data[5],
    aprYearDuration: data[6]
  }
}

export function parseInterestConfig(data: InterestConfigResponse) {
  return {
    minDuration: data[0],
    maxDuration: data[1],
    interestApr: data[2]
  }
}
