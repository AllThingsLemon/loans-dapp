'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { AlertTriangle } from 'lucide-react'

interface DisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
}

export function DisclaimerModal({
  isOpen,
  onClose,
  onContinue
}: DisclaimerModalProps) {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  const handleClose = () => {
    setDisclaimerAccepted(false)
    onClose()
  }

  const handleContinue = () => {
    onContinue()
    setDisclaimerAccepted(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            Important Loan Disclaimer
          </DialogTitle>
          <DialogDescription>
            Please read and acknowledge the following terms before proceeding
            with your loan.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='text-sm text-red-800 space-y-3'>
              <p className='font-semibold'>Important Risk Disclosure</p>
              <p>
                You acknowledge that defaulting on your loan will result in the
                surrender of your collateral. Your collateral tokens will be
                forfeited if you fail to make required payments according to the
                loan terms.
              </p>
              <p>
                You are solely responsible for ensuring you can meet all payment
                obligations throughout the loan term.
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <Checkbox
              id='disclaimer-check'
              checked={disclaimerAccepted}
              onCheckedChange={(checked) =>
                setDisclaimerAccepted(checked === true)
              }
            />
            <label
              htmlFor='disclaimer-check'
              className='text-sm text-gray-700 cursor-pointer leading-5'
            >
              I have read, understood, and agree to the terms above. I
              acknowledge the risks associated with this loan and understand
              that I may lose my collateral if I default.
            </label>
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!disclaimerAccepted}
            className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
          >
            I Understand - Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
