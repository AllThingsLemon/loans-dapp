'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { loansAddress } from '@/src/generated'
import { breakDownPayments, compareEventIds } from '@/src/utils/loanHistory'
import {
  accountLineage,
  inLineage,
  type AccountHistory,
  type ShareChange
} from '@/src/utils/poolHistory'
import { getGraphQLClient, getGraphQLEndpoint, requestAll } from './client'
import {
  ACCOUNT_COMPOUNDS,
  ACCOUNT_DEPOSITS,
  ACCOUNT_EARNINGS_CLAIMS,
  ACCOUNT_TRANSFERS,
  ACCOUNT_WITHDRAWAL_CLAIMS,
  ACCOUNT_WITHDRAWAL_REQUESTS,
  BORROWER_ACTIVITY,
  EARNINGS_PULLED,
  LOAN_EXTENDED,
  LOAN_INITIATED,
  LOAN_PAYMENTS,
  POOL_BOOST_EXPIRIES,
  POOL_COMPOUNDS,
  POOL_DEPOSITS,
  POOL_WITHDRAWAL_REQUESTS,
  POOL_WITHDRAWALS
} from './queries'
import type {
  AccountCompoundsResponse,
  AccountDepositsResponse,
  AccountEarningsClaimsResponse,
  AccountTransfersResponse,
  AccountWithdrawalClaimsResponse,
  AccountWithdrawalRequestsResponse,
  BorrowerActivityResponse,
  EarningsPulledResponse,
  LoanExtendedResponse,
  BoostExpiriesResponse,
  LoanInitiatedResponse,
  LoanPaymentsResponse,
  PoolCompoundsResponse,
  PoolDepositsResponse,
  PoolWithdrawalRequestsResponse,
  PoolWithdrawalsResponse
} from './types'

/** Indexed history only grows; a minute of staleness is invisible. */
const STALE_TIME = 60_000

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * The indexer scope for a contract on the active chain: disabled when the
 * chain has no indexer endpoint or the contract address is unknown. Works
 * disconnected — useChainId falls back to the default chain.
 */
function useIndexerScope(address: string | undefined) {
  const chainId = useChainId()
  const srcAddress =
    address && address.toLowerCase() !== ZERO_ADDRESS
      ? address.toLowerCase()
      : undefined
  return {
    chainId,
    srcAddress,
    enabled: !!srcAddress && !!getGraphQLEndpoint(chainId)
  }
}

/**
 * Refresh settings for indexed history that backs a live figure, so the
 * figure re-reads it instead of keeping its first reading (or failure) until
 * the page reloads.
 */
export interface IndexerRefresh {
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
}

function useLoansScope() {
  const chainId = useChainId()
  return useIndexerScope(loansAddress[chainId as keyof typeof loansAddress])
}

/** Every LoanInitiated event of the active chain's Loans contract. */
export function useLoanInitiations() {
  const { chainId, srcAddress, enabled } = useLoansScope()
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'loanInitiated'],
    enabled,
    staleTime: STALE_TIME,
    retry: 1,
    queryFn: () =>
      requestAll(
        chainId,
        LOAN_INITIATED,
        { chainId, srcAddress },
        (r: LoanInitiatedResponse) => r.Loans_LoanInitiated
      )
  })
}

/** Every LoanPaymentMade event of the active chain's Loans contract. */
export function useLoanPayments() {
  const { chainId, srcAddress, enabled } = useLoansScope()
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'loanPayments'],
    enabled,
    staleTime: STALE_TIME,
    retry: 1,
    queryFn: () =>
      requestAll(
        chainId,
        LOAN_PAYMENTS,
        { chainId, srcAddress },
        (r: LoanPaymentsResponse) => r.Loans_LoanPaymentMade
      )
  })
}

/** Every LoanExtended event of the active chain's Loans contract. */
export function useLoanExtensions() {
  const { chainId, srcAddress, enabled } = useLoansScope()
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'loanExtended'],
    enabled,
    staleTime: STALE_TIME,
    retry: 1,
    queryFn: () =>
      requestAll(
        chainId,
        LOAN_EXTENDED,
        { chainId, srcAddress },
        (r: LoanExtendedResponse) => r.Loans_LoanExtended
      )
  })
}

