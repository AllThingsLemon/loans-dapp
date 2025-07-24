import { useMemo, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import {
  useReadLoansGetAccountLoanIds,
  useReadLoansLoans,
  useReadLoansLoanStatus,
  useReadLoansLoanPayment,
  useReadLoansTranspiredCycles,
  useReadLoansTotalNumberOfPayments,
  useReadLoansRemainingCycles,
  useReadLoansFullCyclesAhead,
  useReadLoansTimeToDefault,
  useReadLoansElapsedTimeInCycle
} from '@/src/generated'
import { useLoanConfig, LoanConfiguration } from './useLoanConfig'
import { loanIdsQueryOptions } from '../query/loanQueries'
import type { Loan } from '../useLoans'
import { LOAN_STATUS, LIMITS } from '@/src/constants'
import { type LoanStructResponse, parseLoanStruct } from '@/src/types/contracts'

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
  const remainingBalance = totalOwed - loan.paidAmount
  const currentTime = BigInt(Math.floor(Date.now() / 1000))
  const dueTimestamp = timeToDefault ? currentTime + timeToDefault : currentTime

  return {
    id: loanId,
    account: loan.account,
    createdAt: loan.createdAt,
    loanAmount: loan.loanAmount,
    duration: loan.duration,
    interestAmount: loan.interestAmount,
    interestApr: loan.interestApr,
    paidAmount: loan.paidAmount,
    ltv: loan.ltv,
    originationFee: loan.originationFee,
    collateralAmount: loan.collateralAmount,
    collateralWithdrawn: loan.collateralWithdrawn,

    // Contract-derived values with defaults
    status: status ?? LOAN_STATUS.PENDING,
    paymentAmount: paymentAmount ?? 0n,
    transpiredCycles: transpiredCycles ?? 0n,
    totalCycles: totalCycles ?? 0n,
    remainingCycles: remainingCycles ?? 0n,
    cyclesAhead: cyclesAhead ?? 0n,
    timeToDefault: timeToDefault ?? 0n,
    elapsedTimeInCycle: elapsedTimeInCycle ?? 0n,

    // Computed helper properties (using contract data as source of truth)
    remainingBalance,
    dueTimestamp
  }
}

