'use client'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Plus } from 'lucide-react'
import { formatTokenAmount } from '../../utils/decimals'
import { formatUnits } from 'viem'
import { useState } from 'react'
import { DisclaimerModal } from '../common/DisclaimerModal'
import { LoanConfirmationModal } from '../common/LoanConfirmationModal'
import { loanConfigQueryOptions } from '@/src/hooks/query/loanQueries'

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
  selectedLtvOption?: { ltv: bigint; fee: bigint }
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
  isDashboard = false,
  selectedLtvOption
}: LoanSummaryProps) {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)

  const handleDisclaimerContinue = () => {
    setIsDisclaimerOpen(false)
    setIsDialogOpen(true)
  }

  const handleDisclaimerClose = () => {
    setIsDisclaimerOpen(false)
  }
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
                {tokenConfig?.nativeToken.symbol} Collateral
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                {calculation.lemonRequired > 0
                  ? `${calculation.lemonRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tokenConfig?.nativeToken.symbol}`
                  : calculation.priceError || 'Calculating...'}
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Origination Fee
              </span>
              <div className='text-right'>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''} ${hasInsufficientLmln ? 'text-red-500' : ''}`}
                >
                  {selectedLtvOption ? 
                    `$${Number(selectedLtvOption.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : 
                    '$0.00 USD'}
                </span>
                <div
                  className={`text-xs ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-0.5`}
                >
                  {calculation.originationFeeLmln?.toFixed(2) || '0'}{' '}
                  {tokenConfig?.feeToken.symbol || 'LMLN'}
                </div>
              </div>
            </div>


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
                Principle Payment
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
              <div className='text-right'>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
                >
                  {calculation.loanCycles} {calculation.loanCycles === 1 ? 'cycle' : 'cycles'}
                </span>
                {calculation.loanCycleDuration && (
                  <div
                    className={`text-xs ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-0.5`}
                  >
                    {Math.round(Number(calculation.loanCycleDuration) / (24 * 60 * 60))} day loan cycles
                  </div>
                )}
              </div>
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
            <Button
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold py-3 px-8 text-lg'
              disabled={!calculation.isValid}
              onClick={() => setIsDisclaimerOpen(true)}
            >
              <Plus className='h-4 w-4 mr-2' />
              Create New Loan
            </Button>

            <DisclaimerModal
              isOpen={isDisclaimerOpen}
              onClose={handleDisclaimerClose}
              onContinue={handleDisclaimerContinue}
            />

            <LoanConfirmationModal
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              calculation={calculation}
              tokenConfig={tokenConfig}
              operationError={operationError}
              isApprovingLoanFee={isApprovingLoanFee}
              isCreatingLoan={isCreatingLoan}
              handleCreateLoan={handleCreateLoan}
              handleApproveLoanFee={handleApproveLoanFee}
              needsApproval={needsApproval}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
