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
import { Badge } from '@/src/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/hooks/use-toast'
import { formatTokenAmount, parseTokenAmount } from '@/src/utils/decimals'
import { Minus, Loader2, Clock, CheckCircle2, XCircle, ArrowDownToLine } from 'lucide-react'
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
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [fundQueueModal, setFundQueueModal] = useState(false)
  const { toast } = useToast()

  const {
    stableTokenSymbol,
    stableTokenDecimals,
    userStatus,
    feeConfig,
    requestWithdrawal,
    claimWithdrawal,
    cancelWithdrawal,
    fundWithdrawalQueue,
    withdrawalRequests,
    refetch,
  } = liquidityPool

  const decimals = stableTokenDecimals ?? 18
  const symbol = stableTokenSymbol ?? 'Token'
  const withdrawableBalance = userStatus?.unlockedPrincipal ?? 0n

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

  const insufficientBalance = useMemo(() => {
    if (!parsedAmount) return false
    return parsedAmount > withdrawableBalance
  }, [parsedAmount, withdrawableBalance])

  const withdrawalFeePct = useMemo(() => {
    if (!feeConfig || feeConfig.feeBps === 0n) return null
    return Number(feeConfig.feeBps) / 100
  }, [feeConfig])

  const handleMax = () => {
    setAmount(formattedWithdrawable)
  }

  const handleRequestWithdrawal = async () => {
    if (!parsedAmount) return
    setIsProcessing('request')
    try {
      await requestWithdrawal(parsedAmount)
      toast({
        title: 'Withdrawal Requested',
        description: `Requested withdrawal of ${amount} ${symbol}. Your shares have been burned and the request has been queued.`,
      })
      setAmount('')
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Withdrawal Request Failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleClaimWithdrawal = async (requestId: bigint) => {
    setIsProcessing(`claim-${requestId}`)
    try {
      await claimWithdrawal(requestId)
      toast({
        title: 'Withdrawal Claimed',
        description: `Successfully claimed your withdrawal.`,
      })
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Claim Failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleCancelWithdrawal = async (requestId: bigint) => {
    setIsProcessing(`cancel-${requestId}`)
    try {
      await cancelWithdrawal(requestId)
      toast({
        title: 'Withdrawal Cancelled',
        description: `Withdrawal request cancelled. Your shares have been restored.`,
      })
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Cancel Failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleFundQueue = async () => {
    setIsProcessing('fund')
    try {
      await fundWithdrawalQueue()
      toast({
        title: 'Queue Funded',
        description: `Withdrawal queue has been funded with available principal.`,
      })
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Fund Queue Failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const hasRequests = withdrawalRequests.requests.length > 0

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Minus className='h-5 w-5' />
          Remove Liquidity
        </CardTitle>
        <CardDescription>Request withdrawal from the lending pool</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col flex-1 space-y-4'>
        {/* Request Withdrawal Form */}
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
            <span>{withdrawalFeePct ? `${withdrawalFeePct}% withdrawal fee` : '\u00A0'}</span>
            <button
              onClick={handleMax}
              className='hover:text-foreground transition-colors'
            >
              Unlocked:{' '}
              {parseFloat(formattedWithdrawable).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
              {symbol}
            </button>
          </div>
        </div>

        {insufficientBalance && (
          <p className='text-sm text-destructive'>
            Insufficient unlocked balance. You can request up to{' '}
            {parseFloat(formattedWithdrawable).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
            {symbol}.
          </p>
        )}

        {withdrawalFeePct && parsedAmount && !insufficientBalance && (
          <p className='text-xs text-muted-foreground'>
            A {withdrawalFeePct}% fee applies on claim. You will receive ~{parseFloat(formatTokenAmount(parsedAmount - (parsedAmount * feeConfig!.feeBps) / 10000n, decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 })} {symbol}.
          </p>
        )}

        <Button
          onClick={handleRequestWithdrawal}
          disabled={isProcessing !== null || !parsedAmount || insufficientBalance}
          className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
        >
          {isProcessing === 'request' ? (
            <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Requesting...</>
          ) : (
            'Request Withdrawal'
          )}
        </Button>

        {/* Withdrawal Requests */}
        {hasRequests && (
          <div className='border-t pt-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-medium'>Your Requests</h4>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setFundQueueModal(true)}
                disabled={isProcessing !== null}
              >
                {isProcessing === 'fund' ? (
                  <><Loader2 className='h-3 w-3 mr-1 animate-spin' /> Funding...</>
                ) : (
                  <><ArrowDownToLine className='h-3 w-3 mr-1' /> Fund Queue</>
                )}
              </Button>
            </div>
            {withdrawalRequests.requests.map((req, idx) => {
              const requestId = withdrawalRequests.requestIds[idx]
              const isFullyFunded = req.amountFunded >= req.amount
              const isUnfunded = req.amountFunded === 0n
              const progress = req.amount > 0n
                ? Number((req.amountFunded * 10000n) / req.amount) / 100
                : 0

              return (
                <div key={requestId.toString()} className='border rounded-lg p-3 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {parseFloat(formatTokenAmount(req.amount, decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 })} {symbol}
                    </span>
                    {isFullyFunded ? (
                      <Badge variant='default' className='bg-green-600 hover:bg-green-600 text-xs cursor-default'>Ready to Claim</Badge>
                    ) : isUnfunded ? (
                      <Badge variant='secondary' className='text-xs'>
                        <Clock className='h-3 w-3 mr-1' /> Pending
                      </Badge>
                    ) : (
                      <Badge variant='secondary' className='text-xs'>
                        {progress.toFixed(1)}% Funded
                      </Badge>
                    )}
                  </div>

                  {isFullyFunded && withdrawalFeePct && (
                    <p className='text-xs text-muted-foreground'>
                      {withdrawalFeePct}% fee on claim · ~{parseFloat(formatTokenAmount(req.amount - (req.amount * feeConfig!.feeBps) / 10000n, decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 })} {symbol} net
                    </p>
                  )}

                  {/* Funding progress bar */}
                  {!isFullyFunded && (
                    <div className='w-full bg-muted rounded-full h-1.5'>
                      <div
                        className='bg-yellow-500 h-1.5 rounded-full transition-all'
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  )}

                  <div className='flex gap-2'>
                    {isFullyFunded && (
                      <Button
                        size='sm'
                        onClick={() => handleClaimWithdrawal(requestId)}
                        disabled={isProcessing !== null}
                        className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                      >
                        {isProcessing === `claim-${requestId}` ? (
                          <><Loader2 className='h-3 w-3 mr-1 animate-spin' /> Claiming...</>
                        ) : (
                          <><CheckCircle2 className='h-3 w-3 mr-1' /> Claim</>
                        )}
                      </Button>
                    )}
                    {isUnfunded && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleCancelWithdrawal(requestId)}
                        disabled={isProcessing !== null}
                        className='flex-1'
                      >
                        {isProcessing === `cancel-${requestId}` ? (
                          <><Loader2 className='h-3 w-3 mr-1 animate-spin' /> Cancelling...</>
                        ) : (
                          <><XCircle className='h-3 w-3 mr-1' /> Cancel</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Fund Queue Modal */}
      <Dialog
        open={fundQueueModal}
        onOpenChange={(open) => { if (!open) setFundQueueModal(false) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Withdrawal Queue</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <p className='text-sm text-muted-foreground'>
              Pulls available principal from the Loans contract to fund pending withdrawal requests. Requests are funded in order from oldest to newest (FIFO).
            </p>
            <p className='text-sm text-muted-foreground'>
              This is a public action that funds the queue for all users, not just your own requests.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFundQueueModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={isProcessing !== null}
              onClick={async () => {
                setFundQueueModal(false)
                await handleFundQueue()
              }}
            >
              {isProcessing === 'fund' ? (
                <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Funding...</>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