// Hook for fetching individual loan data
const useLoanData = (
  loanId: `0x${string}` | undefined,
  enabled: boolean,
  loanConfig: LoanConfiguration | undefined
) => {
  const {
    data: loanInfo,
    isLoading: loadingInfo,
    error: errorInfo,
    refetch: refetchInfo
  } = useReadLoansLoans({
    args: loanId ? [loanId] : undefined
  })

  const {
    data: status,
    isLoading: loadingStatus,
    error: errorStatus,
    refetch: refetchStatus
  } = useReadLoansLoanStatus({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: paymentAmount,
    isLoading: loadingPayment,
    error: errorPayment,
    refetch: refetchPayment
  } = useReadLoansLoanPayment({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: transpiredCycles,
    isLoading: loadingTranspired,
    error: errorTranspired,
    refetch: refetchTranspired
  } = useReadLoansTranspiredCycles({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: totalCycles,
    isLoading: loadingTotal,
    error: errorTotal,
    refetch: refetchTotal
  } = useReadLoansTotalNumberOfPayments({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: remainingCycles,
    isLoading: loadingRemaining,
    error: errorRemaining,
    refetch: refetchRemaining
  } = useReadLoansRemainingCycles({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: cyclesAhead,
    isLoading: loadingAhead,
    error: errorAhead,
    refetch: refetchAhead
  } = useReadLoansFullCyclesAhead({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: timeToDefault,
    isLoading: loadingTime,
    error: errorTime,
    refetch: refetchTime
  } = useReadLoansTimeToDefault({
    args: loanId && enabled ? [loanId] : undefined
  })

  const {
    data: elapsedTimeInCycle,
    isLoading: loadingElapsed,
    error: errorElapsed,
    refetch: refetchElapsed
  } = useReadLoansElapsedTimeInCycle({
    args: loanId && enabled ? [loanId] : undefined
  })

  const isLoading =
    loadingInfo ||
    loadingStatus ||
    loadingPayment ||
    loadingTranspired ||
    loadingTotal ||
    loadingRemaining ||
    loadingAhead ||
    loadingTime ||
    loadingElapsed

  const error =
    errorInfo ||
    errorStatus ||
    errorPayment ||
    errorTranspired ||
    errorTotal ||
    errorRemaining ||
    errorAhead ||
    errorTime ||
    errorElapsed

  const loan = useMemo(() => {
    if (!loanId || !enabled || !loanInfo) return null


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
  }, [
    loanId,
    enabled,
    loanInfo,
    status,
    paymentAmount,
    transpiredCycles,
    totalCycles,
    remainingCycles,
    cyclesAhead,
    timeToDefault,
    elapsedTimeInCycle,
    isLoading,
    loanConfig
  ])

  // Combined refetch function for all loan data
  const refetch = useCallback(async () => {
    if (!loanId || !enabled) return
    
    await Promise.all([
      refetchInfo(),
      refetchStatus(),
      refetchPayment(),
      refetchTranspired(),
      refetchTotal(),
      refetchRemaining(),
      refetchAhead(),
      refetchTime(),
      refetchElapsed()
    ])
  }, [
    loanId,
    enabled,
    refetchInfo,
    refetchStatus,
    refetchPayment,
    refetchTranspired,
    refetchTotal,
    refetchRemaining,
    refetchAhead,
    refetchTime,
    refetchElapsed
  ])

  return { loan, isLoading, error, refetch }
}

export const useUserLoans = () => {
  const { address } = useAccount()
  const { loanConfig } = useLoanConfig()

  // Get user's loan IDs with React Query caching
  const {
    data: loanIds,
    isLoading: loadingIds,
    error: idsError,
    refetch: refetchLoanIds
  } = useReadLoansGetAccountLoanIds({
    args: address ? [address] : undefined
  })

  // Create a fixed number of hooks to avoid conditional hook calls
  const loanHooks = Array.from({ length: LIMITS.MAX_LOANS }, (_, index) => {
    const loanId = loanIds?.[index]
    const enabled = !!loanId && index < (loanIds?.length || 0)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLoanData(loanId, enabled, loanConfig)
  })

  // Extract loans data
  const loans = useMemo(() => {
    return loanHooks
      .slice(0, loanIds?.length || 0)
      .map((hook) => hook.loan)
      .filter((loan): loan is Loan => loan !== null)
  }, [loanHooks, loanIds?.length])

  // Aggregate loading and error states
  const isLoading = loadingIds || loanHooks.some((hook) => hook.isLoading)
  const error = idsError || loanHooks.find((hook) => hook.error)?.error

  // Filter loans by status
  const activeLoans = useMemo(() => {
    return loans.filter((loan) => loan.status === LOAN_STATUS.ACTIVE)
  }, [loans])

  const loanHistory = useMemo(() => {
    return loans.filter((loan) => loan.status !== LOAN_STATUS.PENDING)
  }, [loans])

  const getLoanById = useMemo(() => {
    return (id: `0x${string}`) => loans.find((loan) => loan.id === id)
  }, [loans])

  // Combined refetch function for all loan data
  const refetch = useCallback(async () => {
    // First refetch loan IDs to catch new loans
    await refetchLoanIds()
    
    // Then refetch all individual loan data
    const refetchPromises = loanHooks
      .slice(0, loanIds?.length || 0)
      .map((hook) => hook.refetch())
    
    await Promise.all(refetchPromises)
  }, [refetchLoanIds, loanHooks, loanIds?.length])

  return {
    loans,
    activeLoans,
    loanHistory,
    isLoading,
    error,
    getLoanById,
    refetch
  }
}
