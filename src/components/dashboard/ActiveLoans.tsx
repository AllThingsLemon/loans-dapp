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
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Loan, useLoans, useLoanPayment } from '@/src/hooks/useLoans'
import { CountdownTimer } from '@/src/components/ui/countdown-timer'
import { useContractTokenConfiguration } from '@/src/hooks/useContractTokenConfiguration'
import {
  formatAmountWithSymbol,
  formatDuration,
  formatTimestamp,
  getLoanStatusLabel,
  getLoanStatusVariant,
  truncateAddress
} from '@/src/utils/format'
import {
  parseTokenAmount,
  formatPercentage,
  formatTokenAmount
} from '@/src/utils/decimals'
import { useToast } from '@/src/hooks/use-toast'
import { LOAN_STATUS } from '@/src/constants'
import {
  handleContractError,
  type ContractError
} from '@/src/utils/errorHandling'
import {
  CreditCard,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  AlertCircle
} from 'lucide-react'
import { LoanCompletionModal } from '../common/LoanCompletionModal'

interface ActiveLoansProps {
  compact?: boolean
}

export function ActiveLoans({ compact = false }: ActiveLoansProps) {
  const {
    activeLoans,
    payLoan,
    pullCollateral,
    extendLoan,
    approveLoanFee,
    isLoading,
    refetch,
    currentAllowance,
    currentLmlnAllowance,
    approveTokenAllowance,
    isTransacting,
    userLoanTokenBalance,
    userLmlnBalance,
    loanConfig
  } = useLoans()
  const { tokenConfig } = useContractTokenConfiguration()
  const {
    isLoanOverdue,
    isLoanInGracePeriod,
    getDisplayDueDate,
    getPaymentProgress,
    minimumPayment,
    isPaymentRequired,
    isCollateralWithdrawable,
    getPaymentStatus
  } = useLoanPayment(undefined, tokenConfig?.loanToken.decimals)

  const { toast } = useToast()
  const [selectedLoan, setSelectedLoan] = useState<`0x${string}` | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<
    'balance' | 'minimum' | 'custom'
  >('minimum')
  const [customAmount, setCustomAmount] = useState('')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isApprovingPayment, setIsApprovingPayment] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false)
  const [selectedLoanForExtension, setSelectedLoanForExtension] = useState<
    `0x${string}` | null
  >(null)
  const [isApprovingExtension, setIsApprovingExtension] = useState(false)
  const [isProcessingExtension, setIsProcessingExtension] = useState(false)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)
  const [selectedLoanIdForWithdrawal, setSelectedLoanIdForWithdrawal] =
    useState<`0x${string}` | null>(null)
  const [isWithdrawingCollateral, setIsWithdrawingCollateral] = useState(false)

  // Helper function to format minimum payment with rounding (to nearest 0.10)
  const formatMinimumPayment = (loan: Loan): string => {
    if (!loan || !tokenConfig?.loanToken.decimals) return '0'
    const minPayment = formatTokenAmount(
      loan.paymentAmount,
      tokenConfig.loanToken.decimals
    )
    const rounded = Math.ceil(parseFloat(minPayment) * 10) / 10
    return rounded.toFixed(1)
  }

  // Helper function to get payment amount based on selected type
  const getPaymentAmount = (loan: Loan): string => {
    if (!loan || !tokenConfig?.loanToken.decimals) return '0'

    switch (paymentType) {
      case 'balance':
        return formatTokenAmount(
          loan.remainingBalance,
          tokenConfig.loanToken.decimals
        )
      case 'minimum':
        return formatMinimumPayment(loan)
      case 'custom':
        return customAmount
      default:
        return '0'
    }
  }

  // Helper function to handle payment type changes
  const handlePaymentTypeChange = (
    loan: Loan,
    newType: 'balance' | 'minimum' | 'custom'
  ) => {
    setPaymentType(newType)
    if (newType !== 'custom') {
      setCustomAmount('')
    }
    // Update paymentAmount for validation/approval logic
    if (newType === 'balance') {
      setPaymentAmount(
        formatTokenAmount(
          loan.remainingBalance,
          tokenConfig?.loanToken.decimals || 18
        )
      )
    } else if (newType === 'minimum') {
      setPaymentAmount(formatMinimumPayment(loan))
    }
  }

  const handleApproval = async () => {
    // Find the loan being approved for
    const loan = activeLoans.find((l) => l.id === selectedLoan)
    if (!loan) return

    const currentPaymentAmount = getPaymentAmount(loan)

    if (
      !currentPaymentAmount ||
      parseFloat(currentPaymentAmount) <= 0 ||
      !tokenConfig?.loanToken.decimals
    ) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      })
      return
    }

    setIsApprovingPayment(true)
    try {
      const paymentWei = parseTokenAmount(
        currentPaymentAmount,
        tokenConfig.loanToken.decimals
      )

      await approveTokenAllowance(paymentWei)

      toast({
        title: 'Approval Successful',
        description: 'You can now make the payment!'
      })
    } catch (error: any) {
      handleContractError(error as ContractError, toast, 'Approval Failed')
    } finally {
      setIsApprovingPayment(false)
    }
  }

  const openWithdrawalModal = (loanId: `0x${string}`) => {
    setSelectedLoanIdForWithdrawal(loanId)
    setIsWithdrawalModalOpen(true)
  }

  const closeWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false)
    setSelectedLoanIdForWithdrawal(null)
    setIsWithdrawingCollateral(false)
  }

  const confirmWithdrawal = async () => {
    if (!selectedLoanIdForWithdrawal) return

    setIsWithdrawingCollateral(true)
    try {
      const result = await pullCollateral(selectedLoanIdForWithdrawal)

      // Only show success if we actually get a successful result
      if (result) {
        // Refresh all loan data
        await refetch()

        toast({
          title: 'Withdrawal Successful',
          description: 'Your collateral has been withdrawn successfully!'
        })

        // Close modal and reset state
        closeWithdrawalModal()
      }
    } catch (error: any) {
      handleContractError(error as ContractError, toast, 'Withdrawal Failed')
    } finally {
      setIsWithdrawingCollateral(false)
    }
  }

  const handleExtensionApproval = async (loan: Loan) => {
    if (!loan.originationFee) {
      toast({
        title: 'Invalid Fee',
        description: 'Origination fee not found for this loan',
        variant: 'destructive'
      })
      return
    }

    setIsApprovingExtension(true)
    try {
      await approveLoanFee(loan.originationFee)

      toast({
        title: 'Approval Successful',
        description: 'You can now extend your loan!'
      })
    } catch (error: any) {
      handleContractError(error as ContractError, toast, 'Approval Failed')
    } finally {
      setIsApprovingExtension(false)
    }
  }

  const handleExtension = async (loan: Loan) => {
    // Check if we have sufficient LMLN allowance
    if (!currentLmlnAllowance || currentLmlnAllowance < loan.originationFee) {
      toast({
        title: 'Insufficient Allowance',
        description: 'Please approve LMLN tokens first',
        variant: 'destructive'
      })
      return
    }

    // Check if we have loan config
    if (!loanConfig?.maxLoanExtension) {
      toast({
        title: 'Configuration Error',
        description: 'Loan configuration not loaded',
        variant: 'destructive'
      })
      return
    }

    setIsProcessingExtension(true)
    try {
      const result = await extendLoan(loan.id, loanConfig.maxLoanExtension)

      if (result) {
        await refetch()

        toast({
          title: 'Extension Successful',
          description: `Your loan has been extended by ${loanConfig ? formatDuration(loanConfig.maxLoanExtension) : 'the maximum allowed time'}!`
        })

        // Close the dialog and clear state
        setSelectedLoanForExtension(null)
        setIsApprovingExtension(false)
        setIsProcessingExtension(false)
        setIsExtensionDialogOpen(false)
      }
    } catch (error: any) {
      handleContractError(error as ContractError, toast, 'Extension Failed')
    } finally {
      setIsProcessingExtension(false)
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

    // Validate loan status before proceeding
    if (loan.status !== LOAN_STATUS.ACTIVE) {
      const statusLabel = getLoanStatusLabel(loan.status)
      toast({
        title: 'Payment Not Allowed',
        description: `Cannot make payments on ${statusLabel.toLowerCase()} loans. Only active loans can receive payments.`,
        variant: 'destructive'
      })
      return
    }

    const currentPaymentAmount = getPaymentAmount(loan)

    if (
      !currentPaymentAmount ||
      parseFloat(currentPaymentAmount) <= 0 ||
      !tokenConfig?.loanToken.decimals
    ) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      // Convert payment amount to wei using loan token decimals from contract
      const paymentWei = parseTokenAmount(
        currentPaymentAmount,
        tokenConfig.loanToken.decimals
      )

      // Check if user has sufficient token balance
      if (userLoanTokenBalance && paymentWei > userLoanTokenBalance) {
        toast({
          title: 'Insufficient Balance',
          description: `You need ${currentPaymentAmount} ${tokenConfig?.loanToken.symbol} but only have ${formatTokenAmount(userLoanTokenBalance, tokenConfig.loanToken.decimals)} ${tokenConfig?.loanToken.symbol}`,
          variant: 'destructive'
        })
        setIsProcessingPayment(false)
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
        setIsProcessingPayment(false)
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
        setPaymentType('minimum')
        setCustomAmount('')
        setIsApprovingPayment(false)
        setIsProcessingPayment(false)
        setIsPaymentDialogOpen(false)
      }
    } catch (error: any) {
      handleContractError(error as ContractError, toast, 'Payment Failed')
    } finally {
      setIsProcessingPayment(false)
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
                    ? formatPercentage(
                        loan.interestApr,
                        tokenConfig.aprDecimals
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
        const displayDueDate = getDisplayDueDate(loan)
        const progress = getPaymentProgress(loan)
        const isOverdue = isLoanOverdue(loan)
        const isInGracePeriod = isLoanInGracePeriod(loan)

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
                  {isInGracePeriod && loan.status === LOAN_STATUS.ACTIVE && (
                    <Badge
                      variant='secondary'
                      className='bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    >
                      Payoff Period
                    </Badge>
                  )}
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
                      ? formatPercentage(
                          loan.interestApr,
                          tokenConfig.aprDecimals
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
                    {displayDueDate.toLocaleDateString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {isOverdue ? 'Overdue' : 'Time Until Due'}
                  </p>
                  <div className='font-medium'>
                    {loan.status === LOAN_STATUS.ACTIVE ? (
                      <CountdownTimer
                        targetDate={displayDueDate}
                        compact
                        showIcon={false}
                        animate
                      />
                    ) : (
                      <span className='text-muted-foreground'>N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>
                    {isInGracePeriod
                      ? 'Principal Payment Due'
                      : 'Payment Progress'}
                  </span>
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
                    {isInGracePeriod ? 'Principal' : 'Remaining'}:{' '}
                    {formatAmountWithSymbol(
                      isInGracePeriod ? loan.loanAmount : loan.remainingBalance,
                      tokenConfig?.loanToken.symbol || 'Token'
                    )}
                  </span>
                </div>
                {isInGracePeriod && (
                  <div className='text-xs text-blue-600 dark:text-blue-400 mt-2'>
                    All interest paid. Pay principal to unlock collateral.
                  </div>
                )}
              </div>

              {/* Contract Details */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t'>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Loan Duration</p>
                  <p className='text-sm font-medium'>
                    {formatDuration(loan.duration)}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>
                    Cycles Transpired
                  </p>
                  <p className='text-sm font-medium'>
                    {loan.transpiredCycles.toString()}/
                    {loan.totalCycles.toString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Collateral</p>
                  <p className='text-sm font-medium'>
                    {formatAmountWithSymbol(
                      loan.collateralAmount,
                      tokenConfig?.nativeToken.symbol || 'Token'
                    )}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>LTV</p>
                  <p className='text-sm font-medium'>
                    {tokenConfig
                      ? formatPercentage(loan.ltv, tokenConfig.ltvDecimals) +
                        '%'
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
                    onClick={() => openWithdrawalModal(loan.id)}
                    disabled={isTransacting}
                  >
                    Withdraw Collateral
                  </Button>
                ) : (
                  <Dialog
                    open={isPaymentDialogOpen && selectedLoan === loan.id}
                    onOpenChange={(open) => {
                      setIsPaymentDialogOpen(open)
                      if (!open) {
                        setSelectedLoan(null)
                        setPaymentAmount('')
                        setPaymentType('minimum')
                        setCustomAmount('')
                        setIsApprovingPayment(false)
                        setIsProcessingPayment(false)
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          // Validate loan status before opening dialog
                          if (loan.status !== LOAN_STATUS.ACTIVE) {
                            const statusLabel = getLoanStatusLabel(loan.status)
                            toast({
                              title: 'Payment Not Available',
                              description: `Cannot make payments on ${statusLabel.toLowerCase()} loans. Only active loans can receive payments.`,
                              variant: 'destructive'
                            })
                            return
                          }

                          setSelectedLoan(loan.id)
                          setPaymentType('minimum')
                          setPaymentAmount(formatMinimumPayment(loan))
                          setCustomAmount('')
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
                        <div className='space-y-4'>
                          <div className='space-y-3'>
                            <Label>Payment Options</Label>
                            <RadioGroup
                              value={paymentType}
                              onValueChange={(value) =>
                                handlePaymentTypeChange(
                                  loan,
                                  value as 'balance' | 'minimum' | 'custom'
                                )
                              }
                              className='space-y-3'
                            >
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='minimum' id='minimum' />
                                <Label htmlFor='minimum' className='flex-1'>
                                  <div className='flex items-center justify-between'>
                                    <span>Pay minimum payment</span>
                                    <span className='text-sm text-muted-foreground'>
                                      {formatAmountWithSymbol(
                                        parseTokenAmount(
                                          formatMinimumPayment(loan),
                                          tokenConfig?.loanToken.decimals || 18
                                        ),
                                        tokenConfig?.loanToken.symbol || 'Token'
                                      )}
                                    </span>
                                  </div>
                                </Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='balance' id='balance' />
                                <Label htmlFor='balance' className='flex-1'>
                                  <div className='flex items-center justify-between'>
                                    <span>Pay loan balance</span>
                                    <span className='text-sm text-muted-foreground'>
                                      {formatAmountWithSymbol(
                                        loan.remainingBalance,
                                        tokenConfig?.loanToken.symbol || 'Token'
                                      )}
                                    </span>
                                  </div>
                                </Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='custom' id='custom' />
                                <Label htmlFor='custom'>Custom amount</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {paymentType === 'custom' && (
                            <div className='space-y-2'>
                              <Label htmlFor='custom-amount'>
                                Amount (
                                {tokenConfig?.loanToken.symbol || 'Token'})
                              </Label>
                              <Input
                                id='custom-amount'
                                type='number'
                                placeholder='0.00'
                                value={customAmount}
                                onChange={(e) => {
                                  setCustomAmount(e.target.value)
                                  setPaymentAmount(e.target.value)
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className='flex gap-2'>
                          {(() => {
                            // Check if approval is needed
                            const currentPaymentAmount = getPaymentAmount(loan)
                            const paymentWei =
                              currentPaymentAmount &&
                              tokenConfig?.loanToken.decimals
                                ? parseTokenAmount(
                                    currentPaymentAmount,
                                    tokenConfig.loanToken.decimals
                                  )
                                : 0n
                            const needsApproval =
                              !currentAllowance || currentAllowance < paymentWei
                            const hasValidAmount =
                              currentPaymentAmount &&
                              parseFloat(currentPaymentAmount) > 0

                            if (
                              needsApproval &&
                              hasValidAmount &&
                              paymentWei > 0n
                            ) {
                              return (
                                <Button
                                  onClick={handleApproval}
                                  disabled={
                                    isApprovingPayment ||
                                    isProcessingPayment ||
                                    !hasValidAmount
                                  }
                                  className='flex-1'
                                >
                                  {isApprovingPayment
                                    ? 'Approving...'
                                    : 'Approve Tokens'}
                                </Button>
                              )
                            } else {
                              return (
                                <Button
                                  onClick={() => handlePayment(loan.id)}
                                  disabled={
                                    isApprovingPayment ||
                                    isProcessingPayment ||
                                    !hasValidAmount ||
                                    needsApproval
                                  }
                                  className='flex-1'
                                >
                                  {isProcessingPayment
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
                              setPaymentType('minimum')
                              setCustomAmount('')
                              setIsApprovingPayment(false)
                              setIsProcessingPayment(false)
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

                {/* Extend Loan Button - for active loans only */}
                {loan.status === LOAN_STATUS.ACTIVE && (
                  <Dialog
                    open={
                      isExtensionDialogOpen &&
                      selectedLoanForExtension === loan.id
                    }
                    onOpenChange={(open) => {
                      setIsExtensionDialogOpen(open)
                      if (!open) {
                        setSelectedLoanForExtension(null)
                        setIsApprovingExtension(false)
                        setIsProcessingExtension(false)
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedLoanForExtension(loan.id)
                          setIsExtensionDialogOpen(true)
                        }}
                      >
                        Extend Loan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Extend Loan</DialogTitle>
                        <DialogDescription>
                          Extend loan #{truncateAddress(loan.id)} by{' '}
                          {loanConfig
                            ? formatDuration(loanConfig.maxLoanExtension)
                            : 'max allowed time'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div className='bg-muted/50 p-4 rounded-lg space-y-3'>
                          <h4 className='font-medium text-sm'>
                            What is a loan extension?
                          </h4>
                          <p className='text-sm text-muted-foreground'>
                            A loan extension adds{' '}
                            {loanConfig
                              ? formatDuration(loanConfig.maxLoanExtension)
                              : 'additional time'}{' '}
                            to your loan duration, giving you more time to
                            repay. This extension applies to the end of your
                            loan term, not the principal payment payoff period.
                          </p>
                          <div className='space-y-2 pt-2'>
                            <div className='flex justify-between text-sm'>
                              <span className='text-muted-foreground'>
                                Current Due Date:
                              </span>
                              <span className='font-medium'>
                                {formatTimestamp(
                                  loan.dueTimestamp
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-muted-foreground'>
                                New Due Date:
                              </span>
                              <span className='font-medium'>
                                {loanConfig
                                  ? new Date(
                                      Number(loan.dueTimestamp) * 1000 +
                                        Number(loanConfig.maxLoanExtension) *
                                          1000
                                    ).toLocaleDateString()
                                  : 'Calculating...'}
                              </span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-muted-foreground'>
                                APR:
                              </span>
                              <span className='font-medium'>
                                {tokenConfig
                                  ? formatPercentage(
                                      loan.interestApr,
                                      tokenConfig.aprDecimals
                                    ) + '%'
                                  : '...'}
                              </span>
                            </div>
                            <div className='flex justify-between text-sm pt-2 border-t'>
                              <span className='text-muted-foreground'>
                                Extension Fee:
                              </span>
                              <span className='font-medium'>
                                {formatAmountWithSymbol(
                                  loan.originationFee,
                                  tokenConfig?.feeToken.symbol || 'LMLN'
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='flex gap-2'>
                          {(() => {
                            // Check if approval is needed for extension fee
                            const needsApproval =
                              !currentLmlnAllowance ||
                              currentLmlnAllowance < loan.originationFee
                            const hasInsufficientBalance =
                              userLmlnBalance &&
                              userLmlnBalance < loan.originationFee

                            if (hasInsufficientBalance) {
                              return (
                                <div className='text-sm text-red-600 flex items-center gap-2'>
                                  <AlertCircle className='h-4 w-4' />
                                  <span>
                                    Insufficient LMLN balance for extension fee
                                  </span>
                                </div>
                              )
                            }

                            if (needsApproval) {
                              return (
                                <Button
                                  onClick={() => handleExtensionApproval(loan)}
                                  disabled={
                                    isApprovingExtension ||
                                    isProcessingExtension
                                  }
                                  className='flex-1'
                                >
                                  {isApprovingExtension
                                    ? 'Approving...'
                                    : 'Approve LMLN'}
                                </Button>
                              )
                            } else {
                              return (
                                <Button
                                  onClick={() => handleExtension(loan)}
                                  disabled={
                                    isApprovingExtension ||
                                    isProcessingExtension ||
                                    needsApproval
                                  }
                                  className='flex-1'
                                >
                                  {isProcessingExtension
                                    ? 'Processing...'
                                    : 'Confirm Extension'}
                                </Button>
                              )
                            }
                          })()}
                          <Button
                            variant='outline'
                            onClick={() => {
                              setSelectedLoanForExtension(null)
                              setIsApprovingExtension(false)
                              setIsProcessingExtension(false)
                              setIsExtensionDialogOpen(false)
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
                    <div className='flex flex-col'>
                      <span>Payment overdue</span>
                      <span className='text-xs text-orange-600'>
                        Payment still possible until contract default
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Loan Completion Modal */}
      {selectedLoanIdForWithdrawal && (
        <LoanCompletionModal
          isOpen={isWithdrawalModalOpen}
          onClose={closeWithdrawalModal}
          loan={activeLoans.find((l) => l.id === selectedLoanIdForWithdrawal)}
          tokenConfig={tokenConfig}
          isWithdrawing={isWithdrawingCollateral}
          onConfirmWithdrawal={confirmWithdrawal}
        />
      )}
    </div>
  )
}
