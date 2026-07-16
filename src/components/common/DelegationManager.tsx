'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HandCoins,
  Loader2
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useToast } from '../../hooks/use-toast'
import { useDelegationManager } from '../../hooks/loans/useDelegationManager'
import { truncateAddress } from '../../utils/format'
import {
  handleContractError,
  isUserRejection,
  type ContractError
} from '../../utils/errorHandling'

type Tone = 'error' | 'info' | 'success' | 'muted'

const TONE_CLASS: Record<Tone, string> = {
  error: 'text-red-500',
  success: 'text-green-600',
  info: 'text-blue-600',
  muted: 'text-muted-foreground'
}

/**
 * Collapsible "Become a delegator" section.
 *
 * The card hosts a borrower-address input and a Delegate / Revoke button
 * that flips based on the on-chain status. Clicking the button opens a
 * confirmation modal containing the risk/revoke disclosure plus the wallet
 * step indicators — that's where the actual transactions are dispatched.
 */
export function DelegationManager() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [borrowerInput, setBorrowerInput] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const {
    state,
    normalizedBorrower,
    delegate,
    revoke,
    isProcessing,
    isApprovingLmln,
    isWritingDelegation,
    hasMaxLmlnAllowance
  } = useDelegationManager(borrowerInput)

  const isRevokeFlow = state === 'delegated'

  const onConfirmDelegate = async () => {
    if (!normalizedBorrower) return
    try {
      await delegate(normalizedBorrower)
      toast({
        title: '✅ Delegation set up',
        description: "You'll now pay origination fees for this borrower."
      })
      setIsConfirmOpen(false)
    } catch (err) {
      const e = err as ContractError
      if (isUserRejection(e)) {
        // User cancelled in their wallet — keep the modal open so they can
        // try again without retyping the borrower address.
        return
      }
      handleContractError(e, toast, "Couldn't delegate")
      setIsConfirmOpen(false)
    }
  }

  const onConfirmRevoke = async () => {
    if (!normalizedBorrower) return
    try {
      await revoke(normalizedBorrower)
      toast({
        title: 'Delegation revoked',
        description: "You'll no longer pay fees for this borrower."
      })
      setIsConfirmOpen(false)
    } catch (err) {
      const e = err as ContractError
      if (isUserRejection(e)) return
      handleContractError(e, toast, "Couldn't revoke")
      setIsConfirmOpen(false)
    }
  }

  if (!address) return null

  let helperMessage: { text: string; tone: Tone } | null = null
  if (state === 'invalid-format') {
    helperMessage = { text: 'Not a valid wallet address.', tone: 'error' }
  } else if (state === 'self') {
    helperMessage = { text: "You can't delegate to yourself.", tone: 'error' }
  } else if (state === 'loading') {
    helperMessage = { text: 'Checking…', tone: 'info' }
  } else if (state === 'delegated') {
    helperMessage = {
      text: "You're authorized to pay this borrower's fees.",
      tone: 'success'
    }
  } else if (state === 'not-delegated') {
    helperMessage = {
      text: 'Click Delegate to authorize yourself for this borrower.',
      tone: 'muted'
    }
  }

  const canSubmit = state === 'delegated' || state === 'not-delegated'
  const primaryLabel = isRevokeFlow ? 'Revoke Delegation' : 'Delegate'

  const stepLabel = isApprovingLmln
    ? 'Approving LMLN…'
    : isWritingDelegation
    ? isRevokeFlow
      ? 'Revoking…'
      : 'Authorizing…'
    : null

  return (
    <>
      <Card className='mt-6'>
        <CardContent className='p-0'>
          <button
            type='button'
            onClick={() => setIsOpen((prev) => !prev)}
            className='w-full flex items-center justify-between px-4 py-3 text-left'
            aria-expanded={isOpen}
          >
            <span className='flex items-center gap-2 text-sm font-medium'>
              <HandCoins className='h-4 w-4 text-muted-foreground' />
              Become a delegator
              <span className='text-xs font-normal text-muted-foreground'>
                · Pay origination fees on behalf of another wallet
              </span>
            </span>
            {isOpen ? (
              <ChevronUp className='h-4 w-4 text-muted-foreground' />
            ) : (
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            )}
          </button>

          {isOpen && (
            <div className='border-t px-4 py-4 space-y-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='delegation-borrower' className='text-sm'>
                  Borrower wallet to delegate for
                </Label>
                <Input
                  id='delegation-borrower'
                  type='text'
                  value={borrowerInput}
                  onChange={(e) => setBorrowerInput(e.target.value)}
                  placeholder='0x…'
                  spellCheck={false}
                  autoComplete='off'
                  disabled={isProcessing}
                />
                {helperMessage && (
                  <p className={`text-xs ${TONE_CLASS[helperMessage.tone]}`}>
                    {helperMessage.text}
                  </p>
                )}
              </div>

              <div>
                <Button
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={!canSubmit || isProcessing}
                  variant={isRevokeFlow ? 'destructive' : 'default'}
                >
                  {primaryLabel}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          // Block closing while a tx is mid-flight so the user can't dismiss
          // a wallet popup that's already prompted.
          if (!open && isProcessing) return
          setIsConfirmOpen(open)
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {isRevokeFlow ? 'Revoke delegation' : 'Confirm delegation'}
            </DialogTitle>
            <DialogDescription>
              {isRevokeFlow
                ? 'Stop paying origination fees for this borrower.'
                : 'Authorize yourself to pay this borrower’s origination fees.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Address summary */}
            <div className='rounded-md border bg-muted p-3 text-sm'>
              <p className='text-xs text-muted-foreground mb-1'>
                Borrower wallet
              </p>
              <p className='font-mono break-all'>
                {normalizedBorrower
                  ? `${normalizedBorrower.slice(0, 6)}…${normalizedBorrower.slice(-4)}`
                  : truncateAddress(borrowerInput)}
              </p>
            </div>

            {/* Disclosure / explanation */}
            {isRevokeFlow ? (
              <div className='flex gap-2 rounded-md border bg-muted p-3'>
                <AlertTriangle className='h-4 w-4 text-muted-foreground shrink-0 mt-0.5' />
                <div className='text-xs text-muted-foreground space-y-1'>
                  <p>
                    Revoking stops your LMLN from paying this borrower&apos;s
                    origination fees. They can still take out loans, but
                    they&apos;ll need to pay the fee themselves or set up a
                    new delegator.
                  </p>
                  <p>You can re-delegate later if you change your mind.</p>
                </div>
              </div>
            ) : (
              <div className='flex gap-2 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3'>
                <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                <div className='text-xs text-amber-900 dark:text-amber-200 space-y-1'>
                  <p>
                    After you delegate, this borrower can take out or extend
                    loans, and your LMLN pays the fee each time without an
                    extra wallet prompt.
                  </p>
                  <p>You can revoke any time.</p>
                  {!hasMaxLmlnAllowance && (
                    <p className='font-medium'>
                      First-time setup includes a one-time max LMLN approval.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Active-step copy while transactions run */}
            {stepLabel && (
              <p className='text-xs text-muted-foreground'>
                {isApprovingLmln
                  ? 'Confirm the approval in your wallet — a second prompt will follow to record the delegation.'
                  : 'Confirm the transaction in your wallet.'}
              </p>
            )}
          </div>

          <DialogFooter className='gap-2 sm:gap-2'>
            <Button
              variant='outline'
              onClick={() => setIsConfirmOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={isRevokeFlow ? onConfirmRevoke : onConfirmDelegate}
              disabled={!canSubmit || isProcessing}
              variant={isRevokeFlow ? 'destructive' : 'default'}
            >
              {isProcessing ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' /> {stepLabel ?? 'Processing…'}</>) : (stepLabel ?? (isRevokeFlow ? 'Confirm Revoke' : 'Confirm Delegate'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
