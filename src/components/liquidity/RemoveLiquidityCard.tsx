'use client'
import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/hooks/use-toast'
import { DetailRow } from '@/src/components/liquidity/DetailRow'
import { formatTokenAmount, parseTokenAmount } from '@/src/utils/decimals'
import { floorToDecimals } from '@/src/utils/format'
import {
  Minus,
  Loader2,
  Clock,
  CheckCircle2,
  ArrowDownToLine
} from 'lucide-react'
import {
  handleContractError,
  type ContractError
} from '@/src/utils/errorHandling'
import type { UseLiquidityPoolReturn } from '@/src/hooks/liquidity/useLiquidityPool'

interface RemoveLiquidityCardProps {
  liquidityPool: UseLiquidityPoolReturn
}

export function RemoveLiquidityCard({
  liquidityPool
}: RemoveLiquidityCardProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [fundQueueModal, setFundQueueModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [claimModal, setClaimModal] = useState<{
    open: boolean
    requestId: bigint | null
    amount: bigint
  }>({ open: false, requestId: null, amount: 0n })
  const { toast } = useToast()
  const { chain } = useAccount()
  const nativeCurrencySymbol = chain?.nativeCurrency.symbol ?? 'native token'

  const {
    stableTokenSymbol,
    stableTokenDecimals,
    userStatus,
    feeConfig,
    minimumWithdrawalValue,
    requestWithdrawal,
    claimWithdrawal,
    fundWithdrawalQueue,
    withdrawNativeFee,
    withdrawalRequests,
    refetch
  } = liquidityPool

  const decimals = stableTokenDecimals ?? 18
  const symbol = stableTokenSymbol ?? 'Token'
  const withdrawableBalance = userStatus?.unlockedPrincipal ?? 0n

  const parsedAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return undefined
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

  // Contract-enforced minimum (BelowMinimumWithdrawal). A full-balance
  // withdrawal is deliberately NOT blocked here even when it's below the
  // minimum — if the contract allows full exits the block would strand small
  // accounts, and if it doesn't the revert maps to a clear error message.
  // "Full" is matched to display precision, not exact wei: the balance shown
  // to the user is floored to 2 decimals, so typing that figure must count —
  // exact equality would make the MAX button the only way to take the
  // exemption this card's own message advertises.
  const fullWithdrawalFloorWei =
    decimals >= 2
      ? (withdrawableBalance / 10n ** BigInt(decimals - 2)) *
        10n ** BigInt(decimals - 2)
      : withdrawableBalance
  const isFullWithdrawal =
    parsedAmount !== undefined &&
    parsedAmount >= fullWithdrawalFloorWei &&
    parsedAmount <= withdrawableBalance
  const belowMinimumWithdrawal = useMemo(() => {
    if (!parsedAmount || !minimumWithdrawalValue) return false
    return parsedAmount < minimumWithdrawalValue
  }, [parsedAmount, minimumWithdrawalValue])
  const blockedByMinimum = belowMinimumWithdrawal && !isFullWithdrawal

  const minimumWithdrawalDisplay = useMemo(() => {
    if (!minimumWithdrawalValue) return null
    return parseFloat(
      formatTokenAmount(minimumWithdrawalValue, decimals)
    ).toLocaleString('en-US', { maximumFractionDigits: 2 })
  }, [minimumWithdrawalValue, decimals])

  const withdrawalFeePct = useMemo(() => {
    if (!feeConfig || feeConfig.feeBps === 0n) return null
    return Number(feeConfig.feeBps) / 100
  }, [feeConfig])

  const handleMax = () => {
    setAmount(formattedWithdrawable)
  }

  const handleRequestClick = () => {
    if (!parsedAmount || insufficientBalance || blockedByMinimum) return
    setShowConfirmDialog(true)
  }

  // Standard modal contract (all confirm modals in the app): the modal stays
  // OPEN while the transaction runs — spinner on the confirm button, cancel
  // disabled, dismissal blocked — and closes only on success.
  const handleConfirmWithdrawal = async () => {
    if (!parsedAmount) return
    setIsProcessing('request')
    try {
      await requestWithdrawal(parsedAmount)
      toast({
        title: 'Withdrawal Requested',
        description: `Requested withdrawal of ${amount} ${symbol}. Your shares have been burned and the request has been queued.`
      })
      setAmount('')
      setShowConfirmDialog(false)
      // Fire-and-forget — scheduleRefresh covers a full refresh moments later.
      void refetch()
    } catch (err: unknown) {
      handleContractError(
        err as ContractError,
        toast,
        'Withdrawal Request Failed'
      )
    } finally {
      setIsProcessing(null)
    }
  }

  /** The fee itself, so the dialog can show it as its own line. */
  const feeAmountDisplay = useMemo(() => {
    if (!withdrawalFeePct || !parsedAmount || !feeConfig) return undefined
    const fee = (parsedAmount * feeConfig.feeBps) / 10000n
    return parseFloat(formatTokenAmount(fee, decimals)).toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  }, [withdrawalFeePct, parsedAmount, feeConfig, decimals])

  const netReceiveDisplay = useMemo(() => {
    if (!withdrawalFeePct || !parsedAmount || !feeConfig) return undefined
    const net = parsedAmount - (parsedAmount * feeConfig.feeBps) / 10000n
    // Floor — never overstate what the user will receive.
    return floorToDecimals(
      parseFloat(formatTokenAmount(net, decimals)),
      2
    ).toLocaleString('en-US', {
      maximumFractionDigits: 2
    })
  }, [withdrawalFeePct, parsedAmount, feeConfig, decimals])

  // Net amount for the claim confirm modal (requested − protocol fee), floored.
  const claimNetDisplay = useMemo(() => {
    if (claimModal.amount === 0n) return '0'
    const net = feeConfig
      ? claimModal.amount - (claimModal.amount * feeConfig.feeBps) / 10000n
      : claimModal.amount
    return floorToDecimals(
      parseFloat(formatTokenAmount(net, decimals)),
      2
    ).toLocaleString('en-US', { maximumFractionDigits: 2 })
  }, [claimModal.amount, feeConfig, decimals])

  const claimFeeDisplay = useMemo(() => {
    if (claimModal.amount === 0n || !feeConfig || feeConfig.feeBps === 0n)
      return undefined
    const fee = (claimModal.amount * feeConfig.feeBps) / 10000n
    return parseFloat(formatTokenAmount(fee, decimals)).toLocaleString(
      'en-US',
      { maximumFractionDigits: 4 }
    )
  }, [claimModal.amount, feeConfig, decimals])

  const handleConfirmClaim = async () => {
    if (claimModal.requestId === null) return
    setIsProcessing(`claim-${claimModal.requestId}`)
    try {
      await claimWithdrawal(claimModal.requestId)
      toast({
        title: 'Withdrawal Claimed',
        description: `${claimNetDisplay} ${symbol} sent to your wallet.`
      })
      setClaimModal({ open: false, requestId: null, amount: 0n })
      void refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Claim Failed')
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
        description: `Withdrawal queue has been funded with available principal.`
      })
      setFundQueueModal(false)
      void refetch()
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
        <CardDescription>
          Request withdrawal from the lending pool
        </CardDescription>
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
              // An amount typed (or MAX clicked) before the stable token's
              // decimals resolve would parse at the 18-decimal fallback —
              // wrong raw amount on a 6-decimal token. Hold until it lands.
              disabled={stableTokenDecimals === undefined}
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1'>
              <button
                type='button'
                onClick={handleMax}
                disabled={stableTokenDecimals === undefined}
                className='text-xs font-semibold text-yellow-600 hover:text-yellow-700 transition-colors disabled:opacity-50'
              >
                MAX
              </button>
              <span className='text-sm font-medium text-muted-foreground'>
                {symbol}
              </span>
            </div>
          </div>
          <div className='flex justify-end text-xs text-muted-foreground'>
            <button
              onClick={handleMax}
              className='hover:text-foreground transition-colors'
            >
              Unlocked:{' '}
              {floorToDecimals(
                parseFloat(formattedWithdrawable),
                2
              ).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
              {symbol}
            </button>
          </div>
        </div>

        {insufficientBalance && (
          <p className='text-sm text-destructive'>
            Insufficient unlocked balance. You can request up to{' '}
            {floorToDecimals(
              parseFloat(formattedWithdrawable),
              2
            ).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
            {symbol}.
          </p>
        )}

        {blockedByMinimum && !insufficientBalance && minimumWithdrawalDisplay && (
          <p className='text-sm text-destructive'>
            The minimum withdrawal is {minimumWithdrawalDisplay} {symbol} —
            increase the amount, or use MAX to withdraw your full unlocked
            balance.
          </p>
        )}

        <Button
          onClick={handleRequestClick}
          disabled={
            isProcessing !== null ||
            !parsedAmount ||
            insufficientBalance ||
            blockedByMinimum
          }
          className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
        >
          {isProcessing === 'request' ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' /> Requesting...
            </>
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
                <ArrowDownToLine className='h-3 w-3 mr-1' /> Fund Queue
              </Button>
            </div>
            {withdrawalRequests.requests.map((req, idx) => {
              const requestId = withdrawalRequests.requestIds[idx]
              const isFullyFunded = req.amountFunded >= req.amount
              const isUnfunded = req.amountFunded === 0n
              const progress =
                req.amount > 0n
                  ? Number((req.amountFunded * 10000n) / req.amount) / 100
                  : 0

              return (
                <div
                  key={requestId.toString()}
                  className='border rounded-lg p-3 space-y-2'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {parseFloat(
                        formatTokenAmount(req.amount, decimals)
                      ).toLocaleString('en-US', {
                        maximumFractionDigits: 2
                      })}{' '}
                      {symbol}
                    </span>
                    {isFullyFunded ? (
                      <Badge
                        variant='default'
                        className='bg-green-600 hover:bg-green-600 text-xs cursor-default'
                      >
                        Ready to Claim
                      </Badge>
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
                        onClick={() =>
                          setClaimModal({
                            open: true,
                            requestId,
                            amount: req.amount
                          })
                        }
                        disabled={isProcessing !== null}
                        className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                      >
                        <CheckCircle2 className='h-3 w-3 mr-1' /> Claim
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Confirm Withdrawal Modal */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          if (!open && isProcessing !== null) return
          setShowConfirmDialog(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal Request</DialogTitle>
            <DialogDescription>
              Check the details below, then confirm to sign.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {/* Same shape as the deposit dialog: the figures are a table of
                facts, and the sentence that explains the queue is attached to
                the row it explains. */}
            <dl className='divide-y divide-border overflow-hidden rounded-lg border border-border'>
              <DetailRow label='You withdraw' value={`${amount} ${symbol}`} />
              {withdrawalFeePct ? (
                <DetailRow
                  label={`Claim fee (${withdrawalFeePct}%)`}
                  value={`~${feeAmountDisplay ?? '—'} ${symbol}`}
                  sub='Deducted when you claim'
                />
              ) : (
                <DetailRow label='Claim fee' value='None' />
              )}
              <DetailRow
                label='You receive'
                value={`${withdrawalFeePct ? `~${netReceiveDisplay}` : amount} ${symbol}`}
                note='Your shares are burned now and the request joins the withdrawal queue. You can claim once the queue funds your request.'
              />
            </dl>
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmWithdrawal}
              disabled={isProcessing !== null}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
            >
              {isProcessing === 'request' ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' /> Requesting…
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Queue Modal */}
      <Dialog
        open={fundQueueModal}
        onOpenChange={(open) => {
          if (!open && isProcessing !== null) return
          if (!open) setFundQueueModal(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Withdrawal Queue</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <p className='text-sm text-muted-foreground'>
              Pulls available principal from the Loans contract to fund pending
              withdrawal requests. Requests are funded in order from oldest to
              newest (FIFO).
            </p>
            <p className='text-sm text-muted-foreground'>
              This is a public action that funds the queue for all users, not
              just your own requests.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setFundQueueModal(false)}
              disabled={isProcessing !== null}
            >
              Cancel
            </Button>
            <Button disabled={isProcessing !== null} onClick={handleFundQueue}>
              {isProcessing === 'fund' ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' /> Funding…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Withdrawal Modal */}
      <Dialog
        open={claimModal.open}
        onOpenChange={(open) => {
          if (!open && isProcessing !== null) return
          if (!open) setClaimModal({ open: false, requestId: null, amount: 0n })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Claim</DialogTitle>
            <DialogDescription>
              Your funded withdrawal will be sent to your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Requested amount</span>
              <span className='font-medium'>
                {parseFloat(
                  formatTokenAmount(claimModal.amount, decimals)
                ).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
                {symbol}
              </span>
            </div>
            {withdrawalFeePct && claimFeeDisplay && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  Protocol fee ({withdrawalFeePct}%)
                </span>
                <span className='font-medium'>
                  −{claimFeeDisplay} {symbol}
                </span>
              </div>
            )}
            <div className='flex justify-between border-t pt-2'>
              <span className='text-muted-foreground'>You receive</span>
              <span className='font-semibold'>
                ~{claimNetDisplay} {symbol}
              </span>
            </div>
            {withdrawNativeFee !== undefined && withdrawNativeFee > 0n && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Network fee</span>
                <span className='font-medium'>
                  {Number(formatEther(withdrawNativeFee)).toLocaleString(
                    'en-US',
                    { maximumFractionDigits: 4 }
                  )}{' '}
                  {nativeCurrencySymbol}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() =>
                setClaimModal({ open: false, requestId: null, amount: 0n })
              }
              disabled={isProcessing !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClaim}
              disabled={isProcessing !== null}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {claimModal.requestId !== null &&
              isProcessing === `claim-${claimModal.requestId}` ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' /> Claiming…
                </>
              ) : (
                'Confirm Claim'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
