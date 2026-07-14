import { useMemo, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  readLoansGetAccountLoanIds,
  readLoansLoans,
  readLoansLoanStatus,
  readLoansLoanPayment,
  readLoansTranspiredCycles,
  readLoansTotalNumberOfPayments,
  readLoansRemainingCycles,
  readLoansFullCyclesAhead,
  readLoansTimeToDefault,
  readLoansElapsedTimeInCycle
} from '@/src/generated'
import { useLoanConfig } from './useLoanConfig'
import { queryClient } from '../query/queryClient'
import type { Loan } from '../useLoans'
import { LOAN_STATUS, QUERY_CONFIG } from '@/src/constants'
import { type LoanStructResponse, parseLoanStruct } from '@/src/types/contracts'
import { config } from '@/src/config/wagmi'

export interface UseUserLoansReturn {
  loans: Loan[]
  activeLoans: Loan[]
  loanHistory: Loan[]
  isLoading: boolean
  error: Error | null
  getLoanById: (id: `0x${string}`) => Loan | undefined
  refetch: () => Promise<void>
}

// Helper function to combine loan data using proper parsing
const combineLoanData = (
  loanId: `0x${string}`,
  loanInfo: LoanStructResponse | undefined,
  status: number | undefined,
  paymentAmount: bigint | undefined,
  transpiredCycles: bigint | undefined,
  totalCycles: bigint | undefined,
  remainingCycles: bigint | undefined,
  cyclesAhead: bigint | undefined,
  timeToDefault: bigint | undefined,
  elapsedTimeInCycle: bigint | undefined
): Loan | null => {
  if (!loanInfo) return null

  // Parse the loan struct safely
  const loan = parseLoanStruct(loanInfo)

  // Use contract data for calculations, not manual math
  const totalOwed = loan.loanAmount + loan.interestAmount
  const remainingBalance = loan.paidAmount >= totalOwed ? 0n : totalOwed - loan.paidAmount
  // dueTimestamp is the fixed loan maturity date (createdAt + duration).
  // timeToDefault extends when the borrower is ahead on payments and must NOT
  // be used as the due date — it would show a date beyond loan maturity.
  const dueTimestamp = loan.createdAt + loan.duration

  // Derived totalCycles (deterministic from struct) so non-ACTIVE loans still
  // render a meaningful Cycles Transpired cell — the on-chain getters are only
  // queried for ACTIVE loans, but UNLOCKED loans still appear in activeLoans
  // and need to show 2/2 (or N/N) instead of 0/0.
  const derivedTotalCycles = loan.loanCycleDuration > 0n
    ? loan.duration / loan.loanCycleDuration
    : 0n
  const isActive = status === LOAN_STATUS.ACTIVE
  const resolvedTotalCycles = isActive ? (totalCycles ?? 0n) : derivedTotalCycles
  const resolvedTranspiredCycles = isActive
    ? (transpiredCycles ?? 0n)
    : derivedTotalCycles
  const resolvedRemainingCycles = isActive ? (remainingCycles ?? 0n) : 0n

  return {
    id: loanId,
    account: loan.account,
    createdAt: loan.createdAt,
    loanAmount: loan.loanAmount,
    duration: loan.duration,
    originalDuration: loan.originalDuration,
    interestAmount: loan.interestAmount,
    interestApr: loan.interestApr,
    paidAmount: loan.paidAmount,
    ltv: loan.ltv,
    originationFee: loan.originationFee,
    collateralToken: loan.collateralToken,
    collateralAmount: loan.collateralAmount,
    loanCycleDuration: loan.loanCycleDuration,
    balloonGraceSnapshot: loan.balloonGraceSnapshot,

    // Contract-derived values with defaults
    status: status ?? LOAN_STATUS.ACTIVE,
    paymentAmount: paymentAmount ?? 0n,
    transpiredCycles: resolvedTranspiredCycles,
    totalCycles: resolvedTotalCycles,
    remainingCycles: resolvedRemainingCycles,
    cyclesAhead: cyclesAhead ?? 0n,
    timeToDefault: timeToDefault ?? 0n,
    elapsedTimeInCycle: elapsedTimeInCycle ?? 0n,

    // Computed helper properties (using contract data as source of truth)
    remainingBalance,
    dueTimestamp
  }
}

const LOAN_IDS_PAGE_SIZE = 50n

