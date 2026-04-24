// Contract response types with proper structure

export interface LoanStructResponse {
  readonly [0]: string  // account
  readonly [1]: string  // collateralToken
  readonly [2]: bigint  // createdAt
  readonly [3]: bigint  // loanAmount
  readonly [4]: bigint  // duration
  readonly [5]: bigint  // originalDuration
  readonly [6]: bigint  // interestAmount
  readonly [7]: bigint  // interestApr
  readonly [8]: bigint  // paidAmount
  readonly [9]: bigint  // ltv
  readonly [10]: bigint // originationFee
  readonly [11]: bigint // collateralAmount
  readonly [12]: bigint // loanCycleDuration
}

export interface LoanConfigResponse {
  readonly [0]: bigint // minLoanAmount
  readonly [1]: bigint // minLoanDuration
  readonly [2]: bigint // maxLoanDuration
  readonly [3]: bigint // balloonPaymentGraceDuration
  readonly [4]: bigint // loanCycleDuration
  readonly [5]: bigint // aprYearDuration
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
    collateralToken: data[1] as `0x${string}`,
    createdAt: data[2],
    loanAmount: data[3],
    duration: data[4],
    originalDuration: data[5],
    interestAmount: data[6],
    interestApr: data[7],
    paidAmount: data[8],
    ltv: data[9],
    originationFee: data[10],
    collateralAmount: data[11],
    loanCycleDuration: data[12]
  }
}

export function parseLoanConfig(data: LoanConfigResponse) {
  return {
    minLoanAmount: data[0],
    minLoanDuration: data[1],
    maxLoanDuration: data[2],
    balloonPaymentGraceDuration: data[3],
    loanCycleDuration: data[4],
    aprYearDuration: data[5]
  }
}

export function parseInterestConfig(data: InterestConfigResponse) {
  return {
    minDuration: data[0],
    maxDuration: data[1],
    interestApr: data[2]
  }
}