/**
 * Every loan payment split into principal and interest, oldest first (see
 * breakDownPayments). Sum `interestPaid` over a window with
 * interestPaidSince for the interest borrowers paid in it.
 */
export function useLoanPaymentBreakdown() {
  const initiations = useLoanInitiations()
  const payments = useLoanPayments()
  const data = useMemo(
    () =>
      initiations.data && payments.data
        ? breakDownPayments(initiations.data, payments.data)
        : undefined,
    [initiations.data, payments.data]
  )
  return {
    data,
    isLoading: initiations.isLoading || payments.isLoading,
    error: initiations.error ?? payments.error ?? null
  }
}

/**
 * Every pullEarnings() on the pool, oldest first: each time interest moved
 * from Loans into the pool and was credited to depositors.
 *
 * `pool` is the LiquidityPool address (Loans.liquidityPool()).
 */
export function useEarningsPulled(
  pool: string | undefined,
  refresh: IndexerRefresh = {}
) {
  const { chainId, srcAddress, enabled } = useIndexerScope(pool)
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'earningsPulled'],
    enabled,
    staleTime: STALE_TIME,
    retry: 2,
    ...refresh,
    queryFn: async () =>
      (
        await requestAll(
          chainId,
          EARNINGS_PULLED,
          { chainId, srcAddress },
          (r: EarningsPulledResponse) => r.LiquidityPool_EarningsPulled
        )
      ).sort((a, b) => compareEventIds(a.id, b.id))
  })
}

/**
 * Every change to the pool's share totals, oldest first: deposits and
 * compounded earnings add, withdrawals and expiring boosts subtract. Summed
 * (sumShareChanges), they should equal the pool's live totals.
 *
 * Withdrawals burn their shares when requested (WithdrawalRequested); the
 * payout follows when the queue funds it. LiquidityPool_Withdrawn is kept for
 * completeness, but no deployed pool version emits it — counting only it, the
 * first withdrawal request would leave the totals unmatched and Performance
 * blank.
 *
 * `pool` is the LiquidityPool address (Loans.liquidityPool()).
 */
export function usePoolShareChanges(
  pool: string | undefined,
  refresh: IndexerRefresh = {}
) {
  const { chainId, srcAddress, enabled } = useIndexerScope(pool)
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'poolShareChanges'],
    enabled,
    staleTime: STALE_TIME,
    retry: 2,
    ...refresh,
    queryFn: async (): Promise<ShareChange[]> => {
      const vars = { chainId, srcAddress }
      const [deposits, compounds, withdrawals, requests, expiries] =
        await Promise.all([
          requestAll(
            chainId,
            POOL_DEPOSITS,
            vars,
            (r: PoolDepositsResponse) => r.LiquidityPool_Deposited
          ),
          requestAll(
            chainId,
            POOL_COMPOUNDS,
            vars,
            (r: PoolCompoundsResponse) => r.LiquidityPool_EarningsCompounded
          ),
          requestAll(
            chainId,
            POOL_WITHDRAWALS,
            vars,
            (r: PoolWithdrawalsResponse) => r.LiquidityPool_Withdrawn
          ),
          requestAll(
            chainId,
            POOL_WITHDRAWAL_REQUESTS,
            vars,
            (r: PoolWithdrawalRequestsResponse) =>
              r.LiquidityPool_WithdrawalRequested
          ),
          requestAll(
            chainId,
            POOL_BOOST_EXPIRIES,
            vars,
            (r: BoostExpiriesResponse) => r.LiquidityPool_BoostExpired
          )
        ])
      const changes: ShareChange[] = [
        ...[...deposits, ...compounds].map((e) => ({
          id: e.id,
          timestamp: e.blockTimestamp,
          liquidity: BigInt(e.liquidityShares),
          interest: BigInt(e.interestShares)
        })),
        ...[...withdrawals, ...requests].map((e) => ({
          id: e.id,
          timestamp: e.blockTimestamp,
          liquidity: -BigInt(e.liquiditySharesBurned),
          interest: -BigInt(e.interestSharesBurned)
        })),
        ...expiries.map((e) => ({
          id: e.id,
          timestamp: e.blockTimestamp,
          liquidity: 0n,
          interest: -BigInt(e.boostShares)
        }))
      ]
      return changes.sort((a, b) => compareEventIds(a.id, b.id))
    }
  })
}

