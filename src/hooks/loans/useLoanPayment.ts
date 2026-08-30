import { useCallback } from 'react'
import type { Loan } from '../useLoans'
import { LOAN_STATUS } from '@/src/constants'

// Constants for percentage calculations with BigInt
const PERCENTAGE_DECIMALS = 2 // Support 2 decimal places (e.g., 12.34%)
const PERCENTAGE_SCALE = 10n ** BigInt(PERCENTAGE_DECIMALS + 2) // Scale factor for BigInt math

/**
 * Per-loan display helpers for the payment UI.
 *
 * Deliberately small: this hook once carried a parallel payment-validation
 * layer (validatePayment / isValidAmount / max & minimum payment) that no
 * call site consumed — the payment dialog does its own validation against
 * the live contract state. Only the helpers that are actually rendered
 * survive; each takes the loan as an argument, so the hook holds no state.
 */
export const useLoanPayment = () => {
  // Overdue once the loan is past its end date. The contract still allows
  // payments during the balloonPaymentGraceDuration window, but from the
  // user's perspective the principal payment is late.
  const isLoanOverdue = useCallback((loanData: Loan): boolean => {
    if (loanData.status !== LOAN_STATUS.ACTIVE) {
      return false
    }
    return Date.now() >= Number(loanData.dueTimestamp) * 1000
  }, [])

  // Grace period: every cycle's interest has been credited (real-time elapsed
  // cycles + prepaid cycles cover all configured cycles), so the only thing
  // left is the balloon principal payment.
  //
  // We can't use loanData.remainingCycles for this — on this contract it
  // returns totalCycles − transpiredCycles − 1, i.e. it's purely time-based
  // and ignores prepayments. We also can't use paidAmount >= interestAmount —
  // once any principal is paid, paidAmount dwarfs interestAmount, making the
  // check trivially true even while cycle interest is unpaid.
  const isLoanInGracePeriod = useCallback((loanData: Loan): boolean => {
    if (loanData.status !== LOAN_STATUS.ACTIVE) {
      return false
    }
    return loanData.transpiredCycles + loanData.cyclesAhead >= loanData.totalCycles
  }, [])

  const getPaymentProgress = useCallback((loanData: Loan) => {
    const totalOwed = loanData.loanAmount + loanData.interestAmount
    const paid = loanData.paidAmount

    if (totalOwed === 0n) return 0

    // Calculate percentage with proper precision for BigInt division
    const scaledProgress = (paid * PERCENTAGE_SCALE) / totalOwed

    // Convert back to percentage with decimals
    return Number(scaledProgress) / 100
  }, [])

  return {
    isLoanOverdue,
    isLoanInGracePeriod,
    getPaymentProgress
  }
}
