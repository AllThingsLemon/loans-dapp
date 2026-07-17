'use client'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Plus } from 'lucide-react'
import { formatDuration } from '../../utils/format'
import { useState } from 'react'
import { DisclaimerModal } from '../common/DisclaimerModal'
import { LoanConfirmationModal } from '../common/LoanConfirmationModal'
import { OriginationPayerField } from '../common/OriginationPayerField'
import type { DelegateValidationResult } from '../../hooks/loans/useDelegateValidation'

interface LoanSummaryProps {
  calculation: any
  tokenConfig: any
  collateralSymbol?: string
  hasInsufficientLmln: boolean
  hasInsufficientCollateral: boolean
  hasInsufficientLiquidity: boolean
  userLmlnBalance: bigint | undefined
  operationError: any
  /** Decoded message when calculateLoanDetails reverts (e.g. stale price
   *  feed). Must render inline — the confirmation modal that shows
   *  operationError can never open while the calculation is failing. */
  calculationError?: string
  isApprovingCollateral: boolean
  isApprovingLoanFee: boolean
  isCreatingLoan: boolean
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  handleCreateLoan: () => Promise<void>
  handleApproveCollateral: () => Promise<void>
  handleApproveLoanFee: () => Promise<void>
  needsCollateralApproval: boolean
  needsApproval: boolean
  /** Delegate is paying the fee but their LMLN allowance is short — blocks
   *  creation with a message instead of offering a self-approval that would
   *  credit the wrong wallet. */
  delegateNeedsAllowance?: boolean
  isDashboard?: boolean
  selectedLtvOption?: { ltv: bigint; fee: bigint }
  // Origination-fee payer field (shown only in dashboard mode where the CTA exists).
  originationPayerInput: string
  onOriginationPayerChange: (value: string) => void
  isPayerLocked: boolean
  onTogglePayerLock: () => void
  payerValidation: DelegateValidationResult
  /** True when the LMLN reads/CTA target a delegate, not the connected wallet. */
  delegateInUse: boolean
  /** Native (gas-token) fee attached to initiateLoan, in wei */
  initiateNativeFee?: bigint
  /** Native currency symbol for the connected chain (e.g. TLEMX) */
  nativeSymbol?: string
}

export function LoanSummary({
  calculation,
  tokenConfig,
  collateralSymbol,
  hasInsufficientLmln,
  hasInsufficientCollateral,
  hasInsufficientLiquidity,
  userLmlnBalance,
  operationError,
  calculationError,
  isApprovingCollateral,
  isApprovingLoanFee,
  isCreatingLoan,
  isDialogOpen,
  setIsDialogOpen,
  handleCreateLoan,
  handleApproveCollateral,
  handleApproveLoanFee,
  needsCollateralApproval,
  needsApproval,
  delegateNeedsAllowance = false,
  isDashboard = false,
  selectedLtvOption,
  originationPayerInput,
  onOriginationPayerChange,
  isPayerLocked,
  onTogglePayerLock,
  payerValidation,
  delegateInUse,
  initiateNativeFee,
  nativeSymbol
}: LoanSummaryProps) {
  // Don't fall back to tokenConfig.nativeToken.symbol — that's the chain's
  // gas token (tLEMX, BNB, …), unrelated to the actual collateral the user is
  // posting. Use a neutral label until selectedCollateral resolves, and avoid
  // duplicating the word ("Collateral Collateral") when no symbol is known.
  const collateralLabel = collateralSymbol ? `${collateralSymbol} Collateral` : 'Collateral'
  const collateralUnit = collateralSymbol ?? ''
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
                {collateralLabel}
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                {calculation.lemonRequired > 0
                  ? `${calculation.lemonRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${collateralUnit ? ` ${collateralUnit}` : ''}`
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
                  className={`text-xs ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} ${hasInsufficientLmln ? 'text-red-500' : ''} mt-0.5`}
                >
                  {Number(calculation.originationFeeLmln ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
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
                {calculation.apr}%
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                {/* Labeled by the actual cycle, not "Monthly" — a 14-day
                    cycle config would understate the real monthly cost 2×. */}
                Payment per Cycle
              </span>
              <span
                className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
              >
                ${calculation.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className='flex justify-between'>
              <span
                className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                Principal Payment
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
                {calculation.loanCycleDuration ? (
                  <div
                    className={`text-xs ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-0.5`}
                  >
                    {/* formatDuration handles sub-day (testnet) cycles that
                        used to render as "0 day loan cycles". */}
                    {formatDuration(calculation.loanCycleDuration)} loan cycles
                  </div>
                ) : null}
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
          <div className='mt-6'>
            <OriginationPayerField
              value={originationPayerInput}
              onChange={onOriginationPayerChange}
              validation={payerValidation}
              isLocked={isPayerLocked}
              onToggleLock={onTogglePayerLock}
              feeTokenSymbol={tokenConfig?.feeToken.symbol || 'LMLN'}
              feeTokenDecimals={tokenConfig?.feeToken.decimals ?? 18}
            />
          </div>
        )}

        {isDashboard && (
          <div className='text-center mt-6'>
            {calculationError && (
              <p className='text-sm text-destructive mb-3'>
                {calculationError}
              </p>
            )}
            {hasInsufficientLiquidity && (
              <p className='text-sm text-destructive mb-3'>
                Not enough liquidity in the pool for this loan amount. Try a smaller amount.
              </p>
            )}
            {hasInsufficientCollateral && !hasInsufficientLiquidity && (
              <p className='text-sm text-destructive mb-3'>
                You don&apos;t have enough {collateralSymbol || 'collateral'} in your wallet to back this loan.
              </p>
            )}
            {/* userLmlnBalance is the fee payer's balance (delegate or borrower).
             *  When a delegate is in use but not yet authorized, the field's
             *  own "not authorized" message is the actionable one — suppress
             *  the balance warning until the auth check passes so the user
             *  isn't shown two errors at once. */}
            {hasInsufficientLmln &&
              !hasInsufficientLiquidity &&
              (!delegateInUse || payerValidation.isValid) && (
                <p className='text-sm text-destructive mb-3'>
                  {delegateInUse
                    ? `The chosen delegate doesn't have enough ${tokenConfig?.feeToken.symbol || 'LMLN'} to cover the fee.`
                    : `You don't have enough ${tokenConfig?.feeToken.symbol || 'LMLN'} to cover the fee.`}
                </p>
              )}
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
              collateralSymbol={collateralSymbol}
              operationError={operationError}
              isApprovingCollateral={isApprovingCollateral}
              isApprovingLoanFee={isApprovingLoanFee}
              isCreatingLoan={isCreatingLoan}
              handleCreateLoan={handleCreateLoan}
              handleApproveCollateral={handleApproveCollateral}
              handleApproveLoanFee={handleApproveLoanFee}
              needsCollateralApproval={needsCollateralApproval}
              needsApproval={needsApproval}
              delegateNeedsAllowance={delegateNeedsAllowance}
              nativeFee={initiateNativeFee}
              nativeSymbol={nativeSymbol}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
