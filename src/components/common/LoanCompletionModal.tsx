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
import { CheckCircle, Trophy } from 'lucide-react'
import { formatAmountWithSymbol } from '../../utils/format'

interface LoanCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  loan: any
  tokenConfig: any
  isWithdrawing: boolean
  onConfirmWithdrawal: () => Promise<void>
}

export function LoanCompletionModal({
  isOpen,
  onClose,
  loan,
  tokenConfig,
  isWithdrawing,
  onConfirmWithdrawal
}: LoanCompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3 text-xl'>
            <Trophy className='h-6 w-6 text-yellow-500' />
            Congratulations!
          </DialogTitle>
          <DialogDescription>
            You have successfully completed all payments on your loan. Your
            collateral is now ready to be withdrawn.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <span className='font-semibold text-green-800'>
                Loan Completed
              </span>
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-green-700'>Original Loan Amount:</span>
                <span className='font-medium text-green-800'>
                  {formatAmountWithSymbol(
                    loan.loanAmount,
                    tokenConfig?.loanToken.symbol || 'Token'
                  )}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-green-700'>Total Amount Paid:</span>
                <span className='font-medium text-green-800'>
                  {formatAmountWithSymbol(
                    loan.paidAmount,
                    tokenConfig?.loanToken.symbol || 'Token'
                  )}
                </span>
              </div>
              <div className='flex justify-between pt-2 border-t border-green-200'>
                <span className='text-green-700'>Collateral to Withdraw:</span>
                <span className='font-semibold text-green-800'>
                  {formatAmountWithSymbol(
                    loan.collateralAmount,
                    tokenConfig?.nativeToken.symbol || 'Token'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className='text-center text-sm text-muted-foreground'>
            <p>
              🎉 Well done! Your collateral will be returned to your wallet once
              you confirm the withdrawal.
            </p>
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isWithdrawing}>
            Cancel
          </Button>
          <Button
            onClick={onConfirmWithdrawal}
            disabled={isWithdrawing}
            className='bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white'
          >
            {isWithdrawing ? 'Withdrawing...' : 'Confirm & Withdraw Collateral'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
