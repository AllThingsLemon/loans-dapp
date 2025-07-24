import { useCallback, useMemo } from 'react'
import type { Loan } from '../useLoans'
import { LOAN_STATUS } from '@/src/constants'

interface PaymentValidation {
  isValid: boolean
  error?: string
}

export const useLoanPayment = (loan: Loan | undefined, loanTokenDecimals: number = 18) => {
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
  const parsePaymentAmount = useCallback((paymentString: string): bigint => {
    if (!paymentString || isNaN(parseFloat(paymentString))) return 0n
    const multiplier = 10 ** loanTokenDecimals
    return BigInt(Math.floor(parseFloat(paymentString) * multiplier))
  }, [loanTokenDecimals])

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

  // Get recommended payment amount (minimum cycle payment)
  const recommendedPayment = useMemo(() => {
    return loan?.paymentAmount ?? 0n
  }, [loan?.paymentAmount])

  // Calculate payment progress as percentage
  const paymentProgress = useMemo(() => {
    if (!loan || loan.loanAmount + loan.interestAmount === 0n) return 0

    const totalOwed = loan.loanAmount + loan.interestAmount
    const paid = totalOwed - loan.remainingBalance
    return Number((paid * 100n) / totalOwed)
  }, [loan])

  // Utility functions for loan calculations
  const getTimeUntilDue = useCallback((loanData: Loan) => {
    // Only calculate time until due for loans that require payments
    if (loanData.status !== LOAN_STATUS.ACTIVE) {
      return null
    }

    const secondsRemaining = Number(loanData.timeToDefault)
    const daysRemaining = Math.floor(secondsRemaining / (24 * 60 * 60))

    if (daysRemaining >= 1) {
      return { value: daysRemaining, unit: 'days' as const }
    } else {
      return { value: secondsRemaining, unit: 'seconds' as const }
    }
  }, [])

  const getPaymentProgress = useCallback((loanData: Loan) => {
    const totalOwed = loanData.loanAmount + loanData.interestAmount
    const paid = loanData.paidAmount
    return totalOwed > 0n ? Number((paid * 100n) / totalOwed) : 0
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
    recommendedPayment,
    parsePaymentAmount,
    validatePayment,
    isValidAmount,
    paymentProgress,
    getTimeUntilDue,
    getPaymentProgress,
    // New status-aware properties
    isPaymentRequired,
    isCollateralWithdrawable,
    getPaymentStatus
  }
}