/**
 * One account's pool history: its deposits, compounds, earnings claims, and
 * withdrawal requests and payouts, including those of accounts transferred
 * into it before the transfer (see accountLineage). Disabled without an
 * account, or on a chain with no indexer.
 *
 * `pool` is the LiquidityPool address (Loans.liquidityPool()).
 */
export function usePoolAccountHistory(
  pool: string | undefined,
  user: string | undefined,
  refresh: IndexerRefresh = {}
) {
  const { chainId, srcAddress, enabled } = useIndexerScope(pool)
  const account = user?.toLowerCase()
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'accountHistory', account],
    enabled: enabled && !!account,
    staleTime: STALE_TIME,
    retry: 2,
    ...refresh,
    queryFn: async (): Promise<AccountHistory> => {
      const transfers = await requestAll(
        chainId,
        ACCOUNT_TRANSFERS,
        { chainId, srcAddress },
        (r: AccountTransfersResponse) => r.LiquidityPool_AccountTransferred
      )
      const lineage = accountLineage(transfers, account!)
      const vars = { chainId, srcAddress, users: [...lineage.keys()] }
      const [
        deposits,
        compounds,
        earningsClaims,
        withdrawalRequests,
        withdrawalClaims
      ] = await Promise.all([
        requestAll(
          chainId,
          ACCOUNT_DEPOSITS,
          vars,
          (r: AccountDepositsResponse) => r.LiquidityPool_Deposited
        ),
        requestAll(
          chainId,
          ACCOUNT_COMPOUNDS,
          vars,
          (r: AccountCompoundsResponse) => r.LiquidityPool_EarningsCompounded
        ),
        requestAll(
          chainId,
          ACCOUNT_EARNINGS_CLAIMS,
          vars,
          (r: AccountEarningsClaimsResponse) => r.LiquidityPool_EarningsClaimed
        ),
        requestAll(
          chainId,
          ACCOUNT_WITHDRAWAL_REQUESTS,
          vars,
          (r: AccountWithdrawalRequestsResponse) =>
            r.LiquidityPool_WithdrawalRequested
        ),
        requestAll(
          chainId,
          ACCOUNT_WITHDRAWAL_CLAIMS,
          vars,
          (r: AccountWithdrawalClaimsResponse) =>
            r.LiquidityPool_WithdrawalClaimed
        )
      ])
      return {
        deposits: inLineage(deposits, lineage),
        compounds: inLineage(compounds, lineage),
        earningsClaims: inLineage(earningsClaims, lineage),
        withdrawalRequests: inLineage(withdrawalRequests, lineage),
        withdrawalClaims: inLineage(withdrawalClaims, lineage)
      }
    }
  })
}

/**
 * A borrower's latest loan events — payments on `loanIds`, and extensions,
 * repayments, collateral withdrawals and defaults — `limit` of each kind,
 * newest first. Disabled without a borrower or loans, or on a chain with no
 * indexer.
 */
export function useBorrowerActivity(
  borrower: string | undefined,
  loanIds: readonly string[],
  limit: number
) {
  const { chainId, srcAddress, enabled } = useLoansScope()
  const account = borrower?.toLowerCase()
  const ids = useMemo(
    () => loanIds.map((id) => id.toLowerCase()).sort(),
    [loanIds]
  )
  return useQuery({
    queryKey: [
      'indexer',
      chainId,
      srcAddress,
      'borrowerActivity',
      account,
      ids,
      limit
    ],
    enabled: enabled && !!account && ids.length > 0,
    staleTime: STALE_TIME,
    retry: 2,
    queryFn: () =>
      getGraphQLClient(chainId).request<BorrowerActivityResponse>(
        BORROWER_ACTIVITY,
        { chainId, srcAddress, borrower: account, loanIds: ids, limit }
      )
  })
}
