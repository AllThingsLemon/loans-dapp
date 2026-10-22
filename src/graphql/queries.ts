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
 * A borrower's latest loan events, newest first, `$limit` of each kind, in
 * one request — for the dashboard's Recent Activity. Payments are matched by
 * loan, since anyone may pay a loan; the rest carry the borrower. Loans
 * events before ~2026-08-31 aren't indexed (see the indexer notes), so
 * openings come from the chain instead.
 */
export const BORROWER_ACTIVITY = gql`
  query BorrowerActivity(
    $chainId: Int!
    $srcAddress: String!
    $borrower: String!
    $loanIds: [String!]!
    $limit: Int!
  ) {
    payments: Loans_LoanPaymentMade(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        loanId: { _in: $loanIds }
      }
      order_by: { blockTimestamp: desc }
      limit: $limit
    ) {
      id
      loanId
      blockTimestamp
      paymentAmount
    }
    extensions: Loans_LoanExtended(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        borrower: { _eq: $borrower }
      }
      order_by: { blockTimestamp: desc }
      limit: $limit
    ) {
      id
      loanId
      blockTimestamp
      extensionDuration
    }
    repaid: Loans_LoanUnlocked(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        borrower: { _eq: $borrower }
      }
      order_by: { blockTimestamp: desc }
      limit: $limit
    ) {
      id
      loanId
      blockTimestamp
    }
    collateralWithdrawn: Loans_CollateralWithdrawn(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        borrower: { _eq: $borrower }
      }
      order_by: { blockTimestamp: desc }
      limit: $limit
    ) {
      id
      loanId
      blockTimestamp
      collateralAmount
    }
    defaulted: Loans_LoanDefaulted(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        borrower: { _eq: $borrower }
      }
      order_by: { blockTimestamp: desc }
      limit: $limit
    ) {
      id
      loanId
      blockTimestamp
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

/*
 * One account's pool history. `$users` is the account plus any accounts that
 * were transferred into it (transferAccount moves every deposit entry and
 * claimed total to the recipient, but the indexer files the earlier events
 * under the sender); see accountLineage.
 */

/* `expiresAt` is the lock entry's unlock time — the contract merges deposits
 * that share token, unlock time and lock duration into one entry. */
export const ACCOUNT_DEPOSITS = gql`
  query AccountDeposits(
    $chainId: Int!
    $srcAddress: String!
    $users: [String!]!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_Deposited(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        user: { _in: $users }
      }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      user
      blockTimestamp
      token
      tokenAmount
      stableTokenValue
      expiresAt
      lockDuration
    }
  }
`

/* `earningsAmount` is what was reinvested, after the earnings fee. */
export const ACCOUNT_COMPOUNDS = gql`
  query AccountCompounds(
    $chainId: Int!
    $srcAddress: String!
    $users: [String!]!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_EarningsCompounded(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        user: { _in: $users }
      }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      user
      blockTimestamp
      earningsAmount
      unlockTime
    }
  }
`

export const ACCOUNT_WITHDRAWAL_REQUESTS = gql`
  query AccountWithdrawalRequests(
    $chainId: Int!
    $srcAddress: String!
    $users: [String!]!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_WithdrawalRequested(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        user: { _in: $users }
      }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      user
      blockTimestamp
      requestId
      amount
    }
  }
`

export const ACCOUNT_WITHDRAWAL_CLAIMS = gql`
  query AccountWithdrawalClaims(
    $chainId: Int!
    $srcAddress: String!
    $users: [String!]!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_WithdrawalClaimed(
      where: {
        chainId: { _eq: $chainId }
        srcAddress: { _eq: $srcAddress }
        user: { _in: $users }
      }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      user
      blockTimestamp
      requestId
    }
  }
`

/* Every whole-account transfer in the pool — rare, so read in full. */
export const ACCOUNT_TRANSFERS = gql`
  query AccountTransfers(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_AccountTransferred(
      where: { chainId: { _eq: $chainId }, srcAddress: { _eq: $srcAddress } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      from
      to
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

/*
 * Withdrawal requests burn the withdrawn shares at request time (the payout
 * follows when the queue is funded). Every pool version emits these;
 * LiquidityPool_Withdrawn above comes from no deployed version, so the share
 * history needs both to add up.
 */
export const POOL_WITHDRAWAL_REQUESTS = gql`
  query PoolWithdrawalRequests(
    $chainId: Int!
    $srcAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    LiquidityPool_WithdrawalRequested(
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
