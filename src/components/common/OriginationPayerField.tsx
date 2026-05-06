'use client'

import { Lock, Unlock } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { formatTokenAmount } from '../../utils/decimals'
import type { DelegateValidationResult } from '../../hooks/loans/useDelegateValidation'

export interface OriginationPayerFieldProps {
  value: string
  onChange: (value: string) => void
  validation: DelegateValidationResult
  isLocked: boolean
  onToggleLock: () => void
  feeTokenSymbol: string
  feeTokenDecimals: number
  /** Optional id to associate label and input. */
  id?: string
}

const formatLmln = (amount: bigint, decimals: number) => {
  const num = Number(formatTokenAmount(amount, decimals))
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

type Tone = 'error' | 'info' | 'success' | 'muted'

const messageForState = (
  validation: DelegateValidationResult,
  feeTokenSymbol: string,
  feeTokenDecimals: number
): { text: string; tone: Tone } | null => {
  switch (validation.state) {
    case 'empty':
      return { text: 'Enter a wallet address.', tone: 'error' }
    case 'invalid-format':
      return { text: 'Not a valid wallet address.', tone: 'error' }
    case 'self':
      return { text: 'Your wallet will pay the fee.', tone: 'muted' }
    case 'loading':
      return { text: 'Checking authorization…', tone: 'info' }
    case 'not-delegated':
      return {
        text: "That wallet hasn't authorized you to use it for fees.",
        tone: 'error'
      }
    case 'valid': {
      const balance =
        validation.delegateLmlnBalance !== undefined
          ? formatLmln(validation.delegateLmlnBalance, feeTokenDecimals)
          : '—'
      return {
        text: `Authorized. Their ${feeTokenSymbol} balance: ${balance}.`,
        tone: 'success'
      }
    }
    default:
      return null
  }
}

const TONE_CLASS: Record<Tone, string> = {
  error: 'text-red-500',
  success: 'text-green-600',
  info: 'text-blue-600',
  muted: 'text-muted-foreground'
}

export function OriginationPayerField({
  value,
  onChange,
  validation,
  isLocked,
  onToggleLock,
  feeTokenSymbol,
  feeTokenDecimals,
  id = 'origination-payer'
}: OriginationPayerFieldProps) {
  // Suppress the muted "Your wallet will pay the fee." line when locked —
  // that's the default and the lock icon already conveys it.
  const message =
    isLocked && validation.isSelf
      ? null
      : messageForState(validation, feeTokenSymbol, feeTokenDecimals)

  const label =
    !isLocked && validation.state === 'valid' && !validation.isSelf
      ? 'Origination fee payer (delegator)'
      : 'Origination fee payer'

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between gap-2'>
        <Label htmlFor={id} className='text-sm'>
          {label}
        </Label>
        <button
          type='button'
          onClick={onToggleLock}
          className='inline-flex items-center gap-1 text-xs font-medium text-yellow-600 hover:text-yellow-500'
          aria-pressed={!isLocked}
          aria-label={isLocked ? 'Delegate fee — unlock to edit' : 'Lock to use connected wallet'}
        >
          {isLocked ? (
            <>
              <Lock className='h-3 w-3' />
              Delegate fee?
            </>
          ) : (
            <>
              <Unlock className='h-3 w-3' />
              Use my wallet
            </>
          )}
        </button>
      </div>
      <Input
        id={id}
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLocked}
        spellCheck={false}
        autoComplete='off'
        placeholder='0x…'
      />
      {message && (
        <p className={`text-xs ${TONE_CLASS[message.tone]}`}>{message.text}</p>
      )}
    </div>
  )
}
