import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

export interface Loan {
  id: string
  amount: number
  interestRate: number
  term: number
  status: 'active' | 'paid' | 'defaulted'
  startDate: Date
  dueDate: Date
  remainingBalance: number
  totalPaid: number
  lender?: string
  borrower: string
  collateral?: string
}

export interface LoanRequest {
  amount: number
  term: number
  interestRate: number
  collateral?: string
}

export const useLoans = () => {
  const { address } = useAccount()
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      amount: 1000,
      interestRate: 5.5,
      term: 12,
      status: 'active',
      startDate: new Date('2024-01-15'),
      dueDate: new Date('2025-01-15'),
      remainingBalance: 850,
      totalPaid: 150,
      lender: '0x1234...5678',
      borrower: address || '0x0000...0000',
      collateral: 'LEMX'
    },
    {
      id: '2',
      amount: 500,
      interestRate: 7.2,
      term: 6,
      status: 'paid',
      startDate: new Date('2023-06-01'),
      dueDate: new Date('2023-12-01'),
      remainingBalance: 0,
      totalPaid: 500,
      lender: '0x8765...4321',
      borrower: address || '0x0000...0000'
    }
  ])

  const [isLoading, setIsLoading] = useState(false)

  const createLoan = useCallback(async (loanRequest: LoanRequest) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newLoan: Loan = {
        id: Date.now().toString(),
        amount: loanRequest.amount,
        interestRate: loanRequest.interestRate,
        term: loanRequest.term,
        status: 'active',
        startDate: new Date(),
        dueDate: new Date(Date.now() + loanRequest.term * 30 * 24 * 60 * 60 * 1000),
        remainingBalance: loanRequest.amount,
        totalPaid: 0,
        borrower: address || '0x0000...0000',
        collateral: loanRequest.collateral
      }
      
      setLoans(prev => [...prev, newLoan])
      return newLoan
    } catch (error) {
      console.error('Error creating loan:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [address])

  const payLoan = useCallback(async (loanId: string, amount: number) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLoans(prev => prev.map(loan => {
        if (loan.id === loanId) {
          const newRemainingBalance = Math.max(0, loan.remainingBalance - amount)
          const newTotalPaid = loan.totalPaid + amount
          const newStatus = newRemainingBalance === 0 ? 'paid' : loan.status
          
          return {
            ...loan,
            remainingBalance: newRemainingBalance,
            totalPaid: newTotalPaid,
            status: newStatus
          }
        }
        return loan
      }))
    } catch (error) {
      console.error('Error paying loan:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getActiveLoans = useCallback(() => {
    return loans.filter(loan => loan.status === 'active')
  }, [loans])

  const getLoanHistory = useCallback(() => {
    return loans.filter(loan => loan.status === 'paid' || loan.status === 'defaulted')
  }, [loans])

  const getLoanById = useCallback((id: string) => {
    return loans.find(loan => loan.id === id)
  }, [loans])

  return {
    loans,
    activeLoans: getActiveLoans(),
    loanHistory: getLoanHistory(),
    isLoading,
    createLoan,
    payLoan,
    getLoanById
  }
} 