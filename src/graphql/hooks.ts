'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { loansAddress } from '@/src/generated'
import { breakDownPayments, compareEventIds } from '@/src/utils/loanHistory'
import type { ShareChange } from '@/src/utils/poolHistory'
import { getGraphQLClient, getGraphQLEndpoint, requestAll } from './client'
import {
  EARNINGS_PULLED,
  LOAN_EXTENDED,
  LOAN_INITIATED,
  LOAN_PAYMENTS,
  POOL_BOOST_EXPIRIES,
  POOL_COMPOUNDS,
  POOL_DEPOSITS,
  POOL_WITHDRAWALS
} from './queries'
import type {
  EarningsPulledResponse,
  LoanExtendedResponse,
  BoostExpiriesResponse,
  LoanInitiatedResponse,
  LoanPaymentsResponse,
  PoolCompoundsResponse,
  PoolDepositsResponse,
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
export function useEarningsPulled(pool: string | undefined) {
  const { chainId, srcAddress, enabled } = useIndexerScope(pool)
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'earningsPulled'],
    enabled,
    staleTime: STALE_TIME,
    retry: 1,
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
 * `pool` is the LiquidityPool address (Loans.liquidityPool()).
 */
export function usePoolShareChanges(pool: string | undefined) {
  const { chainId, srcAddress, enabled } = useIndexerScope(pool)
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'poolShareChanges'],
    enabled,
    staleTime: STALE_TIME,
    retry: 1,
    queryFn: async (): Promise<ShareChange[]> => {
      const vars = { chainId, srcAddress }
      const [deposits, compounds, withdrawals, expiries] = await Promise.all([
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
        ...withdrawals.map((e) => ({
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