export const useUserLoans = (): UseUserLoansReturn => {
  const { address } = useAccount()
  // Get ALL of the user's loan IDs, paging through getAccountLoanIds until a
  // short page. A single fixed-limit call would silently hide any loan past
  // the 50th — invisible loans can't be paid and default unnoticed.
  const {
    data: loanIds,
    isLoading: loadingIds,
    error: idsError,
    refetch: refetchLoanIds
  } = useQuery({
    queryKey: ['accountLoanIds', address],
    queryFn: async () => {
      const all: `0x${string}`[] = []
      let offset = 0n
      for (;;) {
        let page: readonly `0x${string}`[]
        try {
          page = await readLoansGetAccountLoanIds(config, {
            args: [address!, offset, LOAN_IDS_PAGE_SIZE]
          })
        } catch (pageError) {
          // The first page failing is a real error; a later page failing
          // (e.g. out-of-range offset when the count is an exact multiple
          // of the page size) means we've read everything.
          if (offset === 0n) throw pageError
          break
        }
        all.push(...page)
        if (BigInt(page.length) < LOAN_IDS_PAGE_SIZE) break
        offset += LOAN_IDS_PAGE_SIZE
      }
      return all
    },
    enabled: !!address && !!config,
    staleTime: QUERY_CONFIG.STALE_TIME,
    gcTime: QUERY_CONFIG.GC_TIME
  })

  // Create queries for each loan's data
  const loanQueries = useQueries({
    queries: (loanIds || []).map((loanId) => ({
      queryKey: ['loan', loanId, 'fullData'],
      queryFn: async () => {
        if (!config) throw new Error('Wagmi config not available')

        // No try/catch here: a fetch failure must reach React Query so it
        // retries and surfaces `error` — swallowing it made the loan silently
        // vanish from the dashboard on any RPC hiccup.
        {
          // First, get basic loan info and status (these should work for all loans)
          const [loanInfo, status] = await Promise.all([
            readLoansLoans(config, { args: [loanId] }),
            readLoansLoanStatus(config, { args: [loanId] })
          ])

          // For active loans (status 3), fetch additional data
          let paymentAmount,
            transpiredCycles,
            totalCycles,
            remainingCycles,
            cyclesAhead,
            timeToDefault,
            elapsedTimeInCycle

          if (status === LOAN_STATUS.ACTIVE) {
            ;[
              paymentAmount,
              transpiredCycles,
              totalCycles,
              remainingCycles,
              cyclesAhead,
              timeToDefault,
              elapsedTimeInCycle
            ] = await Promise.all([
              readLoansLoanPayment(config, { args: [loanId] }),
              readLoansTranspiredCycles(config, { args: [loanId] }),
              readLoansTotalNumberOfPayments(config, { args: [loanId] }),
              readLoansRemainingCycles(config, { args: [loanId] }),
              readLoansFullCyclesAhead(config, { args: [loanId] }),
              readLoansTimeToDefault(config, { args: [loanId] }),
              readLoansElapsedTimeInCycle(config, { args: [loanId] })
            ])
          } else {
            // For non-active loans, these values aren't needed or will be defaults
            paymentAmount = 0n
            transpiredCycles = 0n
            totalCycles = 0n
            remainingCycles = 0n
            cyclesAhead = 0n
            timeToDefault = 0n
            elapsedTimeInCycle = 0n
          }

          return combineLoanData(
            loanId,
            loanInfo,
            status,
            paymentAmount,
            transpiredCycles,
            totalCycles,
            remainingCycles,
            cyclesAhead,
            timeToDefault,
            elapsedTimeInCycle
          )
        }
      },
      enabled: !!config && !!loanId,
      retry: 2,
      staleTime: QUERY_CONFIG.STALE_TIME,
      cacheTime: QUERY_CONFIG.GC_TIME
    }))
  })

  // Extract loans data — filter both null (loan struct missing) and
  // undefined (query errored / still loading).
  const loans = useMemo(() => {
    return loanQueries
      .map((query) => query.data)
      .filter((loan): loan is Loan => loan != null)
  }, [loanQueries])

  // Aggregate loading and error states
  const isLoading = loadingIds || loanQueries.some((query) => query.isLoading)
  const error = idsError || loanQueries.find((query) => query.error)?.error

  // Filter loans by status
  const activeLoans = useMemo(() => {
    return loans.filter(
      (loan) =>
        loan?.status === LOAN_STATUS.ACTIVE ||
        loan?.status === LOAN_STATUS.UNLOCKED
    )
  }, [loans])

  const loanHistory = useMemo(() => {
    return loans.filter(
      (loan) =>
        loan?.status === LOAN_STATUS.COMPLETED ||
        loan?.status === LOAN_STATUS.DEFAULT ||
        loan?.status === LOAN_STATUS.LIQUIDATED
    )
  }, [loans])

  const getLoanById = useMemo(() => {
    return (id: `0x${string}`) => loans.find((loan) => loan.id === id)
  }, [loans])

  // Combined refetch function for all loan data
  const refetch = useCallback(async () => {
    // First refetch loan IDs to catch new loans
    await refetchLoanIds()

    // Then invalidate all loan queries to trigger refetch
    if (loanIds) {
      await Promise.all(
        loanIds.map((loanId) =>
          queryClient.invalidateQueries({
            queryKey: ['loan', loanId, 'fullData']
          })
        )
      )
    }
  }, [refetchLoanIds, loanIds, queryClient])

  return {
    loans,
    activeLoans,
    loanHistory,
    isLoading,
    error: error || null,
    getLoanById,
    refetch
  }
}
