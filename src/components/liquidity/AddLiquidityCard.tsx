'use client'
import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/hooks/use-toast'
import { formatTokenAmount, parseTokenAmount } from '@/src/utils/decimals'
import { Plus, Loader2 } from 'lucide-react'
import {
  handleContractError,
  type ContractError,
} from '@/src/utils/errorHandling'
import type { UseLiquidityPoolReturn } from '@/src/hooks/liquidity/useLiquidityPool'
import type { PriceData } from '@/src/hooks/usePricing'

interface AddLiquidityCardProps {
  liquidityPool: UseLiquidityPoolReturn
  pricing: PriceData
}

export function AddLiquidityCard({ liquidityPool, pricing }: AddLiquidityCardProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isNonEarning, setIsNonEarning] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { toast } = useToast()

  const {
    stableTokenSymbol,
    stableTokenDecimals,
    stableTokenAddress,
    userTokenBalance,
    currentAllowance,
    liquidityPoolContractAddress,
    approveToken,
    depositLiquidity,
    depositNonEarningLiquidity,
    lockDuration,
    refetch,
  } = liquidityPool

  const decimals = stableTokenDecimals ?? 18
  const symbol = stableTokenSymbol ?? 'Token'
  const lockDurationLabel = useMemo(() => {
    if (!lockDuration) return 'the lock period'
    const s = Number(lockDuration)
    const years = Math.floor(s / (365.25 * 24 * 3600))
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
    const days = Math.floor(s / 86400)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    const hours = Math.floor(s / 3600)
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    const minutes = Math.floor(s / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }, [lockDuration])

  const parsedAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return undefined
    try {
      return parseTokenAmount(amount, decimals)
    } catch {
      return undefined
    }
  }, [amount, decimals])

  const formattedBalance = useMemo(() => {
    if (userTokenBalance === undefined) return undefined
    return formatTokenAmount(userTokenBalance, decimals)
  }, [userTokenBalance, decimals])

  const usdEquivalent = useMemo(() => {
    if (!parsedAmount) return undefined
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) return undefined
    return numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [parsedAmount, amount])

  const insufficientBalance = useMemo(() => {
    if (!parsedAmount || userTokenBalance === undefined) return false
    return parsedAmount > userTokenBalance
  }, [parsedAmount, userTokenBalance])

  const needsApproval = useMemo(() => {
    if (!parsedAmount) return false
    // If allowance is not loaded yet, assume approval is needed (safe default)
    if (currentAllowance === undefined) return true
    return currentAllowance < parsedAmount
  }, [parsedAmount, currentAllowance])

  const handleApprove = async () => {
    if (!parsedAmount || !stableTokenAddress || !liquidityPoolContractAddress) return
    setIsProcessing(true)
    try {
      const approvalAmount = parsedAmount + (parsedAmount / 10n) // 10% buffer
      await approveToken(approvalAmount, stableTokenAddress, liquidityPoolContractAddress)
      toast({
        title: '\u2705 Approval Successful',
        description: `Approved ${amount} ${symbol}. You can now deposit this amount.`,
      })
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Approval Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDepositClick = () => {
    if (!parsedAmount) return
    setShowConfirmDialog(true)
  }

  const handleConfirmDeposit = async () => {
    if (!parsedAmount) return
    setShowConfirmDialog(false)
    setIsProcessing(true)
    try {
      if (isNonEarning) {
        await depositNonEarningLiquidity(parsedAmount)
        toast({
          title: '\u2705 Deposit Successful',
          description: `Deposited ${amount} ${symbol} as non-earning liquidity.`,
        })
      } else {
        await depositLiquidity(parsedAmount)
        toast({
          title: '\u2705 Deposit Successful',
          description: `Deposited ${amount} ${symbol} into the liquidity pool.`,
        })
      }
      setAmount('')
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Deposit Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Plus className='h-5 w-5' />
          Add Liquidity
        </CardTitle>
        <CardDescription>Deposit tokens into the lending pool</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col flex-1 space-y-4'>
        <div className='space-y-2'>
          <div className='relative'>
            <Input
              type='number'
              placeholder='0.00'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='pr-16'
              min='0'
              step='any'
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground'>
              {symbol}
            </span>
          </div>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>
              {usdEquivalent && parsedAmount ? `~$${usdEquivalent} USD` : '\u00A0'}
            </span>
            <span>
              Balance:{' '}
              {formattedBalance
                ? `${parseFloat(formattedBalance).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`
                : 'Loading...'}
            </span>
          </div>
        </div>

        <label className='flex items-center gap-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={isNonEarning}
            onChange={(e) => setIsNonEarning(e.target.checked)}
            className='h-3.5 w-3.5 rounded border-border accent-yellow-500'
          />
          <span className={`text-xs ${isNonEarning ? 'text-destructive' : 'text-muted-foreground'}`}>
            Deposit as non-earning{isNonEarning && ' — will not earn interest from borrower payments'}
          </span>
        </label>

        <div className='flex-1'>
          {insufficientBalance && (
            <p className='text-sm text-destructive'>
              Insufficient balance. You need {amount} {symbol} but only have{' '}
              {formattedBalance ? parseFloat(formattedBalance).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '0'}{' '}
              {symbol}.
            </p>
          )}
        </div>

        <div>
        {needsApproval && parsedAmount && !insufficientBalance ? (
          <Button
            onClick={handleApprove}
            disabled={isProcessing || !parsedAmount}
            className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
          >
            {isProcessing ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Approving...</>
            ) : (
              `Approve ${symbol}`
            )}
          </Button>
        ) : (
          <Button
            onClick={handleDepositClick}
            disabled={isProcessing || !parsedAmount || insufficientBalance}
            className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
          >
            {isProcessing ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Depositing...</>
            ) : (
              'Deposit'
            )}
          </Button>
        )}
        </div>
      </CardContent>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deposit</DialogTitle>
            <DialogDescription>
              You are about to deposit {amount} {symbol} into the liquidity pool.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <p className='text-sm text-muted-foreground'>
              Your deposit will be locked for <span className='font-semibold text-foreground'>{lockDurationLabel}</span>.
              You will not be able to withdraw during this period.
            </p>
            {isNonEarning && (
              <p className='text-sm text-destructive font-medium'>
                This is a non-earning deposit. You will not earn interest from borrower payments on this deposit.
              </p>
            )}
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeposit}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
            >
              Confirm Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
