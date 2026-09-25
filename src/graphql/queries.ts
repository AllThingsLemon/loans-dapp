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

/**
 * The latest pool pulls at or before `$at` (unix seconds); the newest one's
 * accumulator is the pool's value as of that moment. Several rows come back
 * because BSC fits ~2 blocks in a second and v2 tables carry no block number
 * column — callers break blockTimestamp ties on the event id.
 *
 * PENDING INDEXER WORK: `LiquidityPool_EarningsPulled` is indexed but not yet
 * tracked in Hasura; until it is, this query fails validation.
 */
export const EARNINGS_PULLED_AT = gql`
  query EarningsPulledAt($chainId: Int!, $srcAddress: String!, $at: Int!) {
    LiquidityPool_EarningsPulled(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        blockTimestamp: { _lte: $at }
      }
      order_by: { blockTimestamp: desc }
      limit: 10
    ) {
      id
      chainId
      srcAddress
      blockTimestamp
      transactionHash
      newAccumulatedPerInterestShare
    }
  }
`
