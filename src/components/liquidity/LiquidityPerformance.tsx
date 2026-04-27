'use client'
import { useState, useMemo } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { liquidityPoolAbi } from '@/src/generated'
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
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/hooks/use-toast'
import { formatTokenAmount } from '@/src/utils/decimals'
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

function formatShares(value: bigint, decimals: number): string {
  const formatted = parseFloat(formatTokenAmount(value, decimals))
  return formatted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
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

// Lock-tier durations are configured in 360-day years; matching that here
// keeps a 10 yr tier (311_040_000 s) from rendering as "9-year".
const SECONDS_PER_YEAR = 360 * 24 * 3600

function formatDuration(seconds: bigint): string {
  const s = Number(seconds)
  if (s === 0) return '0 seconds'
  const years = Math.floor(s / SECONDS_PER_YEAR)
  if (years > 0) return years === 1 ? '1 year' : `${years}-year`
  const days = Math.floor(s / 86400)
  if (days > 0) return days === 1 ? '1 day' : `${days}-day`
  const hours = Math.floor(s / 3600)
  if (hours > 0) return hours === 1 ? '1 hour' : `${hours}-hour`
  const minutes = Math.floor(s / 60)
  return minutes === 1 ? '1 minute' : `${minutes}-minute`
}

interface TransferAccountModal {
  open: boolean
  address: string
  confirmed: boolean
}

const emptyAccountModal: TransferAccountModal = { open: false, address: '', confirmed: false }

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

export function LiquidityPerformance({ liquidityPool }: LiquidityPerformanceProps) {
  const { toast } = useToast()
  const { address: connectedAddress } = useAccount()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [transferAccountModal, setTransferAccountModal] = useState<TransferAccountModal>(emptyAccountModal)
  const [compoundModal, setCompoundModal] = useState<{ open: boolean; selectedTierIndex: number | null }>({ open: false, selectedTierIndex: null })
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
    stableTokenAddress,
    liquidityPoolContractAddress,
    originalDepositValues,
    tokenMetadata,
    claimEarnings,
    compoundEarnings,
    pullEarnings,
    transferAccount,
    refetch,
  } = liquidityPool

  const decimals = stableTokenDecimals ?? 18
  const symbol = stableTokenSymbol ?? 'Token'

  // Fetch lock tiers for stableToken so user can pick one when compounding
  const { data: stableLockTiersRaw } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getAssetLockTiers',
    args: stableTokenAddress ? [stableTokenAddress] : undefined,
    query: { enabled: !!stableTokenAddress && !!liquidityPoolContractAddress },
  })

  const stableLockTiers = useMemo(() => {
    if (!stableLockTiersRaw) return []
    return (stableLockTiersRaw as readonly { duration: bigint; interestMultiplier: bigint; isEnabled: boolean }[])
      .filter((t) => t.isEnabled)
      .map((t) => ({ duration: t.duration, interestMultiplier: t.interestMultiplier }))
      .sort((a, b) => (a.duration < b.duration ? -1 : a.duration > b.duration ? 1 : 0))
  }, [stableLockTiersRaw])

  // Computed values
  const poolOwnership = useMemo(() => {
    if (!userStatus || !poolStatus || poolStatus.totalLiquidityShares === 0n) return 0
    return (Number(userStatus.liquidityShares) / Number(poolStatus.totalLiquidityShares)) * 100
  }, [userStatus, poolStatus])

  const interestShareOwnership = useMemo(() => {
    if (!userStatus || !poolStatus || poolStatus.totalInterestShares === 0n) return 0
    return (Number(userStatus.interestShares) / Number(poolStatus.totalInterestShares)) * 100
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
    return [...depositEntries].sort((a, b) => Number(a.lockDuration - b.lockDuration))
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
          label='Pool Protected Shares'
          value={
            poolStatus
              ? formatShares(
                  poolStatus.totalLiquidityShares > poolStatus.totalInterestShares
                    ? poolStatus.totalLiquidityShares - poolStatus.totalInterestShares
                    : 0n,
                  decimals,
                )
              : 'Loading...'
          }
        />
        {liquidityStatus && liquidityStatus.principalDeficitAmount > 0n && (
          <StatItem
            label='Defaulted Principal'
            value={formatCurrency(liquidityStatus.principalDeficitAmount, decimals, symbol)}
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
              label='Liquidity Shares'
              value={userStatus ? formatShares(userStatus.liquidityShares, decimals) : '0'}
            />
            <StatItem
              label='Interest Shares'
              value={userStatus ? formatShares(userStatus.interestShares, decimals) : '0'}
            />
            <StatItem
              label='Interest Share %'
              value={formatPct(interestShareOwnership)}
            />
          </div>
          {userStatus && userStatus.liquidityShares > 0n && (
            <div className='pt-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setTransferAccountModal({ open: true, address: '', confirmed: false })}
                disabled={isProcessing !== null}
              >
                <Send className='h-4 w-4 mr-2' />
                Transfer Account
              </Button>
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
            <div className='flex gap-2 pt-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: 'Claim Earnings',
                    description: `Your pending earnings of ${formatCurrency(userStatus.pendingEarnings, decimals, symbol)} will be transferred directly to your wallet.${earningsFeePct ? ` A ${earningsFeePct}% fee will be deducted.` : ''}`,
                    actionName: 'Claim',
                    action: () => claimEarnings(),
                    successMsg: `${formatCurrency(userStatus.pendingEarnings, decimals, symbol)} claimed successfully.`,
                  })
                }
                disabled={isProcessing !== null}
              >
                {isProcessing === 'Claim' ? (
                  <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Claiming...</>
                ) : (
                  <><Wallet className='h-4 w-4 mr-2' /> Claim</>
                )}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setCompoundModal({ open: true, selectedTierIndex: null })}
                disabled={isProcessing !== null}
              >
                {isProcessing === 'Compound' ? (
                  <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Compounding...</>
                ) : (
                  <><Repeat2 className='h-4 w-4 mr-2' /> Compound</>
                )}
              </Button>
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
              <div className='grid grid-cols-5 text-xs font-medium text-muted-foreground pb-1 border-b'>
                <span>Deposit Amount</span>
                <span>Token Amount</span>
                <span>Lock Duration</span>
                <span>Unlock Date</span>
                <span>Status</span>
              </div>
              {sortedDepositEntries.map((entry, index) => {
                const now = BigInt(Math.floor(Date.now() / 1000))
                const isUnlocked = entry.unlockTime <= now
                const originalKey = `${entry.token.toLowerCase()}:${entry.unlockTime}:${entry.lockDuration}`
                const originalValue = originalDepositValues.get(originalKey) ?? entry.stableTokenValue
                const meta = tokenMetadata.get(entry.token.toLowerCase())
                const tokenAmountFormatted = meta
                  ? formatCurrency(entry.tokenAmount, meta.decimals, meta.symbol)
                  : '—'

                return (
                  <div key={index} className='grid grid-cols-5 items-center text-sm py-2 border-b border-border/50'>
                    <span>{formatCurrency(originalValue, decimals, symbol)}</span>
                    <span>{tokenAmountFormatted}</span>
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

    {/* Compound Earnings Modal */}
    <Dialog
      open={compoundModal.open}
      onOpenChange={(open) => !open && setCompoundModal({ open: false, selectedTierIndex: null })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compound Earnings</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          {userStatus && (
            <p className='text-sm text-muted-foreground'>
              Your pending earnings of {formatCurrency(userStatus.pendingEarnings, decimals, symbol)} will be deposited back into the pool as new shares. Select a lock duration below.
            </p>
          )}
          {stableLockTiers.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No lock tiers available.</p>
          ) : (
            <div className='space-y-2'>
              {stableLockTiers.map((tier, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setCompoundModal((m) => ({ ...m, selectedTierIndex: i }))}
                  className={`w-full text-left rounded-md border px-4 py-3 text-sm transition-colors ${
                    compoundModal.selectedTierIndex === i
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className='font-medium'>{formatDuration(tier.duration)} lock</span>
                  <span className='text-muted-foreground ml-2'>
                    — {(Number(tier.interestMultiplier) / 100).toFixed(2)}× interest multiplier
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setCompoundModal({ open: false, selectedTierIndex: null })}>
            Cancel
          </Button>
          <Button
            disabled={compoundModal.selectedTierIndex === null || isProcessing !== null}
            onClick={async () => {
              const tier = stableLockTiers[compoundModal.selectedTierIndex!]
              setCompoundModal({ open: false, selectedTierIndex: null })
              await handleAction(
                'Compound',
                () => compoundEarnings(tier.duration),
                'Earnings compounded into new shares.'
              )
            }}
          >
            {isProcessing === 'Compound' ? (
              <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Compounding...</>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Transfer Account Modal */}
    <Dialog
      open={transferAccountModal.open}
      onOpenChange={(open) => !open && setTransferAccountModal(emptyAccountModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Account</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <p className='text-sm text-muted-foreground'>
            All of your liquidity will be transferred to the entered wallet, including all deposits, shares, and any pending earnings. This action cannot be undone.
          </p>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Recipient Wallet Address</label>
            <Input
              placeholder='0x...'
              value={transferAccountModal.address}
              onChange={(e) =>
                setTransferAccountModal((m) => ({ ...m, address: e.target.value }))
              }
            />
            {isValidAddress(transferAccountModal.address) &&
              connectedAddress &&
              transferAccountModal.address.toLowerCase() === connectedAddress.toLowerCase() && (
              <p className='text-sm text-destructive'>You cannot transfer your account to yourself.</p>
            )}
          </div>
          <div className='flex items-start gap-3 pt-1'>
            <Checkbox
              id='transfer-account-confirm'
              checked={transferAccountModal.confirmed}
              onCheckedChange={(checked) =>
                setTransferAccountModal((m) => ({ ...m, confirmed: checked === true }))
              }
            />
            <label
              htmlFor='transfer-account-confirm'
              className='text-sm leading-snug cursor-pointer'
            >
              I understand that all liquidity, shares, and pending earnings will be transferred to the entered wallet and this cannot be reversed.
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setTransferAccountModal(emptyAccountModal)}>
            Cancel
          </Button>
          <Button
            disabled={
              !isValidAddress(transferAccountModal.address) ||
              !transferAccountModal.confirmed ||
              isProcessing !== null ||
              (!!connectedAddress && transferAccountModal.address.toLowerCase() === connectedAddress.toLowerCase())
            }
            onClick={async () => {
              const to = transferAccountModal.address as `0x${string}`
              setTransferAccountModal(emptyAccountModal)
              await handleAction(
                'TransferAccount',
                () => transferAccount(to),
                'Account transferred successfully.'
              )
            }}
          >
            {isProcessing === 'TransferAccount' ? (
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

  </>
  )
}
