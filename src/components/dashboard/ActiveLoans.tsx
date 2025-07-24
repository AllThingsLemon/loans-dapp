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
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Loan, useLoans, useLoanPayment } from '@/src/hooks/useLoans'
import { useContractTokenConfiguration } from '@/src/hooks/useContractTokenConfiguration'
import {
  formatAmountWithSymbol,
  formatPercentage,
  formatWithPrecision,
  formatDuration,
  formatTimestamp,
  getLoanStatusLabel,
  getLoanStatusVariant,
  truncateAddress
} from '@/src/utils/format'
import {
  parseTokenAmount,
  formatPercentage as formatContractPercentage,
  formatTokenAmount
} from '@/src/utils/decimals'
import { useToast } from '@/src/hooks/use-toast'
import { LOAN_STATUS } from '@/src/constants'
import {
  CreditCard,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  AlertCircle
} from 'lucide-react'

interface ActiveLoansProps {
  compact?: boolean
}

export function ActiveLoans({ compact = false }: ActiveLoansProps) {
  const { 
    activeLoans, 
    payLoan, 
    pullCollateral,
    isLoading, 
    refetch,
    currentAllowance,
    approveTokenAllowance,
    isTransacting,
    userLoanTokenBalance
  } = useLoans()
  const { tokenConfig } = useContractTokenConfiguration()
  const { getTimeUntilDue, getPaymentProgress, isPaymentRequired, isCollateralWithdrawable, getPaymentStatus } = useLoanPayment(undefined, tokenConfig?.loanToken.decimals)


  const { toast } = useToast()
  const [selectedLoan, setSelectedLoan] = useState<`0x${string}` | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const handleApproval = async () => {
    if (
      !paymentAmount ||
      parseFloat(paymentAmount) <= 0 ||
      !tokenConfig?.loanToken.decimals
    ) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      })
      return
    }

    try {
      const paymentWei = parseTokenAmount(paymentAmount, tokenConfig.loanToken.decimals)

      await approveTokenAllowance(paymentWei)

      toast({
        title: 'Approval Successful',
        description: 'You can now make the payment!'
      })
    } catch (error: any) {
      const isUserRejection =
        error?.message?.includes('User rejected') ||
        error?.message?.includes('User denied') ||
        error?.code === 4001

      if (!isUserRejection) {
        toast({
          title: 'Approval Failed',
          description: `Failed to approve tokens: ${error?.message || 'Unknown error'}`,
          variant: 'destructive'
        })
      }
    }
  }

  const handleWithdrawal = async (loanId: `0x${string}`) => {
    try {
      const result = await pullCollateral(loanId)

      // Only show success if we actually get a successful result
      if (result) {
        // Refresh all loan data
        await refetch()
        
        toast({
          title: 'Withdrawal Successful',
          description: 'Your collateral has been withdrawn successfully!'
        })
      }
    } catch (error: any) {
      // Check if it's a user rejection
      const isUserRejection =
        error?.message?.includes('User rejected') ||
        error?.message?.includes('User denied') ||
        error?.code === 4001

      // Try to extract contract revert reason
      let errorMessage = error?.message || 'Unknown error'
      if (error?.reason) {
        errorMessage = error.reason
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      }

      if (!isUserRejection) {
        toast({
          title: 'Withdrawal Failed',
          description: errorMessage,
          variant: 'destructive'
        })
      }
      // Don't show error toast for user rejections - user knows they cancelled
    }
  }

  const handlePayment = async (loanId: `0x${string}`) => {
    // Find the loan being paid
    const loan = activeLoans.find((l) => l.id === loanId)
    if (!loan) {
      toast({
        title: 'Loan Not Found',
        description: 'Could not find the loan to make payment on',
        variant: 'destructive'
      })
      return
    }

    if (
      !paymentAmount ||
      parseFloat(paymentAmount) <= 0 ||
      !tokenConfig?.loanToken.decimals
    ) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      })
      return
    }

    try {
      // Convert payment amount to wei using loan token decimals from contract
      const paymentWei = parseTokenAmount(paymentAmount, tokenConfig.loanToken.decimals)

      // Check if user has sufficient token balance
      if (userLoanTokenBalance && paymentWei > userLoanTokenBalance) {
        toast({
          title: 'Insufficient Balance',
          description: `You need ${paymentAmount} ${tokenConfig?.loanToken.symbol} but only have ${formatTokenAmount(userLoanTokenBalance, tokenConfig.loanToken.decimals)} ${tokenConfig?.loanToken.symbol}`,
          variant: 'destructive'
        })
        return
      }

      // Check payment amount against loan remaining balance
      if (paymentWei > loan.remainingBalance) {
        toast({
          title: 'Payment Too Large',
          description:
            'Payment amount cannot exceed the remaining loan balance',
          variant: 'destructive'
        })
        return
      }

      const result = await payLoan(loanId, paymentWei)

      // Only show success if we actually get a successful result
      if (result) {
        
        // Refresh all loan data
        await refetch()
        
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully!'
        })

        // Close the dialog and clear state
        setPaymentAmount('')
        setSelectedLoan(null)
        setIsPaymentDialogOpen(false)
      }
    } catch (error: any) {
      // Check if it's a user rejection
      const isUserRejection =
        error?.message?.includes('User rejected') ||
        error?.message?.includes('User denied') ||
        error?.code === 4001

      // Try to extract contract revert reason
      let errorMessage = error?.message || 'Unknown error'
      if (error?.reason) {
        errorMessage = error.reason
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage =
          'Contract validation failed - this may be due to loan state, timing, or other contract rules'
      }

      if (!isUserRejection) {
        toast({
          title: 'Payment Failed',
          description: errorMessage,
          variant: 'destructive'
        })
      }
      // Don't show error toast for user rejections - user knows they cancelled
    }
  }

  if (activeLoans.length === 0) {
    return (
      <div className='text-center py-8'>
        <CreditCard className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
        <h3 className='text-lg font-medium text-muted-foreground mb-2'>
          No Active Loans
        </h3>
        <p className='text-sm text-muted-foreground'>
          You don&apos;t have any active loans at the moment.
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className='space-y-3'>
        {activeLoans.slice(0, 3).map((loan) => (
          <div
            key={loan.id}
            className='flex items-center justify-between p-3 bg-muted rounded-lg'
          >
            <div className='flex items-center gap-3'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <div>
                <p className='font-medium'>
                  {formatAmountWithSymbol(
                    loan.loanAmount,
                    tokenConfig?.loanToken.symbol || 'Token'
                  )}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {tokenConfig
                    ? formatContractPercentage(
                        loan.interestApr,
                        tokenConfig.interestRateDecimals
                      ) + '%'
                    : '...'}{' '}
                  • {formatDuration(loan.duration)}
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className='font-medium'>
                {formatAmountWithSymbol(
                  loan.remainingBalance,
                  tokenConfig?.loanToken.symbol || 'Token'
                )}
              </p>
              <p className='text-sm text-muted-foreground'>remaining</p>
            </div>
          </div>
        ))}
        {activeLoans.length > 3 && (
          <div className='text-center text-sm text-muted-foreground py-2'>
            ... and {activeLoans.length - 3} more active loans
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {activeLoans.map((loan) => {
        const timeUntilDue = getTimeUntilDue(loan)
        const progress = getPaymentProgress(loan)
        const isOverdue = timeUntilDue ? timeUntilDue.value <= 0 : false

        return (
          <Card key={loan.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <CreditCard className='h-5 w-5 text-green-600' />
                  <div>
                    <CardTitle className='text-lg'>
                      Loan #{truncateAddress(loan.id)}
                    </CardTitle>
                    <CardDescription>
                      Protocol Loan • {getLoanStatusLabel(loan.status)}
                    </CardDescription>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant={getLoanStatusVariant(loan.status)}>
                    {getLoanStatusLabel(loan.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Loan Details */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <DollarSign className='h-3 w-3' />
                    Original Amount
                  </p>
                  <p className='font-medium'>
                    {formatAmountWithSymbol(
                      loan.loanAmount,
                      tokenConfig?.loanToken.symbol || 'Token'
                    )}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Percent className='h-3 w-3' />
                    Interest Rate
                  </p>
                  <p className='font-medium'>
                    {tokenConfig
                      ? formatContractPercentage(
                          loan.interestApr,
                          tokenConfig.interestRateDecimals
                        ) + '%'
                      : '...'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    Due Date
                  </p>
                  <p className='font-medium'>
                    {formatTimestamp(loan.dueTimestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {isOverdue ? 'Overdue' : 'Time Until Due'}
                  </p>
                  <p
                    className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}
                  >
                    {timeUntilDue ? `${Math.abs(timeUntilDue.value)} ${timeUntilDue.unit}` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Payment Progress */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Payment Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className='h-2' />
                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                  <span>
                    Paid:{' '}
                    {formatAmountWithSymbol(
                      loan.paidAmount,
                      tokenConfig?.loanToken.symbol || 'Token'
                    )}
                  </span>
                  <span>
                    Remaining:{' '}
                    {formatAmountWithSymbol(
                      loan.remainingBalance,
                      tokenConfig?.loanToken.symbol || 'Token'
                    )}
                  </span>
                </div>
              </div>

              {/* Contract Details */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t'>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>
                    Payment Cycles
                  </p>
                  <p className='text-sm font-medium'>
                    {loan.transpiredCycles.toString()}/
                    {loan.totalCycles.toString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Cycles Ahead</p>
                  <p className='text-sm font-medium'>
                    {loan.cyclesAhead.toString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Collateral</p>
                  <p className='text-sm font-medium'>
                    {formatAmountWithSymbol(loan.collateralAmount, tokenConfig?.nativeToken.symbol || 'Token')}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>LTV</p>
                  <p className='text-sm font-medium'>
                    {tokenConfig
                      ? formatContractPercentage(
                          loan.ltv,
                          tokenConfig.ltvDecimals
                        ) + '%'
                      : '...'}
                  </p>
                </div>
              </div>

              {/* Payment Action */}
              <div className='flex items-center gap-3 pt-2'>
                {loan.status === LOAN_STATUS.UNLOCKED ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleWithdrawal(loan.id)}
                    disabled={isTransacting}
                  >
                    {isTransacting ? 'Processing...' : 'Withdraw Collateral'}
                  </Button>
                ) : (
                  <Dialog
                    open={isPaymentDialogOpen && selectedLoan === loan.id}
                    onOpenChange={(open) => {
                      setIsPaymentDialogOpen(open)
                      if (!open) {
                        setSelectedLoan(null)
                        setPaymentAmount('')
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedLoan(loan.id)
                          setIsPaymentDialogOpen(true)
                        }}
                      >
                        Make Payment
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make Payment</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to pay towards loan #
                        {truncateAddress(loan.id)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='payment-amount'>
                          Payment Amount ({tokenConfig?.loanToken.symbol || 'Token'})
                        </Label>
                        <div className='relative'>
                          <Input
                            id='payment-amount'
                            type='number'
                            placeholder='0.00'
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className='pr-16'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='absolute right-1 top-1 h-6 px-1 text-xs'
                            onClick={() => {
                              if (tokenConfig?.loanToken.decimals) {
                                const maxAmount = formatTokenAmount(
                                  loan.remainingBalance,
                                  tokenConfig.loanToken.decimals
                                )
                                setPaymentAmount(maxAmount)
                              }
                            }}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        <p>
                          Remaining balance:{' '}
                          {formatAmountWithSymbol(
                            loan.remainingBalance,
                            tokenConfig?.loanToken.symbol || 'Token'
                          )}
                        </p>
                        <p>
                          Payment amount:{' '}
                          {formatAmountWithSymbol(
                            loan.paymentAmount,
                            tokenConfig?.loanToken.symbol || 'Token'
                          )}
                        </p>
                      </div>

                      <div className='flex gap-2'>
                        {(() => {
                          // Check if approval is needed
                          const paymentWei =
                            paymentAmount && tokenConfig?.loanToken.decimals
                              ? parseTokenAmount(
                                  paymentAmount,
                                  tokenConfig.loanToken.decimals
                                )
                              : 0n
                          const needsApproval =
                            !currentAllowance || currentAllowance < paymentWei

                          if (
                            needsApproval &&
                            paymentAmount &&
                            paymentWei > 0n
                          ) {
                            return (
                              <Button
                                onClick={handleApproval}
                                disabled={isTransacting || !paymentAmount}
                                className='flex-1'
                              >
                                {isTransacting
                                  ? 'Approving...'
                                  : 'Approve Tokens'}
                              </Button>
                            )
                          } else {
                            return (
                              <Button
                                onClick={() => handlePayment(loan.id)}
                                disabled={
                                  isLoading ||
                                  isTransacting ||
                                  !paymentAmount ||
                                  needsApproval
                                }
                                className='flex-1'
                              >
                                {isLoading || isTransacting
                                  ? 'Processing...'
                                  : 'Confirm Payment'}
                              </Button>
                            )
                          }
                        })()}
                        <Button
                          variant='outline'
                          onClick={() => {
                            setPaymentAmount('')
                            setSelectedLoan(null)
                            setIsPaymentDialogOpen(false)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                )}

                {isOverdue && loan.status === LOAN_STATUS.ACTIVE && (
                  <div className='flex items-center gap-2 text-sm text-red-600'>
                    <AlertCircle className='h-4 w-4' />
                    <span>Payment overdue</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
