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
import { AlertTriangle } from 'lucide-react'

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
  needsApproval
}: LoanConfirmationModalProps) {
  const collateral = collateralSymbol || 'Collateral'
  const isBusy = isApprovingCollateral || isApprovingLoanFee || isCreatingLoan

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <span>{calculation.apr.toFixed(1)}%</span>
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
          </div>

          {(needsCollateralApproval || needsApproval) && (
            <div className='text-xs text-muted-foreground bg-muted rounded p-3 space-y-1'>
              <p className='font-medium'>Approval steps required:</p>
              <p className={needsCollateralApproval ? 'text-foreground' : 'line-through opacity-50'}>
                1. Approve {collateral} for collateral
              </p>
              <p className={needsApproval ? 'text-foreground' : 'line-through opacity-50'}>
                2. Approve {tokenConfig?.feeToken.symbol || 'LMLN'} origination fee
              </p>
              <p className='opacity-50'>3. Create loan</p>
            </div>
          )}

          {operationError && (
            <div className='text-red-600 text-sm p-2 bg-red-50 rounded'>
              {operationError.message}
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
              {isApprovingCollateral ? 'Approving...' : `Approve ${collateral}`}
            </Button>
          ) : needsApproval ? (
            <Button
              onClick={handleApproveLoanFee}
              disabled={isBusy || !calculation.isValid}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
            >
              {isApprovingLoanFee ? 'Approving...' : `Approve ${tokenConfig?.feeToken.symbol || 'LMLN'} Fee`}
            </Button>
          ) : (
            <Button
              onClick={handleCreateLoan}
              disabled={isBusy || !calculation.isValid}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
            >
              {isCreatingLoan ? 'Creating Loan...' : 'Confirm & Create Loan'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
