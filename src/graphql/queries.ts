import { gql } from 'graphql-request'

/*
 * List queries are scoped to one contract on one chain and page on `id`
 * (see requestAll). Ordering by `id` is stable but NOT chronological — its
 * block number is not zero-padded — so callers sort rows themselves.
 */

export const LOAN_INITIATED = gql`
  query LoanInitiated(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    Loans_LoanInitiated(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      loanId
      borrower
      loanAmount
      interestAmount
      collateralAmount
      duration
      ltv
      originationFee
    }
  }
`

export const LOAN_PAYMENTS = gql`
  query LoanPayments(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    Loans_LoanPaymentMade(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      loanId
      payer
      paymentAmount
      remainingInterest
      remainingPrincipal
      totalPaidAmount
    }
  }
`

export const LOAN_EXTENDED = gql`
  query LoanExtended(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    Loans_LoanExtended(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      loanId
      borrower
      additionalInterest
      extensionDuration
      extensionFee
      newTotalDuration
      newTotalInterest
    }
  }
`

/*
 * The pool's share history: every event that changes its liquidity or
 * interest share totals. Summed, they must equal the pool's live totals —
 * useThirtyDayReturns checks that before trusting them.
 */

export const POOL_DEPOSITS = gql`
  query PoolDeposits(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_Deposited(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      user
      token
      tokenAmount
      stableTokenValue
      liquidityShares
      interestShares
      lockDuration
      nonEarning
    }
  }
`

export const POOL_COMPOUNDS = gql`
  query PoolCompounds(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_EarningsCompounded(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      user
      earningsAmount
      liquidityShares
      interestShares
    }
  }
`

export const POOL_WITHDRAWALS = gql`
  query PoolWithdrawals(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_Withdrawn(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      user
      amount
      liquiditySharesBurned
      interestSharesBurned
    }
  }
`

export const POOL_BOOST_EXPIRIES = gql`
  query PoolBoostExpiries(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_BoostExpired(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      expiresAt
      boostShares
    }
  }
`

/**
 * Every pullEarnings() on the pool — each time interest is distributed from
 * Loans to depositors. Summed, the amounts must equal
 * Loans.totalInterestDistributed().
 */
export const EARNINGS_PULLED = gql`
  query EarningsPulled(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_EarningsPulled(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      amount
      newAccumulatedPerInterestShare
      totalInterestShares
    }
  }
`
