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
import { useToast } from '@/src/hooks/use-toast'
import { formatTokenAmount, parseTokenAmount } from '@/src/utils/decimals'
import { Minus, Loader2 } from 'lucide-react'
import {
  handleContractError,
  type ContractError,
} from '@/src/utils/errorHandling'
import type { UseLiquidityPoolReturn } from '@/src/hooks/liquidity/useLiquidityPool'
interface RemoveLiquidityCardProps {
  liquidityPool: UseLiquidityPoolReturn
}

export function RemoveLiquidityCard({ liquidityPool }: RemoveLiquidityCardProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const {
    stableTokenSymbol,
    stableTokenDecimals,
    userStatus,
    feeConfig,
    liquidityStatus,
    withdrawLiquidity,
    refetch,
  } = liquidityPool

  const decimals = stableTokenDecimals ?? 18
  const symbol = stableTokenSymbol ?? 'Token'
  // Show principalAvailable from Loans contract as the withdrawable amount
  const withdrawableBalance = liquidityStatus?.principalAvailable ?? userStatus?.unlockedPrincipal ?? 0n

  const parsedAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return undefined
    try {
      return parseTokenAmount(amount, decimals)
    } catch {
      return undefined
    }
  }, [amount, decimals])

  const formattedWithdrawable = useMemo(() => {
    return formatTokenAmount(withdrawableBalance, decimals)
  }, [withdrawableBalance, decimals])

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
    if (!parsedAmount) return false
    return parsedAmount > withdrawableBalance
  }, [parsedAmount, withdrawableBalance])

  const withdrawalFeePct = useMemo(() => {
    if (!feeConfig || feeConfig.withdrawalFeeBps === 0n) return null
    return Number(feeConfig.withdrawalFeeBps) / 100
  }, [feeConfig])

  const feeAmount = useMemo(() => {
    if (!parsedAmount || !feeConfig || feeConfig.withdrawalFeeBps === 0n) return null
    return (parsedAmount * feeConfig.withdrawalFeeBps) / 10000n
  }, [parsedAmount, feeConfig])

  const netReceive = useMemo(() => {
    if (!parsedAmount) return null
    if (feeAmount) return parsedAmount - feeAmount
    return parsedAmount
  }, [parsedAmount, feeAmount])

  const handleMax = () => {
    // Use exact formatted value to avoid parseFloat rounding past the actual balance
    setAmount(formattedWithdrawable)
  }

  const handleWithdraw = async () => {
    if (!parsedAmount) return
    setIsProcessing(true)
    try {
      await withdrawLiquidity(parsedAmount)
      toast({
        title: '\u2705 Withdrawal Successful',
        description: `Withdrew ${amount} ${symbol} from the liquidity pool.`,
      })
      setAmount('')
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Withdrawal Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Minus className='h-5 w-5' />
          Remove Liquidity
        </CardTitle>
        <CardDescription>Withdraw tokens from the lending pool</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col flex-1 space-y-4'>
        <div className='space-y-2'>
          <div className='relative'>
            <Input
              type='number'
              placeholder='0.00'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='pr-24'
              min='0'
              step='any'
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1'>
              <button
                type='button'
                onClick={handleMax}
                className='text-xs font-semibold text-yellow-600 hover:text-yellow-700 transition-colors'
              >
                MAX
              </button>
              <span className='text-sm font-medium text-muted-foreground'>
                {symbol}
              </span>
            </div>
          </div>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>
              {usdEquivalent && parsedAmount ? `~$${usdEquivalent} USD` : '\u00A0'}
            </span>
            <button
              onClick={handleMax}
              className='hover:text-foreground transition-colors'
            >
              Available:{' '}
              {parseFloat(formattedWithdrawable).toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
              {symbol}
            </button>
          </div>
        </div>

        <div className='flex-1'>
          {insufficientBalance && (
            <p className='text-sm text-destructive'>
              Insufficient unlocked balance. You can withdraw up to{' '}
              {parseFloat(formattedWithdrawable).toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
              {symbol}.
            </p>
          )}

          {withdrawalFeePct && parsedAmount && !insufficientBalance && (
            <p className='text-sm text-muted-foreground'>
              A {withdrawalFeePct}% withdrawal fee applies. You will receive{' '}
              {netReceive
                ? parseFloat(formatTokenAmount(netReceive, decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 })
                : '0'}{' '}
              {symbol}.
            </p>
          )}
        </div>

        <div>
        <Button
          onClick={handleWithdraw}
          disabled={isProcessing || !parsedAmount || insufficientBalance}
          className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
        >
          {isProcessing ? (
            <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Withdrawing...</>
          ) : (
            'Withdraw'
          )}
        </Button>
        </div>
      </CardContent>
    </Card>
  )
}
