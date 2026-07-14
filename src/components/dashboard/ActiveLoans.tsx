'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
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
import { useDelegateValidation } from '@/src/hooks/loans/useDelegateValidation'
import { OriginationPayerField } from '@/src/components/common/OriginationPayerField'
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
  AlertCircle,
  Copy,
  Check,
  Info
} from 'lucide-react'
import { LoanCompletionModal } from '../common/LoanCompletionModal'
import { useCollateralManager } from '@/src/hooks/useCollateralManager'

interface ActiveLoansProps {
  compact?: boolean
}

export function ActiveLoans({ compact = false }: ActiveLoansProps) {
  const { address, chain } = useAccount()
  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'native token'

  // Extension origination-payer field — re-targets LMLN balance/allowance
  // reads in useLoans below when the borrower has unlocked it and supplied a
  // verified delegate. Default = connected wallet, locked.
  const [extensionPayerInput, setExtensionPayerInput] = useState('')
  const [isExtensionPayerLocked, setIsExtensionPayerLocked] = useState(true)
  useEffect(() => {
    if (isExtensionPayerLocked) {
      setExtensionPayerInput(address ?? '')
    }
  }, [address, isExtensionPayerLocked])

  const extensionPayerValidation = useDelegateValidation(extensionPayerInput)
  const effectiveExtensionPayer =
    !isExtensionPayerLocked &&
    extensionPayerValidation.normalizedAddress &&
    !extensionPayerValidation.isSelf
      ? extensionPayerValidation.normalizedAddress
      : undefined

  const {
    activeLoans,
    payLoan,
    pullCollateral,
    extendLoan,
    approveLoanFee,
    isLoading,
    error: loansError,
    refetch,
    currentAllowance,
    currentLmlnAllowance,
    approveTokenAllowance,
    isTransacting,
    userLoanTokenBalance,
    userLmlnBalance,
    loanConfig,
    interestAprConfigs,
    paymentFeeBps,
    bpsDenominator,
    getGrossPaymentAmount,
    paymentNativeFee,
  } = useLoans({ originationPayer: effectiveExtensionPayer })
  const { tokenConfig } = useContractTokenConfiguration()
  const { getCollateralByAddress } = useCollateralManager()
  const {
    isLoanOverdue,
    isLoanInGracePeriod,
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
  const [extensionDuration, setExtensionDuration] = useState(0)
  const [isApprovingExtension, setIsApprovingExtension] = useState(false)
  const [isProcessingExtension, setIsProcessingExtension] = useState(false)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)
  const [selectedLoanIdForWithdrawal, setSelectedLoanIdForWithdrawal] =
    useState<`0x${string}` | null>(null)
  const [isWithdrawingCollateral, setIsWithdrawingCollateral] = useState(false)
  const [copiedLoanId, setCopiedLoanId] = useState<string | null>(null)
  const [openInfoLoanId, setOpenInfoLoanId] = useState<string | null>(null)

  const handleCopyLoanId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedLoanId(id)
    setTimeout(() => setCopiedLoanId(null), 2000)
  }

  // Helper function to format minimum payment with rounding (to nearest 0.10)
  const formatMinimumPayment = (loan: Loan): string => {
    if (!loan || !tokenConfig?.loanToken.decimals) return '0'
    const minPayment = formatTokenAmount(
      loan.paymentAmount,
      tokenConfig.loanToken.decimals
    )
    const rounded = Math.ceil(parseFloat(minPayment) * 10) / 10
    // Rounding a cost up is the safe direction, but near payoff the rounded
    // minimum can exceed the remaining balance — and the payment guard then
    // rejects the app's own default suggestion with "Payment Too Large".
    // Clamp to the exact remaining balance in that case.
    const remaining = formatTokenAmount(
      loan.remainingBalance,
      tokenConfig.loanToken.decimals
    )
    if (rounded > parseFloat(remaining)) {
      return remaining
    }
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
        title: '\u2705 Approval Successful',
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
          title: '\u2705 Withdrawal Successful',
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
        title: '\u2705 Approval Successful',
        description: 'You can now extend your loan!'
      })
    } catch (error: any) {
      handleContractError(error as ContractError, toast, 'Approval Failed')
    } finally {
      setIsApprovingExtension(false)
    }
  }

  const handleExtension = async (loan: Loan) => {
    if (!extensionDuration) return
    setIsProcessingExtension(true)
    try {
      await extendLoan(loan.id, BigInt(extensionDuration))
      toast({
        title: '✅ Extension Successful',
        description: `Your loan has been extended by ${formatDuration(BigInt(extensionDuration))}.`
      })
      setSelectedLoanForExtension(null)
      setIsApprovingExtension(false)
      setIsProcessingExtension(false)
      setIsExtensionDialogOpen(false)
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
      const paymentWei = parseTokenAmount(
        currentPaymentAmount,
        tokenConfig.loanToken.decimals
      )

      // Check if user has sufficient token balance for the gross debit
      // (payment + protocol fee) the contract will pull.
      if (
        userLoanTokenBalance !== undefined &&
        getGrossPaymentAmount(paymentWei) > userLoanTokenBalance
      ) {
        toast({
          title: 'Insufficient Balance',
          description: `Including the protocol fee you need ${formatTokenAmount(getGrossPaymentAmount(paymentWei), tokenConfig.loanToken.decimals)} ${tokenConfig?.loanToken.symbol} but only have ${formatTokenAmount(userLoanTokenBalance, tokenConfig.loanToken.decimals)} ${tokenConfig?.loanToken.symbol}`,
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
          title: '\u2705 Payment Successful',
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

  // Loading takes 2+ sequential RPC rounds (loan IDs, then per-loan data) —
  // without this gate every page load flashes "No Active Loans" at borrowers
  // who do have loans, including overdue ones.
  if (activeLoans.length === 0 && isLoading) {
    return (
      <div className='text-center py-8'>
        <CreditCard className='h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse' />
        <p className='text-sm text-muted-foreground'>Loading your loans…</p>
      </div>
    )
  }

  // A load failure must never masquerade as "no loans" — a borrower could
  // believe an overdue loan is gone.
  if (activeLoans.length === 0 && loansError) {
    return (
      <div className='text-center py-8'>
        <AlertCircle className='h-12 w-12 mx-auto mb-4 text-destructive' />
        <h3 className='text-lg font-medium mb-2'>Couldn&apos;t load your loans</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Something went wrong while fetching your loan data. Your loans are
          unaffected — please retry.
        </p>
        <Button variant='outline' onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
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
        const progress = getPaymentProgress(loan)
        const isOverdue = isLoanOverdue(loan)
        const isInGracePeriod = isLoanInGracePeriod(loan)

        // Countdown target — derived entirely from absolute timestamps on the
        // loan struct so the value does not shift when the component
        // re-renders. Three phases:
        //
        //   1. Interest NOT fully paid:
        //      count to the next cycle's payment deadline (capped at the loan
        //      end date) − 1 day. Label: "Time Until Default".
        //   2. Interest fully paid, before loan end:
        //      count to createdAt + duration. No buffer. Label: "Time to Loan End".
        //   3. Interest fully paid, past loan end (balloon grace window):
        //      count to loanEnd + balloonGrace − 1 day. Label: "Time Until Default".
        // The 1-day buffer in Phases 1 and 3 is a user-facing warning window so
        // the countdown hits zero ahead of the contract's actual default. On
        // testnet (cycles smaller than a day) the buffer dominates and the
        // timer reads "Make Payment Now" through the entire active phase —
        // expected, since this is sized for mainnet cycle lengths.
        const ONE_DAY_MS = 24 * 60 * 60 * 1000
        const loanEndMs = Number(loan.dueTimestamp) * 1000
        // Per-loan grace snapshot (fixed at creation) so a config change
        // can't shift existing loans' default countdowns; pre-upgrade loans
        // have no snapshot (0) and fall back to the global config.
        const graceDurationMs =
          loan.balloonGraceSnapshot > 0n
            ? Number(loan.balloonGraceSnapshot) * 1000
            : loanConfig?.balloonPaymentGraceDuration
              ? Number(loanConfig.balloonPaymentGraceDuration) * 1000
              : 0
        const pastLoanEnd = isOverdue // isLoanOverdue === "now >= loanEndMs"

        // End of the next cycle the user must pay, accounting for prepayments.
        const nextCycleIndex = loan.transpiredCycles + loan.cyclesAhead + 1n
        const nextCycleEndMs = Number(
          loan.createdAt + nextCycleIndex * loan.loanCycleDuration
        ) * 1000
        const nextPaymentDeadlineMs = Math.min(nextCycleEndMs, loanEndMs)

        let countdownTarget: Date
        let countdownLabel: string
        if (!isInGracePeriod) {
          countdownTarget = new Date(nextPaymentDeadlineMs - ONE_DAY_MS)
          countdownLabel = 'Time Until Default'
        } else if (!pastLoanEnd) {
          countdownTarget = new Date(loanEndMs)
          countdownLabel = 'Time to Loan End'
        } else {
          countdownTarget = new Date(loanEndMs + graceDurationMs - ONE_DAY_MS)
          countdownLabel = 'Time Until Default'
        }
        const showCountdownTooltip = countdownLabel === 'Time Until Default'

        return (
          <Card key={loan.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <CreditCard className='h-5 w-5 text-green-600' />
                  <div>
                    <CardTitle className='text-lg flex items-center gap-1.5'>
                      Loan #{truncateAddress(loan.id)}
                      <button
                        type='button'
                        onClick={() => handleCopyLoanId(loan.id)}
                        className='text-muted-foreground hover:text-foreground transition-colors'
                        title='Copy loan ID'
                      >
                        {copiedLoanId === loan.id ? (
                          <Check className='h-3.5 w-3.5 text-green-600' />
                        ) : (
                          <Copy className='h-3.5 w-3.5' />
                        )}
                      </button>
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
                    Loan End Date
                  </p>
                  <p className='font-medium'>
                    {new Date(Number(loan.dueTimestamp) * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {countdownLabel}
                    {showCountdownTooltip && (
                      <span className='relative inline-flex'>
                        <button
                          type='button'
                          aria-label='Countdown info'
                          aria-expanded={openInfoLoanId === loan.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenInfoLoanId(openInfoLoanId === loan.id ? null : loan.id)
                          }}
                          onBlur={() => setOpenInfoLoanId(null)}
                          className='inline-flex items-center'
                        >
                          <Info className='h-3 w-3 cursor-pointer' />
                        </button>
                        {openInfoLoanId === loan.id && (
                          <span
                            role='tooltip'
                            className='absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-muted text-foreground text-xs rounded-md px-3 py-1.5 shadow-md max-w-xs w-max'
                          >
                            Time includes a safety buffer to account for blockchain timing.
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                  <div className='font-medium'>
                    {loan.status === LOAN_STATUS.ACTIVE ? (
                      <CountdownTimer
                        targetDate={countdownTarget}
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
                    {/* remainingBalance in both phases — showing the original
                        loanAmount here overstated the debt for borrowers who
                        prepaid part of the principal before the grace window. */}
                    {formatAmountWithSymbol(
                      loan.remainingBalance,
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
                    {(() => {
                      // Pure real-time progress through the cycle schedule —
                      // payments don't advance this cell. UNLOCKED/COMPLETED
                      // loans surface N/N because combineLoanData resolves
                      // transpiredCycles to totalCycles for non-ACTIVE loans.
                      const done = loan.transpiredCycles
                      const capped = done > loan.totalCycles ? loan.totalCycles : done
                      return capped.toString()
                    })()}
                    /{loan.totalCycles.toString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Collateral</p>
                  <p className='text-sm font-medium'>
                    {formatAmountWithSymbol(
                      loan.collateralAmount,
                      getCollateralByAddress(loan.collateralToken)?.symbol || 'Token'
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
                      // Don't let ESC / outside-click dismiss mid-transaction —
                      // the user would lose the pending-payment context.
                      if (!open && (isApprovingPayment || isProcessingPayment)) {
                        return
                      }
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

                          {/* Fee disclosure — the contract debits payment +
                              protocol fee, and payable ops charge a native
                              network fee. Both must be visible pre-sign. */}
                          {(() => {
                            const currentPaymentAmount = getPaymentAmount(loan)
                            const paymentWei =
                              currentPaymentAmount && tokenConfig?.loanToken.decimals
                                ? parseTokenAmount(currentPaymentAmount, tokenConfig.loanToken.decimals)
                                : 0n
                            if (paymentWei <= 0n) return null
                            const grossWei = getGrossPaymentAmount(paymentWei)
                            const feePercent =
                              Number((paymentFeeBps * 10000n) / bpsDenominator) / 100
                            return (
                              <div className='rounded-md bg-muted p-3 text-sm space-y-1'>
                                <div className='flex justify-between'>
                                  <span className='text-muted-foreground'>
                                    Protocol fee ({feePercent}%)
                                  </span>
                                  <span>
                                    {formatAmountWithSymbol(
                                      grossWei - paymentWei,
                                      tokenConfig?.loanToken.symbol || 'Token'
                                    )}
                                  </span>
                                </div>
                                <div className='flex justify-between font-medium'>
                                  <span>Total debit</span>
                                  <span>
                                    {formatAmountWithSymbol(
                                      grossWei,
                                      tokenConfig?.loanToken.symbol || 'Token'
                                    )}
                                  </span>
                                </div>
                                {paymentNativeFee !== undefined &&
                                  paymentNativeFee > 0n && (
                                    <div className='flex justify-between'>
                                      <span className='text-muted-foreground'>
                                        Network fee
                                      </span>
                                      <span>
                                        {Number(
                                          formatEther(paymentNativeFee)
                                        ).toLocaleString('en-US', {
                                          maximumFractionDigits: 4
                                        })}{' '}
                                        {nativeSymbol}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            )
                          })()}
                        </div>
                        <div className='flex gap-2'>
                          {(() => {
                            // Check if approval is needed. The contract pulls
                            // amount + protocol fee (FEE_BPS, read from chain)
                            // on makeLoanPayment, so the allowance must cover
                            // the gross — otherwise this button silently shows
                            // "Confirm Payment" and the tx reverts with
                            // insufficient allowance.
                            const currentPaymentAmount = getPaymentAmount(loan)
                            const paymentWei =
                              currentPaymentAmount && tokenConfig?.loanToken.decimals
                                ? parseTokenAmount(currentPaymentAmount, tokenConfig.loanToken.decimals)
                                : 0n
                            const contractPullWei = getGrossPaymentAmount(paymentWei)
                            const needsApproval =
                              !currentAllowance || currentAllowance < contractPullWei
                            const hasValidAmount =
                              currentPaymentAmount &&
                              parseFloat(currentPaymentAmount) > 0
                            const hasInsufficientPaymentBalance =
                              userLoanTokenBalance !== undefined &&
                              hasValidAmount &&
                              paymentWei > 0n &&
                              userLoanTokenBalance < contractPullWei

                            if (hasInsufficientPaymentBalance) {
                              return (
                                <div className='flex-1 text-sm text-destructive flex items-center gap-2'>
                                  <AlertCircle className='h-4 w-4' />
                                  <span>
                                    You don&apos;t have enough{' '}
                                    {tokenConfig?.loanToken.symbol || 'tokens'} for this payment.
                                  </span>
                                </div>
                              )
                            }

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
                                    ? 'Approving…'
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
                                    ? 'Processing…'
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
                      // Don't dismiss mid-transaction (see payment dialog).
                      if (
                        !open &&
                        (isApprovingExtension || isProcessingExtension)
                      ) {
                        return
                      }
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
                          setExtensionDuration(loanConfig ? Number(loanConfig.minLoanDuration) : 0)
                          setIsExtensionDialogOpen(true)
                        }}
                      >
                        Extend Loan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-md'>
                      <DialogHeader>
                        <DialogTitle>Extend Loan</DialogTitle>
                        <DialogDescription>
                          Select how long you&apos;d like to extend loan #{truncateAddress(loan.id)}.
                        </DialogDescription>
                      </DialogHeader>
                      {(() => {
                        const minDur = loanConfig ? Number(loanConfig.minLoanDuration) : 0
                        const maxDur = Number(loan.originalDuration)
                        const stepDur = loanConfig ? Number(loanConfig.loanCycleDuration) : 1
                        const aprConfig = interestAprConfigs.find(
                          (c) => extensionDuration >= Number(c.minDuration) && extensionDuration <= Number(c.maxDuration)
                        )
                        const aprPct = aprConfig && tokenConfig
                          ? formatPercentage(aprConfig.interestApr, tokenConfig.aprDecimals) + '%'
                          : '—'
                        const newDueDate = extensionDuration > 0
                          ? new Date(Number(loan.dueTimestamp) * 1000 + extensionDuration * 1000).toLocaleDateString()
                          : '—'
                        const ltvPct = tokenConfig
                          ? formatPercentage(loan.ltv, tokenConfig.ltvDecimals) + '%'
                          : '—'
                        // currentLmlnAllowance + userLmlnBalance are auto-redirected to the
                        // delegate's wallet when one is unlocked + valid (see useLoans options
                        // wired up at top of this component). Same comparisons work either way.
                        const needsApproval = !currentLmlnAllowance || currentLmlnAllowance < loan.originationFee
                        const hasInsufficientBalance = userLmlnBalance !== undefined && userLmlnBalance < loan.originationFee
                        // Block the CTA if the borrower has unlocked the field but
                        // hasn't supplied a verified delegate yet (red text in the
                        // OriginationPayerField surfaces the reason).
                        const payerBlocks =
                          !isExtensionPayerLocked && !extensionPayerValidation.isValid

                        return (
                          <div className='space-y-5'>
                            {/* Duration slider */}
                            <div>
                              <label className='block text-sm font-medium mb-2'>
                                Extension Duration: {extensionDuration > 0 ? formatDuration(BigInt(extensionDuration)) : '—'}
                              </label>
                              {minDur > 0 && maxDur > 0 ? (
                                <>
                                  <input
                                    type='range'
                                    min={minDur}
                                    max={maxDur}
                                    step={stepDur}
                                    value={extensionDuration || minDur}
                                    onChange={(e) => setExtensionDuration(Number(e.target.value))}
                                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
                                  />
                                  <div className='flex justify-between text-sm text-muted-foreground mt-1'>
                                    <span>{formatDuration(BigInt(minDur))}</span>
                                    <span>{formatDuration(BigInt(maxDur))}</span>
                                  </div>
                                </>
                              ) : (
                                <p className='text-sm text-muted-foreground'>Loading configuration...</p>
                              )}
                            </div>

                            {/* Summary */}
                            <div className='bg-muted/50 p-4 rounded-lg space-y-2'>
                              <div className='flex justify-between text-sm'>
                                <span className='text-muted-foreground'>Estimated APR</span>
                                <span className='font-medium text-yellow-600'>{aprPct}</span>
                              </div>
                              <div className='flex justify-between text-sm'>
                                <span className='text-muted-foreground'>LTV Ratio</span>
                                <span className='font-medium text-yellow-600'>{ltvPct}</span>
                              </div>
                              <div className='flex justify-between text-sm'>
                                <span className='text-muted-foreground'>Current Due Date</span>
                                <span className='font-medium'>
                                  {formatTimestamp(loan.dueTimestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className='flex justify-between text-sm'>
                                <span className='text-muted-foreground'>New Due Date</span>
                                <span className='font-medium'>{newDueDate}</span>
                              </div>
                              {loan.originationFee > 0n && (
                                <div className='flex justify-between text-sm pt-2 border-t'>
                                  <span className='text-muted-foreground'>Extension Fee</span>
                                  <span className='font-medium'>
                                    {formatAmountWithSymbol(loan.originationFee, tokenConfig?.feeToken.symbol || 'LMLN')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Origination-fee payer (default = self; unlock to delegate). */}
                            <OriginationPayerField
                              value={extensionPayerInput}
                              onChange={setExtensionPayerInput}
                              validation={extensionPayerValidation}
                              isLocked={isExtensionPayerLocked}
                              onToggleLock={() => {
                                setIsExtensionPayerLocked((wasLocked) => {
                                  if (!wasLocked) {
                                    setExtensionPayerInput(address ?? '')
                                  }
                                  return !wasLocked
                                })
                              }}
                              feeTokenSymbol={tokenConfig?.feeToken.symbol || 'LMLN'}
                              feeTokenDecimals={tokenConfig?.feeToken.decimals ?? 18}
                              id={`extend-payer-${loan.id}`}
                            />

                            {/* Actions. hasInsufficientBalance / needsApproval reflect the
                             *  *fee payer's* wallet — borrower when locked or self, delegate
                             *  otherwise. The Approve LMLN button only shows when the user
                             *  is paying their own fee; a delegate is expected to have
                             *  pre-approved max LMLN when authorizing themselves.
                             *
                             *  We suppress the balance warning while a delegate is unlocked
                             *  but unauthorized — the field's "not authorized" message is
                             *  the actionable error to show first. */}
                            {/* A verified delegate with insufficient allowance used to
                                leave "Confirm Extension" inexplicably dead while the
                                field showed green — say why and what to do. */}
                            {!isExtensionPayerLocked &&
                              !extensionPayerValidation.isSelf &&
                              extensionPayerValidation.isValid &&
                              needsApproval &&
                              loan.originationFee > 0n &&
                              !hasInsufficientBalance && (
                                <p className='text-sm text-destructive flex items-center gap-2'>
                                  <AlertCircle className='h-4 w-4 shrink-0' />
                                  <span>
                                    The delegate hasn&apos;t approved enough{' '}
                                    {tokenConfig?.feeToken.symbol || 'LMLN'} to the
                                    Loans contract. They need to grant approval (the
                                    Delegation Manager does this when authorizing)
                                    before you can extend.
                                  </span>
                                </p>
                              )}
                            <div className='flex gap-2'>
                              {hasInsufficientBalance &&
                              (isExtensionPayerLocked ||
                                extensionPayerValidation.isValid) ? (
                                <div className='flex-1 text-sm text-destructive flex items-center gap-2'>
                                  <AlertCircle className='h-4 w-4' />
                                  <span>
                                    {!isExtensionPayerLocked && !extensionPayerValidation.isSelf
                                      ? `The chosen delegate doesn't have enough ${tokenConfig?.feeToken.symbol || 'LMLN'} for the extension fee.`
                                      : `You don't have enough ${tokenConfig?.feeToken.symbol || 'LMLN'} for the extension fee.`}
                                  </span>
                                </div>
                              ) : needsApproval &&
                                loan.originationFee > 0n &&
                                (isExtensionPayerLocked || extensionPayerValidation.isSelf) ? (
                                <Button
                                  onClick={() => handleExtensionApproval(loan)}
                                  disabled={isApprovingExtension || isProcessingExtension}
                                  className='flex-1'
                                >
                                  {isApprovingExtension ? 'Approving…' : 'Approve LMLN'}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleExtension(loan)}
                                  disabled={
                                    isProcessingExtension ||
                                    extensionDuration === 0 ||
                                    payerBlocks ||
                                    // Delegate must have sufficient allowance too —
                                    // currentLmlnAllowance is auto-targeted to them.
                                    (!isExtensionPayerLocked &&
                                      !extensionPayerValidation.isSelf &&
                                      needsApproval &&
                                      loan.originationFee > 0n)
                                  }
                                  className='flex-1'
                                >
                                  {isProcessingExtension ? 'Processing…' : 'Confirm Extension'}
                                </Button>
                              )}
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
                        )
                      })()}
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
          collateralSymbol={(() => {
            const loan = activeLoans.find((l) => l.id === selectedLoanIdForWithdrawal)
            return loan ? getCollateralByAddress(loan.collateralToken)?.symbol : undefined
          })()}
          isWithdrawing={isWithdrawingCollateral}
          onConfirmWithdrawal={confirmWithdrawal}
        />
      )}
    </div>
  )
}
