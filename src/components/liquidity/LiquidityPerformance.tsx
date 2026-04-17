'use client'
import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/hooks/use-toast'
import { formatTokenAmount, parseTokenAmount } from '@/src/utils/decimals'
import {
  BarChart3,
  TrendingUp,
  Lock,
  Unlock,
  Clock,
  Loader2,
  ArrowDownToLine,
  RefreshCw,
  Coins,
  Send,
  Wallet,
  Repeat2,
} from 'lucide-react'
import {
  handleContractError,
  type ContractError,
} from '@/src/utils/errorHandling'
import type { UseLiquidityPoolReturn } from '@/src/hooks/liquidity/useLiquidityPool'
interface LiquidityPerformanceProps {
  liquidityPool: UseLiquidityPoolReturn
}

function StatItem({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className='space-y-1'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className={`text-sm font-medium ${warning ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  )
}

function formatCurrency(value: bigint, decimals: number, symbol: string): string {
  const formatted = parseFloat(formatTokenAmount(value, decimals))
  return `${formatted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${symbol}`
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatRelativeTime(timestamp: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const ts = Number(timestamp)
  if (ts === 0) return 'Never'

  const diff = now - ts
  if (diff < 0) {
    // Future
    const absDiff = Math.abs(diff)
    if (absDiff < 3600) return `in ${Math.floor(absDiff / 60)} minutes`
    if (absDiff < 86400) return `in ${Math.floor(absDiff / 3600)} hours`
    return `in ${Math.floor(absDiff / 86400)} days`
  }

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}

function formatDate(timestamp: bigint): string {
  const ts = Number(timestamp)
  if (ts === 0) return 'N/A'
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(seconds: bigint): string {
  const s = Number(seconds)
  if (s === 0) return '0 seconds'
  const years = Math.floor(s / (365.25 * 24 * 3600))
  if (years > 0) return years === 1 ? '1 year' : `${years}-year`
  const days = Math.floor(s / 86400)
  if (days > 0) return days === 1 ? '1 day' : `${days}-day`
  const hours = Math.floor(s / 3600)
  if (hours > 0) return hours === 1 ? '1 hour' : `${hours}-hour`
  const minutes = Math.floor(s / 60)
  return minutes === 1 ? '1 minute' : `${minutes}-minute`
}

interface TransferModal {
  open: boolean
  address: string
  amount: string
}

const emptyModal: TransferModal = { open: false, address: '', amount: '' }

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

export function LiquidityPerformance({ liquidityPool }: LiquidityPerformanceProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [transferEarningsModal, setTransferEarningsModal] = useState<TransferModal>(emptyModal)
  const [transferSharesModal, setTransferSharesModal] = useState<TransferModal>(emptyModal)
  const [transferNonEarningSharesModal, setTransferNonEarningSharesModal] = useState<TransferModal>(emptyModal)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; description: string; actionName: string; action: () => Promise<unknown>; successMsg: string }>({ open: false, title: '', description: '', actionName: '', action: async () => {}, successMsg: '' })

  const {
    userStatus,
    poolStatus,
    feeConfig,
    liquidityStatus,
    depositEntries,
    hasPosition,
    totalLoansIssued,
    cumulativeLoanValue,
    stableTokenSymbol,
    stableTokenDecimals,
    lockDuration,
    claimEarnings,
    compoundEarnings,
    pullEarnings,
    transferPendingEarnings,
    transferShares,
    transferNonEarningShares,
    refetch,
  } = liquidityPool

  const decimals = stableTokenDecimals ?? 18
  const symbol = stableTokenSymbol ?? 'Token'
  const lockDurationLabel = lockDuration ? formatDuration(lockDuration) : 'lock'

  // Computed values
  const poolOwnership = useMemo(() => {
    if (!userStatus || !poolStatus || poolStatus.totalLiquidityShares === 0n) return 0
    return (Number(userStatus.liquidityShares) / Number(poolStatus.totalLiquidityShares)) * 100
  }, [userStatus, poolStatus])

  const lifetimeEarnings = useMemo(() => {
    if (!userStatus) return 0n
    return userStatus.pendingEarnings + userStatus.totalClaimed
  }, [userStatus])

  const earningsFeePct = useMemo(() => {
    if (!feeConfig || feeConfig.feeBps === 0n) return null
    return Number(feeConfig.feeBps) / 100
  }, [feeConfig])

  const poolUtilization = useMemo(() => {
    if (!liquidityStatus) return 0
    const totalDeposited = liquidityStatus.principalDeposited - liquidityStatus.principalWithdrawn
    if (totalDeposited === 0n) return 0
    const util = (Number(liquidityStatus.principalInLoans) / Number(totalDeposited)) * 100
    return Math.min(Math.max(util, 0), 100)
  }, [liquidityStatus])

  const canDistributeEarnings = useMemo(() => {
    if (!poolStatus) return false
    const now = BigInt(Math.floor(Date.now() / 1000))
    return (
      poolStatus.nextEarningsWithdrawalTime <= now &&
      poolStatus.availableEarningsInLoans > 0n
    )
  }, [poolStatus])

  const nextDistributionText = useMemo(() => {
    if (!poolStatus) return 'N/A'
    const now = BigInt(Math.floor(Date.now() / 1000))
    if (poolStatus.nextEarningsWithdrawalTime <= now) return 'Available now'
    return formatRelativeTime(poolStatus.nextEarningsWithdrawalTime)
  }, [poolStatus])

  const sortedDepositEntries = useMemo(() => {
    return [...depositEntries].sort((a, b) => Number(a.unlockTime - b.unlockTime))
  }, [depositEntries])

  // Action handlers
  const handleAction = async (
    actionName: string,
    action: () => Promise<unknown>,
    successMsg: string
  ) => {
    setIsProcessing(actionName)
    try {
      await action()
      toast({ title: '\u2705 Success', description: successMsg })
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, `${actionName} Failed`)
    } finally {
      setIsProcessing(null)
    }
  }

  // Pool Overview section (always shown)
  const PoolOverview = () => (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold flex items-center gap-2'>
        <BarChart3 className='h-4 w-4' /> Pool Overview
      </h3>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        <StatItem
          label='Total Pool Value'
          value={poolStatus ? formatCurrency(poolStatus.totalPoolValue, decimals, symbol) : 'Loading...'}
        />
        <StatItem
          label='Principal in Active Loans'
          value={liquidityStatus ? formatCurrency(liquidityStatus.principalInLoans, decimals, symbol) : 'Loading...'}
        />
        <StatItem
          label='Pool Utilization'
          value={formatPct(poolUtilization)}
        />
        <StatItem
          label='Total Interest Generated'
          value={liquidityStatus ? formatCurrency(liquidityStatus.interestEarned, decimals, symbol) : 'Loading...'}
        />
        <StatItem
          label='Total Loans Issued'
          value={totalLoansIssued !== undefined ? Number(totalLoansIssued).toLocaleString() : 'Loading...'}
        />
        <StatItem
          label='Pool Non-Earning Shares'
          value={poolStatus ? formatCurrency(poolStatus.totalLiquidityShares - poolStatus.totalInterestShares, decimals, symbol) : 'Loading...'}
        />
        {liquidityStatus && liquidityStatus.principalForfeited > 0n && (
          <StatItem
            label='Defaulted Principal'
            value={formatCurrency(liquidityStatus.principalForfeited, decimals, symbol)}
            warning
          />
        )}
      </div>
    </div>
  )

  // Earnings Distribution section (always shown)
  const EarningsDistribution = () => (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold flex items-center gap-2'>
        <RefreshCw className='h-4 w-4' /> Earnings Distribution
      </h3>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        <StatItem
          label='Uncollected Pool Earnings'
          value={poolStatus ? formatCurrency(poolStatus.availableEarningsInLoans, decimals, symbol) : 'Loading...'}
        />
        <StatItem
          label='Last Distribution'
          value={poolStatus ? formatRelativeTime(poolStatus.lastEarningsWithdrawal) : 'Loading...'}
        />
        <StatItem
          label='Next Distribution Available'
          value={nextDistributionText}
        />
      </div>
      {canDistributeEarnings && (
        <div className='pt-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              setConfirmModal({
                open: true,
                title: 'Distribute Earnings',
                description: 'This will pull earned interest from the Loans contract into the liquidity pool, making it available for all depositors to claim. Anyone can trigger this action.',
                actionName: 'Distribute',
                action: () => pullEarnings(),
                successMsg: 'Earnings distributed to the pool.',
              })
            }
            disabled={isProcessing !== null}
          >
            {isProcessing === 'Distribute' ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Distributing...</>
            ) : (
              <><ArrowDownToLine className='h-4 w-4 mr-2' /> Distribute Earnings</>
            )}
          </Button>
          <p className='text-xs text-muted-foreground mt-1'>
            Pulls earned interest from the Loans contract into the pool for all depositors.
          </p>
        </div>
      )}
    </div>
  )

  // No position view
  if (!hasPosition) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Liquidity Performance
          </CardTitle>
          <CardDescription>Pool performance overview</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <PoolOverview />
          <div className='border-t pt-4'>
            <EarningsDistribution />
          </div>
          <div className='border-t pt-4 text-center'>
            <p className='text-sm text-muted-foreground'>
              Deposit liquidity to start earning from borrower interest payments.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full position view
  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Liquidity Performance
        </CardTitle>
        <CardDescription>Your position and pool performance</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 1. Your Position */}
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold flex items-center gap-2'>
            <Coins className='h-4 w-4' /> Your Position
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <StatItem
              label='Total Deposited'
              value={userStatus ? formatCurrency(userStatus.totalPrincipal, decimals, symbol) : 'Loading...'}
            />
            <StatItem
              label='Locked'
              value={userStatus ? formatCurrency(userStatus.lockedPrincipal, decimals, symbol) : 'Loading...'}
            />
            <StatItem
              label='Unlocked'
              value={userStatus ? formatCurrency(userStatus.unlockedPrincipal, decimals, symbol) : 'Loading...'}
            />
            <StatItem
              label='Pool Ownership'
              value={formatPct(poolOwnership)}
            />
            <StatItem
              label='Earning Shares'
              value={userStatus ? formatCurrency(userStatus.interestShares, decimals, symbol) : '0'}
            />
            <StatItem
              label='Non-Earning Shares'
              value={userStatus ? formatCurrency(userStatus.liquidityShares - userStatus.interestShares, decimals, symbol) : '0'}
            />
          </div>
          {userStatus && userStatus.interestShares > 0n && (
            <div className='flex items-start gap-4 pt-2'>
              <Button
                size='sm'
                variant='outline'
                className='shrink-0'
                onClick={() => setTransferSharesModal({ open: true, address: '', amount: '' })}
                disabled={isProcessing !== null}
              >
                <Send className='h-4 w-4 mr-2' />
                Transfer Shares
              </Button>
              <p className='text-xs text-muted-foreground pt-1'>
                Transfer earning shares to another liquidity provider. The recipient must already have a position.
              </p>
            </div>
          )}
          {userStatus && (userStatus.liquidityShares - userStatus.interestShares) > 0n && (
            <div className='flex items-start gap-4 pt-2'>
              <Button
                size='sm'
                variant='outline'
                className='shrink-0'
                onClick={() => setTransferNonEarningSharesModal({ open: true, address: '', amount: '' })}
                disabled={isProcessing !== null}
              >
                <Send className='h-4 w-4 mr-2' />
                Transfer Non-Earning Shares
              </Button>
              <p className='text-xs text-muted-foreground pt-1'>
                Transfer non-earning shares to another liquidity provider. The recipient must already have a position.
              </p>
            </div>
          )}
        </div>

        <div className='border-t' />

        {/* 2. Your Earnings */}
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold flex items-center gap-2'>
            <TrendingUp className='h-4 w-4' /> Your Earnings
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <StatItem
              label='Pending Earnings'
              value={userStatus ? formatCurrency(userStatus.pendingEarnings, decimals, symbol) : 'Loading...'}
            />
            <StatItem
              label='Total Claimed'
              value={userStatus ? formatCurrency(userStatus.totalClaimed, decimals, symbol) : 'Loading...'}
            />
            <StatItem
              label='Lifetime Earnings'
              value={formatCurrency(lifetimeEarnings, decimals, symbol)}
            />
            {earningsFeePct && (
              <StatItem label='Earnings Fee' value={formatPct(earningsFeePct)} />
            )}
          </div>
          {userStatus && userStatus.pendingEarnings > 0n && (
            <div className='space-y-3 pt-2'>
              {earningsFeePct && (
                <p className='text-xs text-muted-foreground'>
                  A {earningsFeePct}% earnings fee applies on claims. You will receive{' '}
                  {formatCurrency(
                    userStatus.pendingEarnings - (userStatus.pendingEarnings * feeConfig!.feeBps) / 10000n,
                    decimals,
                    symbol
                  )}.
                </p>
              )}
              <div className='flex items-start gap-4'>
                <Button
                  size='sm'
                  variant='outline'
                  className='shrink-0'
                  onClick={() =>
                    setConfirmModal({
                      open: true,
                      title: 'Claim Earnings',
                      description: `Your pending earnings of ${formatCurrency(userStatus.pendingEarnings, decimals, symbol)} will be transferred directly to your wallet.${earningsFeePct ? ` A ${earningsFeePct}% fee will be deducted.` : ''}`,
                      actionName: 'Claim',
                      action: () => claimEarnings(),
                      successMsg: 'Earnings claimed successfully.',
                    })
                  }
                  disabled={isProcessing !== null}
                >
                  {isProcessing === 'Claim' ? (
                    <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Claiming...</>
                  ) : (
                    <><Wallet className='h-4 w-4 mr-2' /> Claim Earnings</>
                  )}
                </Button>
                <p className='text-xs text-muted-foreground pt-1'>
                  Your earnings will be transferred directly to your wallet.
                </p>
              </div>
              <div className='flex items-start gap-4'>
                <Button
                  size='sm'
                  variant='outline'
                  className='shrink-0'
                  onClick={() =>
                    setConfirmModal({
                      open: true,
                      title: 'Compound Earnings',
                      description: `Your pending earnings of ${formatCurrency(userStatus.pendingEarnings, decimals, symbol)} will be deposited back into the pool as new shares. The compounded amount will be subject to a new ${lockDurationLabel} lock period.`,
                      actionName: 'Compound',
                      action: () => compoundEarnings(lockDuration ?? 0n),
                      successMsg: 'Earnings compounded into new shares.',
                    })
                  }
                  disabled={isProcessing !== null}
                >
                  {isProcessing === 'Compound' ? (
                    <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Compounding...</>
                  ) : (
                    <><Repeat2 className='h-4 w-4 mr-2' /> Compound Earnings</>
                  )}
                </Button>
                <p className='text-xs text-muted-foreground pt-1'>
                  Deposit your earnings into new shares. Compounded amount is subject to a new {lockDurationLabel} lock.
                </p>
              </div>
              <div className='flex items-start gap-4'>
                <Button
                  size='sm'
                  variant='outline'
                  className='shrink-0'
                  onClick={() => setTransferEarningsModal({ open: true, address: '', amount: '' })}
                  disabled={isProcessing !== null}
                >
                  <Send className='h-4 w-4 mr-2' />
                  Transfer Earnings
                </Button>
                <p className='text-xs text-muted-foreground pt-1'>
                  Transfer a portion of your pending earnings to another liquidity provider.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className='border-t' />

        {/* 3. Pool Overview */}
        <PoolOverview />

        <div className='border-t' />

        {/* 4. Earnings Distribution */}
        <EarningsDistribution />

        <div className='border-t' />

        {/* 5. Deposit History */}
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold flex items-center gap-2'>
            <Clock className='h-4 w-4' /> Deposit History
          </h3>
          {sortedDepositEntries.length > 0 ? (
            <div className='space-y-2'>
              <div className='grid grid-cols-4 text-xs font-medium text-muted-foreground pb-1 border-b'>
                <span>Deposit Amount</span>
                <span>Lock Duration</span>
                <span>Unlock Date</span>
                <span>Status</span>
              </div>
              {sortedDepositEntries.map((entry, index) => {
                const now = BigInt(Math.floor(Date.now() / 1000))
                const isUnlocked = entry.unlockTime <= now

                return (
                  <div key={index} className='grid grid-cols-4 items-center text-sm py-2 border-b border-border/50'>
                    <span>{formatCurrency(entry.stableTokenValue, decimals, symbol)}</span>
                    <span>{formatDuration(entry.lockDuration)}</span>
                    <span>{formatDate(entry.unlockTime)}</span>
                    <div>
                      {isUnlocked ? (
                        <Badge variant='green' className='text-xs'>
                          <Unlock className='h-3 w-3 mr-1' /> Unlocked
                        </Badge>
                      ) : (
                        <Badge variant='secondary' className='text-xs'>
                          <Lock className='h-3 w-3 mr-1' /> Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No deposit entries found.</p>
          )}

        </div>
      </CardContent>
    </Card>

    {/* Transfer Pending Earnings Modal */}
    <Dialog
      open={transferEarningsModal.open}
      onOpenChange={(open) => !open && setTransferEarningsModal(emptyModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Pending Earnings</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <p className='text-sm text-muted-foreground'>
            The recipient must already be a liquidity provider with an active position in the pool.
          </p>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Recipient Wallet Address</label>
            <Input
              placeholder='0x...'
              value={transferEarningsModal.address}
              onChange={(e) =>
                setTransferEarningsModal((m) => ({ ...m, address: e.target.value }))
              }
            />
          </div>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Amount ({symbol})</label>
            <div className='flex gap-2'>
              <Input
                type='number'
                placeholder='0.00'
                min='0'
                value={transferEarningsModal.amount}
                onChange={(e) =>
                  setTransferEarningsModal((m) => ({ ...m, amount: e.target.value }))
                }
              />
              {userStatus && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='shrink-0'
                  onClick={() =>
                    setTransferEarningsModal((m) => ({
                      ...m,
                      amount: formatTokenAmount(userStatus.pendingEarnings, decimals),
                    }))
                  }
                >
                  Max
                </Button>
              )}
            </div>
            {userStatus && (
              <p className='text-xs text-muted-foreground'>
                Available: {formatCurrency(userStatus.pendingEarnings, decimals, symbol)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setTransferEarningsModal(emptyModal)}>
            Cancel
          </Button>
          <Button
            disabled={
              !isValidAddress(transferEarningsModal.address) ||
              !transferEarningsModal.amount ||
              parseFloat(transferEarningsModal.amount) <= 0 ||
              isProcessing !== null
            }
            onClick={async () => {
              const to = transferEarningsModal.address as `0x${string}`
              const parsed = parseTokenAmount(transferEarningsModal.amount, decimals)
              setTransferEarningsModal(emptyModal)
              await handleAction(
                'TransferEarnings',
                () => transferPendingEarnings(to, parsed),
                'Earnings transferred successfully.'
              )
            }}
          >
            {isProcessing === 'TransferEarnings' ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Transferring...</>
            ) : (
              'Confirm Transfer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Transfer Shares Modal */}
    <Dialog
      open={transferSharesModal.open}
      onOpenChange={(open) => !open && setTransferSharesModal(emptyModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Shares</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <p className='text-sm text-muted-foreground'>
            The recipient must already be a liquidity provider with an active position in the pool.
          </p>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Recipient Wallet Address</label>
            <Input
              placeholder='0x...'
              value={transferSharesModal.address}
              onChange={(e) =>
                setTransferSharesModal((m) => ({ ...m, address: e.target.value }))
              }
            />
          </div>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Share Amount ({symbol})</label>
            <div className='flex gap-2'>
              <Input
                type='number'
                placeholder='0.00'
                min='0'
                value={transferSharesModal.amount}
                onChange={(e) =>
                  setTransferSharesModal((m) => ({ ...m, amount: e.target.value }))
                }
              />
              {userStatus && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='shrink-0'
                  onClick={() =>
                    setTransferSharesModal((m) => ({
                      ...m,
                      amount: formatTokenAmount(userStatus.interestShares, decimals),
                    }))
                  }
                >
                  Max
                </Button>
              )}
            </div>
            {userStatus && (
              <p className='text-xs text-muted-foreground'>
                Available: {formatCurrency(userStatus.interestShares, decimals, symbol)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setTransferSharesModal(emptyModal)}>
            Cancel
          </Button>
          <Button
            disabled={
              !isValidAddress(transferSharesModal.address) ||
              !transferSharesModal.amount ||
              parseFloat(transferSharesModal.amount) <= 0 ||
              isProcessing !== null
            }
            onClick={async () => {
              const to = transferSharesModal.address as `0x${string}`
              const parsed = parseTokenAmount(transferSharesModal.amount, decimals)
              setTransferSharesModal(emptyModal)
              await handleAction(
                'TransferShares',
                () => transferShares(to, parsed),
                'Shares transferred successfully.'
              )
            }}
          >
            {isProcessing === 'TransferShares' ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Transferring...</>
            ) : (
              'Confirm Transfer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmation Modal */}
    <Dialog
      open={confirmModal.open}
      onOpenChange={(open) => !open && setConfirmModal((m) => ({ ...m, open: false }))}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmModal.title}</DialogTitle>
        </DialogHeader>
        <div className='py-2'>
          <p className='text-sm text-muted-foreground'>{confirmModal.description}</p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setConfirmModal((m) => ({ ...m, open: false }))}>
            Cancel
          </Button>
          <Button
            disabled={isProcessing !== null}
            onClick={async () => {
              const { actionName, action, successMsg } = confirmModal
              setConfirmModal((m) => ({ ...m, open: false }))
              await handleAction(actionName, action, successMsg)
            }}
          >
            {isProcessing === confirmModal.actionName ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Processing...</>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Transfer Non-Earning Shares Modal */}
    <Dialog
      open={transferNonEarningSharesModal.open}
      onOpenChange={(open) => !open && setTransferNonEarningSharesModal(emptyModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Non-Earning Shares</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <p className='text-sm text-muted-foreground'>
            The recipient must already be a liquidity provider with an active position in the pool.
          </p>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Recipient Wallet Address</label>
            <Input
              placeholder='0x...'
              value={transferNonEarningSharesModal.address}
              onChange={(e) =>
                setTransferNonEarningSharesModal((m) => ({ ...m, address: e.target.value }))
              }
            />
          </div>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Share Amount ({symbol})</label>
            <div className='flex gap-2'>
              <Input
                type='number'
                placeholder='0.00'
                min='0'
                value={transferNonEarningSharesModal.amount}
                onChange={(e) =>
                  setTransferNonEarningSharesModal((m) => ({ ...m, amount: e.target.value }))
                }
              />
              {userStatus && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='shrink-0'
                  onClick={() =>
                    setTransferNonEarningSharesModal((m) => ({
                      ...m,
                      amount: formatTokenAmount(userStatus.liquidityShares - userStatus.interestShares, decimals),
                    }))
                  }
                >
                  Max
                </Button>
              )}
            </div>
            {userStatus && (
              <p className='text-xs text-muted-foreground'>
                Available: {formatCurrency(userStatus.liquidityShares - userStatus.interestShares, decimals, symbol)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setTransferNonEarningSharesModal(emptyModal)}>
            Cancel
          </Button>
          <Button
            disabled={
              !isValidAddress(transferNonEarningSharesModal.address) ||
              !transferNonEarningSharesModal.amount ||
              parseFloat(transferNonEarningSharesModal.amount) <= 0 ||
              isProcessing !== null
            }
            onClick={async () => {
              const to = transferNonEarningSharesModal.address as `0x${string}`
              const parsed = parseTokenAmount(transferNonEarningSharesModal.amount, decimals)
              setTransferNonEarningSharesModal(emptyModal)
              await handleAction(
                'TransferNonEarningShares',
                () => transferNonEarningShares(to, parsed),
                'Non-earning shares transferred successfully.'
              )
            }}
          >
            {isProcessing === 'TransferNonEarningShares' ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Transferring...</>
            ) : (
              'Confirm Transfer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
