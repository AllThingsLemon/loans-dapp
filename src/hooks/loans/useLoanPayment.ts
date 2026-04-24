import { useCallback, useMemo } from 'react'
import type { Loan } from '../useLoans'
import { LOAN_STATUS } from '@/src/constants'

// Constants for percentage calculations with BigInt
const PERCENTAGE_DECIMALS = 2 // Support 2 decimal places (e.g., 12.34%)
const PERCENTAGE_SCALE = 10n ** BigInt(PERCENTAGE_DECIMALS + 2) // Scale factor for BigInt math

interface PaymentValidation {
  isValid: boolean
  error?: string
}

export const useLoanPayment = (
  loan: Loan | undefined,
  loanTokenDecimals: number = 18
) => {
  // Status-based flags
  const isPaymentRequired = useMemo(() => {
    return loan?.status === LOAN_STATUS.ACTIVE
  }, [loan?.status])

  const isCollateralWithdrawable = useMemo(() => {
    return loan?.status === LOAN_STATUS.UNLOCKED
  }, [loan?.status])
  // Calculate maximum payment (remaining balance)
  const maxPayment = useMemo(() => {
    return loan?.remainingBalance ?? 0n
  }, [loan?.remainingBalance])

  // Convert payment string to BigInt wei
  const parsePaymentAmount = useCallback(
    (paymentString: string): bigint => {
      if (!paymentString || isNaN(parseFloat(paymentString))) return 0n
      const multiplier = 10 ** loanTokenDecimals
      return BigInt(Math.floor(parseFloat(paymentString) * multiplier))
    },
    [loanTokenDecimals]
  )

  // Validate payment amount
  const validatePayment = useCallback(
    (paymentString: string): PaymentValidation => {
      if (!loan) {
        return { isValid: false, error: 'No loan selected' }
      }

      if (!paymentString || paymentString.trim() === '') {
        return { isValid: false, error: 'Payment amount is required' }
      }

      const numericValue = parseFloat(paymentString)
      if (isNaN(numericValue) || numericValue <= 0) {
        return {
          isValid: false,
          error: 'Payment amount must be greater than 0'
        }
      }

      const paymentWei = parsePaymentAmount(paymentString)
      if (paymentWei > maxPayment) {
        return {
          isValid: false,
          error: 'Payment amount exceeds remaining balance'
        }
      }

      return { isValid: true }
    },
    [loan, maxPayment, parsePaymentAmount]
  )

  // Check if payment amount is valid
  const isValidAmount = useCallback(
    (paymentString: string): boolean => {
      return validatePayment(paymentString).isValid
    },
    [validatePayment]
  )

  // Get minimum payment amount (minimum cycle payment)
  const minimumPayment = useMemo(() => {
    return loan?.paymentAmount ?? 0n
  }, [loan?.paymentAmount])

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

  // Get payment status for UI display
  const getPaymentStatus = useCallback(() => {
    if (!loan) return 'NO_LOAN'
    if (isCollateralWithdrawable) return 'COLLATERAL_READY'
    if (isPaymentRequired) return 'PAYMENT_DUE'
    return 'COMPLETED'
  }, [loan, isCollateralWithdrawable, isPaymentRequired])

  return {
    maxPayment,
    minimumPayment,
    parsePaymentAmount,
    validatePayment,
    isValidAmount,
    isLoanOverdue,
    isLoanInGracePeriod,
    getPaymentProgress,
    // New status-aware properties
    isPaymentRequired,
    isCollateralWithdrawable,
    getPaymentStatus
  }
}
