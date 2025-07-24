'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/Select'
import { useLoans } from '@/src/hooks/useLoans'
import { useContractDecimals } from '@/src/hooks/useContractDecimals'
import {
  formatAmountWithSymbol,
  formatPercentage,
  formatWithPrecision,
  truncateAddress
} from '@/src/utils/format'
import {
  parseTokenAmount,
  formatPercentage as formatContractPercentage
} from '@/src/utils/decimals'
import { useToast } from '@/src/hooks/use-toast'
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react'

export function PayLoan() {
  const { activeLoans, payLoan, isLoading } = useLoans()
  const { tokenConfig } = useContractDecimals()
  const { toast } = useToast()
  const [selectedLoanId, setSelectedLoanId] = useState<`0x${string}` | ''>('')
  const [paymentAmount, setPaymentAmount] = useState('')

  const selectedLoan = activeLoans.find((loan) => loan.id === selectedLoanId)

  const handlePayment = async () => {
    if (
      !selectedLoanId ||
      !paymentAmount ||
      parseFloat(paymentAmount) <= 0 ||
      !tokenConfig?.loanToken.decimals
    ) {
      toast({
        title: 'Invalid Payment',
        description: 'Please select a loan and enter a valid payment amount',
        variant: 'destructive'
      })
      return
    }

    const paymentWei = parseTokenAmount(paymentAmount, tokenConfig.loanToken.decimals)

    if (selectedLoan && paymentWei > selectedLoan.remainingBalance) {
      toast({
        title: 'Payment Exceeds Balance',
        description: 'Payment amount cannot exceed the remaining balance',
        variant: 'destructive'
      })
      return
    }

    try {
      await payLoan(selectedLoanId as `0x${string}`, paymentWei)
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully!'
      })
      setPaymentAmount('')
      setSelectedLoanId('')
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      })
    }
  }

  if (activeLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Make Payment
          </CardTitle>
          <CardDescription>Pay towards your active loans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <CreditCard className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <h3 className='text-lg font-medium text-muted-foreground mb-2'>
              No Active Loans
            </h3>
            <p className='text-sm text-muted-foreground'>
              You don&apos;t have any active loans to make payments on.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CreditCard className='h-5 w-5' />
          Make Payment
        </CardTitle>
        <CardDescription>
          Select a loan and enter the payment amount
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='loan-select'>Select Loan</Label>
          <Select
            value={selectedLoanId}
            onValueChange={(value) => setSelectedLoanId(value as `0x${string}`)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Choose a loan to pay' />
            </SelectTrigger>
            <SelectContent>
              {activeLoans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>
                  Loan #{truncateAddress(loan.id)} -{' '}
                  {formatAmountWithSymbol(loan.remainingBalance)} remaining
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLoan && (
          <div className='p-4 bg-muted rounded-lg space-y-2'>
            <h4 className='font-medium'>Loan Details</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>Original Amount:</span>
                <p className='font-medium'>
                  {formatAmountWithSymbol(selectedLoan.loanAmount)}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>Interest Rate:</span>
                <p className='font-medium'>
                  {decimals
                    ? formatContractPercentage(
                        selectedLoan.interestApr,
                        tokenConfig.interestRateDecimals
                      ) + '%'
                    : '...'}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>Total Paid:</span>
                <p className='font-medium text-green-600'>
                  {formatAmountWithSymbol(selectedLoan.paidAmount)}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>
                  Remaining Balance:
                </span>
                <p className='font-medium text-orange-600'>
                  {formatAmountWithSymbol(selectedLoan.remainingBalance)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='payment-amount'>
            Payment Amount ({tokenConfig?.loanToken.symbol || 'Token'})
          </Label>
          <div className='relative'>
            <DollarSign className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
            <Input
              id='payment-amount'
              type='number'
              placeholder='0.00'
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className='pl-10'
            />
          </div>
          {selectedLoan && (
            <p className='text-sm text-muted-foreground'>
              Maximum payment:{' '}
              {formatAmountWithSymbol(selectedLoan.remainingBalance)}
            </p>
          )}
        </div>

        {selectedLoan &&
          paymentAmount &&
          tokenConfig?.loanToken.decimals &&
          parseTokenAmount(paymentAmount, tokenConfig.loanToken.decimals) >
            selectedLoan.remainingBalance && (
            <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <AlertCircle className='h-4 w-4 text-red-600' />
              <span className='text-sm text-red-600'>
                Payment amount exceeds remaining balance
              </span>
            </div>
          )}

        <Button
          onClick={handlePayment}
          disabled={
            isLoading ||
            !selectedLoanId ||
            !paymentAmount ||
            !tokenConfig?.loanToken.decimals ||
            (selectedLoan &&
              parseTokenAmount(paymentAmount, tokenConfig.loanToken.decimals) >
                selectedLoan.remainingBalance)
          }
          className='w-full'
        >
          {isLoading ? 'Processing Payment...' : 'Confirm Payment'}
        </Button>
      </CardContent>
    </Card>
  )
}
