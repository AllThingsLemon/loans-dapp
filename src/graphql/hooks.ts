'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { loansAddress, useReadLoansLiquidityPool } from '@/src/generated'
import { breakDownPayments, compareEventIds } from '@/src/utils/loanHistory'
import { getGraphQLClient, getGraphQLEndpoint, requestAll } from './client'
import {
  EARNINGS_PULLED_AT,
  LOAN_EXTENDED,
  LOAN_INITIATED,
  LOAN_PAYMENTS
} from './queries'
import type {
  EarningsPulledResponse,
  EarningsPulledRow,
  LoanExtendedResponse,
  LoanInitiatedResponse,
  LoanPaymentsResponse
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
 * The pool's last EarningsPulled at or before `at` (unix seconds): its
 * newAccumulatedPerInterestShare is the accumulator's value at that
 * moment. `null` when no pull precedes `at` — the window opens before the
 * first pull, so the accumulator then was 0.
 *
 * `at` is floored to the minute so a caller computing it from Date.now()
 * does not mint a new query key on every render.
 *
 * PENDING INDEXER WORK: `LiquidityPool_EarningsPulled` is indexed but not yet
 * tracked in Hasura; until it is, this query errors and callers must fall
 * back.
 */
export function useEarningsPulledAt(at: number | undefined) {
  const { data: pool } = useReadLoansLiquidityPool()
  const { chainId, srcAddress, enabled } = useIndexerScope(pool)
  const atMinute = at === undefined ? undefined : Math.floor(at / 60) * 60
  return useQuery({
    queryKey: ['indexer', chainId, srcAddress, 'earningsPulledAt', atMinute],
    enabled: enabled && atMinute !== undefined,
    staleTime: STALE_TIME,
    retry: 1,
    queryFn: async (): Promise<EarningsPulledRow | null> => {
      const response = await getGraphQLClient(
        chainId
      ).request<EarningsPulledResponse>(EARNINGS_PULLED_AT, {
        chainId,
        srcAddress,
        at: atMinute
      })
      // Newest first by timestamp; same-second pulls are ordered by id.
      const [latest] = response.LiquidityPool_EarningsPulled.sort((a, b) =>
        compareEventIds(b.id, a.id)
      )
      return latest ?? null
    }
  })
}
