'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { formatEther } from 'viem'
import { extractErrorMessage } from '../../utils/errorHandling'

interface LoanConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  calculation: any
  tokenConfig: any
  collateralSymbol?: string
  operationError: any
  isApprovingCollateral: boolean
  isApprovingLoanFee: boolean
  isCreatingLoan: boolean
  handleCreateLoan: () => Promise<void>
  handleApproveCollateral: () => Promise<void>
  handleApproveLoanFee: () => Promise<void>
  needsCollateralApproval: boolean
  needsApproval: boolean
  /** Native (gas-token) fee attached to initiateLoan, in wei */
  nativeFee?: bigint
  /** Native currency symbol for the connected chain (e.g. TLEMX) */
  nativeSymbol?: string
}

export function LoanConfirmationModal({
  isOpen,
  onClose,
  calculation,
  tokenConfig,
  collateralSymbol,
  operationError,
  isApprovingCollateral,
  isApprovingLoanFee,
  isCreatingLoan,
  handleCreateLoan,
  handleApproveCollateral,
  handleApproveLoanFee,
  needsCollateralApproval,
  needsApproval,
  nativeFee,
  nativeSymbol
}: LoanConfirmationModalProps) {
  const collateral = collateralSymbol || 'Collateral'
  const isBusy = isApprovingCollateral || isApprovingLoanFee || isCreatingLoan

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Don't let ESC / outside-click dismiss the modal mid-transaction —
        // the user would lose all progress context while the tx is pending.
        if (!open && !isBusy) onClose()
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-yellow-600' />
            Confirm Loan Creation
          </DialogTitle>
          <DialogDescription>
            Please review your loan details before proceeding. This transaction
            will require your approval.
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
              <span className='font-medium'>APR:</span>
              <span>{Math.round(calculation.apr)}%</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Collateral Required:</span>
              <span>
                {calculation.lemonRequired.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{' '}
                {collateral}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Origination Fee:</span>
              <span>
                {Number(calculation.originationFeeLmln ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                {tokenConfig?.feeToken.symbol || 'Token'}
              </span>
            </div>
            {nativeFee !== undefined && nativeFee > 0n && (
              <div className='flex justify-between'>
                <span className='font-medium'>Network Fee:</span>
                <span>
                  {Number(formatEther(nativeFee)).toLocaleString('en-US', {
                    maximumFractionDigits: 4
                  })}{' '}
                  {nativeSymbol || 'native token'}
                </span>
              </div>
            )}
          </div>

          {/* Always visible so the user keeps their bearings after the
              approvals land — completed steps get a check mark, the active
              step is highlighted, upcoming steps are dimmed. */}
          <div className='text-xs text-muted-foreground bg-muted rounded p-3 space-y-1'>
            <p className='font-medium'>Loan creation steps:</p>
            {(() => {
              const steps = [
                {
                  label: `1. Approve ${collateral} for collateral`,
                  done: !needsCollateralApproval
                },
                {
                  label: `2. Approve ${tokenConfig?.feeToken.symbol || 'LMLN'} origination fee`,
                  done: !needsApproval
                },
                { label: '3. Create loan', done: false }
              ]
              const activeIndex = steps.findIndex((s) => !s.done)
              return steps.map((step, i) => (
                <p
                  key={step.label}
                  className={`flex items-center gap-1.5 ${
                    step.done
                      ? ''
                      : i === activeIndex
                        ? 'text-foreground font-medium'
                        : 'opacity-50'
                  }`}
                >
                  {step.done && (
                    <CheckCircle2 className='h-3.5 w-3.5 text-green-600 shrink-0' />
                  )}
                  {step.label}
                </p>
              ))
            })()}
          </div>

          {operationError && (
            <div className='text-red-600 text-sm p-2 bg-red-50 rounded'>
              {extractErrorMessage(operationError)}
            </div>
          )}
        </div>

        <DialogFooter className='flex gap-2'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          {needsCollateralApproval ? (
            <Button
              onClick={handleApproveCollateral}
              disabled={isBusy || !calculation.isValid}
              className='bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
            >
              {isApprovingCollateral ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Approving…</>) : (`Approve ${collateral}`)}
            </Button>
          ) : needsApproval ? (
            <Button
              onClick={handleApproveLoanFee}
              disabled={isBusy || !calculation.isValid}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
            >
              {isApprovingLoanFee ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Approving…</>) : (`Approve ${tokenConfig?.feeToken.symbol || 'LMLN'} Fee`)}
            </Button>
          ) : (
            <Button
              onClick={handleCreateLoan}
              disabled={isBusy || !calculation.isValid}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
            >
              {isCreatingLoan ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Creating Loan…</>) : ('Confirm & Create Loan')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
