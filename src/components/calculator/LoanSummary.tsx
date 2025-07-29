'use client'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import { AlertTriangle, Plus } from 'lucide-react'
import { formatTokenAmount } from '../../utils/decimals'

interface LoanSummaryProps {
  calculation: any
  tokenConfig: any
  hasInsufficientLmln: boolean
  userLmlnBalance: bigint | undefined
  operationError: any
  isApprovingLoanFee: boolean
  isCreatingLoan: boolean
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  handleCreateLoan: () => Promise<void>
  handleApproveLoanFee: () => Promise<void>
  needsApproval: boolean
  isDashboard?: boolean
}

export function LoanSummary({
  calculation,
  tokenConfig,
  hasInsufficientLmln,
  userLmlnBalance,
  operationError,
  isApprovingLoanFee,
  isCreatingLoan,
  isDialogOpen,
  setIsDialogOpen,
  handleCreateLoan,
  handleApproveLoanFee,
  needsApproval,
  isDashboard = false
}: LoanSummaryProps) {
  return (
    <Card
      className={`${!isDashboard ? 'animate-scale-in bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-700 text-white' : ''}`}
    >
      <CardHeader>
        <CardTitle className={`${!isDashboard ? 'text-2xl text-white' : ''}`}>
          Loan Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div
          className={`${!isDashboard ? 'bg-white/10 backdrop-blur-sm' : 'bg-muted'} rounded-lg p-4 border ${!isDashboard ? 'border-white/20' : ''}`}
        >
          <div className='flex justify-between items-center mb-4'>
            <span
              className={`text-lg font-semibold ${!isDashboard ? 'text-gray-300' : ''}`}
            >
              Loan Amount
            </span>
            <span
              className={`text-2xl font-bold ${!isDashboard ? 'text-white' : ''}`}
            >
              ${calculation.loanAmount.toLocaleString()}{' '}
              {tokenConfig?.loanToken.symbol || 'Token'}
            </span>
          </div>

          <div className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                LEMON Required
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                {calculation.lemonRequired > 0
                  ? `${calculation.lemonRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LEMON`
                  : calculation.priceError || 'Calculating...'}
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Origination Fee - payable in{' '}
                {tokenConfig?.feeToken.symbol || 'Token'}
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''} ${hasInsufficientLmln ? 'text-red-500' : ''}`}
              >
                {calculation.originationFeeLmln?.toFixed(2) || '0'}{' '}
                {tokenConfig?.feeToken.symbol || 'Token'}
                {hasInsufficientLmln && ' ⚠️'}
              </span>
            </div>

            {hasInsufficientLmln && (
              <div className='text-red-500 text-xs mt-1'>
                Balance:{' '}
                {userLmlnBalance && tokenConfig
                  ? Number(
                      formatTokenAmount(
                        userLmlnBalance,
                        tokenConfig.feeToken.decimals
                      )
                    ).toFixed(2)
                  : '0'}{' '}
                {tokenConfig?.feeToken.symbol || 'Token'}
              </div>
            )}

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                LTV Ratio
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-yellow-400' : 'text-yellow-600'}`}
              >
                {calculation.ltv}%
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Estimated APR
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-yellow-400' : 'text-yellow-600'}`}
              >
                {calculation.apr.toFixed(1)}%
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Monthly Payment
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                ${calculation.monthlyPayment.toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Balloon Payment
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                $
                {calculation.balloonPayment.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Loan Term
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                {calculation.durationDisplay}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`text-center text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
        >
          ✓ No credit check required • ✓ Instant approval
        </div>

        {isDashboard && (
          <div className='text-center mt-6'>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold py-3 px-8 text-lg'
                  disabled={!calculation.isValid}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Create New Loan
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-yellow-600' />
                    Confirm Loan Creation
                  </DialogTitle>
                  <DialogDescription>
                    Please review your loan details before proceeding. This
                    transaction will require your approval.
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Loan Amount:</span>
                      <span>
                        ${calculation.loanAmount.toLocaleString()}{' '}
                        {tokenConfig?.loanToken.symbol || 'Token'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Loan Term:</span>
                      <span>{calculation.durationDisplay}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='font-medium'>LTV Ratio:</span>
                      <span>{calculation.ltv}%</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Estimated APR:</span>
                      <span>{calculation.apr.toFixed(1)}%</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Collateral Required:</span>
                      <span>
                        {calculation.lemonRequired.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        LEMON
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Origination Fee:</span>
                      <span>
                        {calculation.originationFeeLmln?.toFixed(2) || '0'}{' '}
                        {tokenConfig?.feeToken.symbol || 'Token'}
                      </span>
                    </div>
                  </div>

                  {operationError && (
                    <div className='text-red-600 text-sm p-2 bg-red-50 rounded'>
                      {operationError.message}
                    </div>
                  )}
                </div>

                <DialogFooter className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isApprovingLoanFee || isCreatingLoan}
                  >
                    Cancel
                  </Button>
                  {needsApproval ? (
                    <Button
                      onClick={handleApproveLoanFee}
                      disabled={
                        isApprovingLoanFee ||
                        isCreatingLoan ||
                        !calculation.isValid
                      }
                      className='bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                    >
                      {isApprovingLoanFee ? 'Approving...' : 'Approve LMLN Fee'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreateLoan}
                      disabled={
                        isApprovingLoanFee ||
                        isCreatingLoan ||
                        !calculation.isValid
                      }
                      className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
                    >
                      {isCreatingLoan
                        ? 'Creating Loan...'
                        : 'Confirm & Create Loan'}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
