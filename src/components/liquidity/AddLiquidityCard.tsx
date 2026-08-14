'use client'
import { useState, useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { erc20Abi, formatEther } from 'viem'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/hooks/use-toast'
import { formatTokenAmount, parseTokenAmount } from '@/src/utils/decimals'
import { Plus, Loader2 } from 'lucide-react'
import {
  handleContractError,
  type ContractError
} from '@/src/utils/errorHandling'
import type { UseLiquidityPoolReturn } from '@/src/hooks/liquidity/useLiquidityPool'
import { TransactionPendingError } from '@/src/hooks/liquidity/useLiquidityOperations'
import type { LockDurationTier } from '@/src/types/liquidity'
import { liquidityPoolAbi } from '@/src/generated'
import type { ReferralState } from '@/src/hooks/referral/useReferralState'
import { describeSkipReason } from '@/src/utils/referral'
import { truncateAddress } from '@/src/utils/format'

// Lock-tier durations are configured in 360-day years (e.g. 10 yr =
// 360 * 86400 * 10 = 311_040_000 s). Using 365.25 here floors a clean
// 10-year tier to "9yr".
const SECONDS_PER_YEAR = 360 * 24 * 3600

function formatLockDuration(duration: bigint): string {
  const s = Number(duration)
  if (s === 0) return '0'
  const years = Math.floor(s / SECONDS_PER_YEAR)
  if (years > 0) return `${years}yr`
  const days = Math.floor(s / 86400)
  if (days > 0) return `${days}d`
  const hours = Math.floor(s / 3600)
  if (hours > 0) return `${hours}hr`
  const minutes = Math.floor(s / 60)
  return `${minutes}min`
}

function formatLockDurationLong(duration: bigint): string {
  const s = Number(duration)
  if (s === 0) return 'the lock period'
  const years = Math.floor(s / SECONDS_PER_YEAR)
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
  const days = Math.floor(s / 86400)
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  const hours = Math.floor(s / 3600)
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  const minutes = Math.floor(s / 60)
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}

interface AddLiquidityCardProps {
  liquidityPool: UseLiquidityPoolReturn
  /**
   * Owned by LiquidityDashboard so the full-width banner and this form share
   * one instance. Inert when no router is configured for the chain.
   */
  referral: ReferralState
}

export function AddLiquidityCard({
  liquidityPool,
  referral
}: AddLiquidityCardProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isNonEarning, setIsNonEarning] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(
    null
  )
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(
    null
  )
  const { toast } = useToast()
  const { address, chain } = useAccount()
  const nativeCurrencySymbol = chain?.nativeCurrency.symbol ?? 'native token'

  const {
    stableTokenAddress,
    stableTokenDecimals,
    liquidityPoolContractAddress,
    feeConfig,
    approveToken,
    deposit,
    depositWithReferral,
    depositNativeFee,
    refetch
  } = liquidityPool

  // Alias kept for clarity at the read-call sites below
  const lpAddress = liquidityPoolContractAddress

  const stableDecimals = stableTokenDecimals ?? 18

  // Read supported assets from the pool
  const { data: supportedAssetsRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getSupportedAssets',
    query: { enabled: !!lpAddress }
  })
  const allAssets = useMemo((): `0x${string}`[] => {
    if (!supportedAssetsRaw) return []
    return [...(supportedAssetsRaw as readonly `0x${string}`[])]
  }, [supportedAssetsRaw])

  // Fetch config for each supported asset to filter out disabled/internal-only
  const { data: assetConfigsRaw } = useReadContracts({
    contracts: allAssets.map((asset) => ({
      address: lpAddress,
      abi: liquidityPoolAbi as unknown as any[],
      functionName: 'getAssetConfig',
      args: [asset]
    })) as any[],
    query: { enabled: allAssets.length > 0 && !!lpAddress }
  })

  const depositableAssets = useMemo(() => {
    if (!assetConfigsRaw) return []
    return allAssets.filter((_, idx) => {
      const cfg = assetConfigsRaw[idx]?.result as { status: number } | undefined
      return cfg?.status === 1 // AssetStatus.Active
    })
  }, [allAssets, assetConfigsRaw])

  const selectedAsset =
    selectedAssetIndex !== null
      ? (depositableAssets[selectedAssetIndex] as `0x${string}` | undefined)
      : undefined

  // Parse dollar input to stable token units for contract calls
  const parsedDollarAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return undefined
    try {
      return parseTokenAmount(amount, stableDecimals)
    } catch {
      return undefined
    }
  }, [amount, stableDecimals])

  // ── Referral layer ────────────────────────────────────────────────────────
  // The gate is the single verdict; this form never re-derives it. On a chain
  // with no router configured it is 'disabled' and everything below behaves
  // exactly as it did before the referral layer existed.
  const { router: referralRouter, gate } = referral

  const useReferralPath = gate.status === 'ready'

  // Referral-only: with a router configured, anything short of a valid link
  // stops the deposit. The banner above carries the reason and the remedy.
  const isReferralBlocked =
    gate.status === 'blocked' || gate.status === 'checking'

  // The router pulls tokens with transferFrom, so on the referral path the
  // ROUTER — not the pool — is the spender that must be approved.
  const depositSpender = useReferralPath
    ? referralRouter.routerAddress
    : liquidityPoolContractAddress

  // How many tokens does the user need to cover the dollar input?
  const { data: tokenAmountRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getTokensForStableValue',
    args:
      selectedAsset && parsedDollarAmount
        ? [selectedAsset, parsedDollarAmount]
        : undefined,
    query: { enabled: !!selectedAsset && !!parsedDollarAmount }
  })

  // Read lock tiers for selected asset
  const { data: lockTiersRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getAssetLockTiers',
    args: selectedAsset ? [selectedAsset] : undefined,
    query: { enabled: !!selectedAsset }
  })
  const assetLockTiers = useMemo((): LockDurationTier[] => {
    if (!lockTiersRaw) return []
    return (
      lockTiersRaw as readonly {
        duration: bigint
        interestMultiplier: bigint
        isEnabled: boolean
      }[]
    )
      .map((t) => ({
        duration: t.duration,
        interestMultiplier: t.interestMultiplier,
        isEnabled: t.isEnabled
      }))
      .sort((a, b) =>
        a.duration < b.duration ? -1 : a.duration > b.duration ? 1 : 0
      )
  }, [lockTiersRaw])

  // Read token metadata for selected asset
  const { data: tokenSymbol } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!selectedAsset }
  })

  const { data: tokenDecimals } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!selectedAsset }
  })

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!selectedAsset && !!address }
  })

  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && depositSpender ? [address, depositSpender] : undefined,
    query: { enabled: !!selectedAsset && !!address && !!depositSpender }
  })

  const decimals = tokenDecimals !== undefined ? Number(tokenDecimals) : 18
  const symbol = (tokenSymbol as string) ?? 'Token'
  const userTokenBalance = tokenBalance as bigint | undefined
  const currentAllowance = tokenAllowance as bigint | undefined

  // Fetch minimum deposit value from contract (in stable token units)
  const { data: minimumDepositValueRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'minimumDepositValue',
    query: { enabled: !!lpAddress }
  })
  const minimumDepositValue = minimumDepositValueRaw as bigint | undefined

  // What is the user's token balance worth in stable terms?
  const { data: balanceCreditRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getDepositCredit',
    args:
      selectedAsset && userTokenBalance
        ? [selectedAsset, userTokenBalance]
        : undefined,
    query: { enabled: !!selectedAsset && !!userTokenBalance }
  })

  // Filter to enabled tiers only
  const enabledTiers = useMemo(() => {
    return assetLockTiers.filter((t: LockDurationTier) => t.isEnabled)
  }, [assetLockTiers])

  const selectedTier =
    selectedTierIndex !== null ? enabledTiers[selectedTierIndex] : undefined

  const selectedLockDuration = useMemo(() => {
    if (selectedTier) return selectedTier.duration
    return 0n
  }, [selectedTier])

  const tokenAmount = tokenAmountRaw as unknown as bigint | undefined

  const tokenEquivalent = useMemo(() => {
    if (!tokenAmount) return undefined
    const formatted = parseFloat(formatTokenAmount(tokenAmount, decimals))
    return formatted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }, [tokenAmount, decimals])

  // Pool deposit fee — same FEE_BPS the contract takes via _takeIncomingFee
  // for earning deposits. Skipped for non-earning deposits (contract path
  // pulls only `amount`, no fee). feeReceiver === address(0) disables it.
  const depositFeePct = useMemo(() => {
    if (!feeConfig || feeConfig.feeBps === 0n) return null
    return Number(feeConfig.feeBps) / 100
  }, [feeConfig])
  // The router does not expose nonEarning — it fixes the value — so the option
  // is hidden on the referral path and must not leak into the fee/confirm copy.
  const effectiveNonEarning = useReferralPath ? false : isNonEarning
  const depositFeeApplies = !!depositFeePct && !effectiveNonEarning

  const depositFeeTokens = useMemo(() => {
    if (!depositFeeApplies || !tokenAmount || !feeConfig) return undefined
    const fee = (tokenAmount * feeConfig.feeBps) / 10000n
    return parseFloat(formatTokenAmount(fee, decimals)).toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  }, [depositFeeApplies, tokenAmount, feeConfig, decimals])

  // Floor the wallet balance to 2 decimals (don't round) so the displayed
  // value never exceeds what the user actually has — typing the shown value
  // back into the deposit field shouldn't trip an insufficient-balance check.
  const balanceInUsd = useMemo(() => {
    if (balanceCreditRaw === undefined) return undefined
    const raw = parseFloat(
      formatTokenAmount(balanceCreditRaw as unknown as bigint, stableDecimals)
    )
    const floored = Math.floor(raw * 100) / 100
    return floored.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }, [balanceCreditRaw, stableDecimals])

  const isBelowMinimum = useMemo(() => {
    if (!parsedDollarAmount || !minimumDepositValue) return false
    return parsedDollarAmount < minimumDepositValue
  }, [parsedDollarAmount, minimumDepositValue])

  const minimumForDisplay = useMemo(() => {
    if (!minimumDepositValue) return null
    return parseFloat(
      formatTokenAmount(minimumDepositValue, stableDecimals)
    ).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }, [minimumDepositValue, stableDecimals])

  const insufficientBalance = useMemo(() => {
    if (!tokenAmount || userTokenBalance === undefined) return false
    return tokenAmount > userTokenBalance
  }, [tokenAmount, userTokenBalance])

  const needsApproval = useMemo(() => {
    if (!tokenAmount) return false
    if (currentAllowance === undefined) return true
    return currentAllowance < tokenAmount
  }, [tokenAmount, currentAllowance])

  const handleApprove = async () => {
    if (!tokenAmount || !selectedAsset || !depositSpender) return
    setIsProcessing(true)
    try {
      const approvalAmount = tokenAmount + tokenAmount / 10n
      await approveToken(approvalAmount, selectedAsset, depositSpender)
      await refetchAllowance()
      toast({
        title: '\u2705 Approval Successful',
        description: `Approved ${tokenEquivalent} ${symbol}. You can now deposit.`
      })
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Approval Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const canDeposit =
    !!tokenAmount &&
    !insufficientBalance &&
    !isBelowMinimum &&
    selectedAsset !== undefined &&
    selectedTier !== undefined &&
    !isReferralBlocked

  const handleDepositClick = () => {
    if (!canDeposit) return
    setShowConfirmDialog(true)
  }

  // Standard modal contract: stays open while the tx runs (spinner on the
  // confirm button, dismissal blocked) and closes only on success.
  const handleConfirmDeposit = async () => {
    if (!tokenAmount || !selectedAsset) return
    setIsProcessing(true)
    try {
      if (gate.status === 'ready') {
        // Same token / amount / lockDuration as the plain path \u2014 only the
        // contract being called and the extra referral args differ. The router
        // fixes nonEarning, so it is not passed (and is hidden in the form).
        const { outcome } = await depositWithReferral(
          selectedAsset,
          tokenAmount,
          selectedLockDuration,
          gate.referrer,
          gate.commissions
        )
        // Deliberately generic \u2014 the rate is the referrer's business, not the
        // depositor's, and quoting a percentage here invites questions about a
        // number the depositor has no stake in.
        const commissionNote =
          outcome.kind === 'paid'
            ? ' A referral commission was awarded to the referrer.'
            : outcome.kind === 'skipped'
              ? ` The deposit succeeded, but the referral commission was skipped \u2014 ${describeSkipReason(outcome.reason)}.`
              : ''
        toast({
          title: '\u2705 Deposit Successful',
          description: `Deposited $${amount} (${tokenEquivalent} ${symbol}) into the liquidity pool.${commissionNote}`
        })
      } else {
        await deposit(
          selectedAsset,
          tokenAmount,
          selectedLockDuration,
          isNonEarning
        )
        toast({
          title: '\u2705 Deposit Successful',
          description: `Deposited $${amount} (${tokenEquivalent} ${symbol})${isNonEarning ? ' as non-earning liquidity' : ' into the liquidity pool'}.`
        })
      }
      setAmount('')
      setShowConfirmDialog(false)
      await refetchBalance()
      await refetchAllowance()
      await refetch()
    } catch (err: unknown) {
      // Broadcast but unconfirmed. Claiming failure would be wrong — the
      // deposit may land seconds later — so say exactly what is known and let
      // the user out of the dialog either way.
      if (err instanceof TransactionPendingError) {
        setShowConfirmDialog(false)
        toast({
          title: '\u23F3 Deposit Submitted',
          description:
            'Your deposit was sent but is taking longer than usual to confirm. It may still go through — check your wallet or the block explorer before trying again.'
        })
      } else {
        handleContractError(err as ContractError, toast, 'Deposit Failed')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAssetChange = (index: number) => {
    setSelectedAssetIndex(index)
    setSelectedTierIndex(null)
    setAmount('')
  }

  const requiresSwap =
    selectedAsset !== undefined &&
    stableTokenAddress !== undefined &&
    selectedAsset.toLowerCase() !== stableTokenAddress.toLowerCase()

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
        {/* Token Selector */}
        {depositableAssets.length > 0 && (
          <div className='flex gap-2'>
            {depositableAssets.map((asset, idx) => (
              <AssetButton
                key={asset}
                address={asset}
                isSelected={selectedAssetIndex === idx}
                onClick={() => handleAssetChange(idx)}
              />
            ))}
          </div>
        )}

        <div className='space-y-2'>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground'>
              $
            </span>
            <Input
              type='number'
              placeholder='0.00'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='pl-7 pr-16'
              min='0'
              step='any'
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground'>
              USD
            </span>
          </div>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>
              {tokenEquivalent ? `~${tokenEquivalent} ${symbol}` : '\u00A0'}
            </span>
            <span>
              {selectedAsset && balanceInUsd
                ? `Balance: $${balanceInUsd} USD`
                : '\u00A0'}
            </span>
          </div>
        </div>

        {/* Lock Duration + Interest Multiplier */}
        {enabledTiers.length > 0 && (
          <div className='space-y-1.5'>
            <label className='text-xs font-medium text-muted-foreground'>
              Lock Duration · Interest Multiplier
            </label>
            <div className='flex gap-2 flex-wrap'>
              {enabledTiers.map((tier, idx) => {
                const mult = Number(tier.interestMultiplier) / 100
                return (
                  <Button
                    key={idx}
                    variant={selectedTierIndex === idx ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedTierIndex(idx)}
                    className='text-xs'
                  >
                    {formatLockDuration(tier.duration)} · {mult}x
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* The referral router fixes nonEarning, so the choice isn't offered
            on that path. */}
        {!useReferralPath && (
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={isNonEarning}
              onChange={(e) => setIsNonEarning(e.target.checked)}
              className='h-3.5 w-3.5 rounded border-border accent-yellow-500'
            />
            <span
              className={`text-xs ${isNonEarning ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              Deposit as non-earning
              {isNonEarning &&
                ' — will not earn interest from borrower payments'}
            </span>
          </label>
        )}

        {requiresSwap && (
          <p className='text-xs text-muted-foreground'>
            This token will be converted to stablecoins via DCA swap after
            deposit.
          </p>
        )}

        <div className='flex-1 space-y-1'>
          {isBelowMinimum && minimumForDisplay && (
            <p className='text-sm text-destructive'>
              Minimum deposit is ${minimumForDisplay} USD.
            </p>
          )}
          {insufficientBalance && (
            <p className='text-sm text-destructive'>
              Insufficient balance. You need ~{tokenEquivalent} {symbol} but
              your balance is only worth ${balanceInUsd ?? '0'} USD.
            </p>
          )}
          {/* The Deposit button used to sit inexplicably disabled when a
              required choice was missing (or no tiers are enabled, in which
              case the tier section doesn't render at all) — say why. */}
          {/* The banner above carries the full reason and the remedy; this is
              only so the disabled button is never left unexplained. */}
          {gate.status === 'blocked' && (
            <p className='text-sm text-destructive'>
              Deposits require a valid referral link — see the notice above.
            </p>
          )}
          {gate.status === 'checking' && (
            <p className='text-sm text-muted-foreground'>
              Verifying your referral link…
            </p>
          )}
          {amount && selectedAsset === undefined && (
            <p className='text-sm text-muted-foreground'>
              Select a token above to continue.
            </p>
          )}
          {selectedAsset !== undefined && enabledTiers.length === 0 && (
            <p className='text-sm text-destructive'>
              No lock durations are currently enabled for this token — deposits
              are unavailable.
            </p>
          )}
          {amount &&
            selectedAsset !== undefined &&
            enabledTiers.length > 0 &&
            selectedTier === undefined &&
            !isBelowMinimum &&
            !insufficientBalance && (
              <p className='text-sm text-muted-foreground'>
                Select a lock duration to continue.
              </p>
            )}
        </div>

        <div>
          {needsApproval &&
          tokenAmount &&
          !insufficientBalance &&
          !isBelowMinimum &&
          !isReferralBlocked ? (
            <Button
              onClick={handleApprove}
              disabled={isProcessing || !tokenAmount}
              className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
            >
              {isProcessing ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' /> Approving...
                </>
              ) : (
                `Approve ${symbol}`
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDepositClick}
              disabled={isProcessing || !canDeposit}
              className='w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
            >
              {isProcessing ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />{' '}
                  Depositing...
                </>
              ) : (
                'Deposit'
              )}
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          if (!open && isProcessing) return
          setShowConfirmDialog(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deposit</DialogTitle>
            <DialogDescription>
              Check the details below, then confirm to sign.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {/* The figures are a table of facts, so they read as one — scanning
                five separate sentences for numbers is what made this hard. */}
            <dl className='divide-y divide-border overflow-hidden rounded-lg border border-border'>
              <DetailRow
                label='You deposit'
                value={`$${amount} USD`}
                sub={
                  tokenEquivalent ? `~${tokenEquivalent} ${symbol}` : undefined
                }
              />
              <DetailRow
                label='Locked for'
                value={formatLockDurationLong(selectedLockDuration)}
              />
              {selectedTier && !effectiveNonEarning && (
                <DetailRow
                  label='Interest multiplier'
                  value={`${Number(selectedTier.interestMultiplier) / 100}x`}
                />
              )}
              {depositFeeApplies && (
                <DetailRow
                  label={`Deposit fee (${depositFeePct}%)`}
                  value={
                    depositFeeTokens
                      ? `~${depositFeeTokens} ${symbol}`
                      : 'Applies'
                  }
                  sub='Taken on top of the deposit amount'
                />
              )}
              {depositNativeFee !== undefined && depositNativeFee > 0n && (
                <DetailRow
                  label='Network fee'
                  value={`~${Number(
                    formatEther(depositNativeFee)
                  ).toLocaleString('en-US', {
                    maximumFractionDigits: 4
                  })} ${nativeCurrencySymbol}`}
                />
              )}
              {gate.status === 'ready' && (
                <DetailRow
                  label='Referral credited to'
                  value={truncateAddress(gate.referrer)}
                  mono
                />
              )}
            </dl>

            {/* Anything that needs a sentence rather than a number. */}
            {(requiresSwap || gate.status === 'ready') && (
              <div className='space-y-1.5 text-xs text-muted-foreground'>
                {requiresSwap && (
                  <p>
                    Your {symbol} will be queued for conversion to stablecoins
                    via the SwapScheduler.
                  </p>
                )}
                {gate.status === 'ready' && (
                  <p>
                    Your liquidity position is unaffected and still goes to your
                    wallet.
                  </p>
                )}
              </div>
            )}

            {effectiveNonEarning && (
              <p className='rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'>
                This is a non-earning deposit. You will not earn interest from
                borrower payments on this deposit.
              </p>
            )}
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeposit}
              disabled={isProcessing}
              className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
            >
              {isProcessing ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' /> Depositing…
                </>
              ) : (
                'Confirm Deposit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** One fact in the confirm dialog: label on the left, value on the right. */
function DetailRow({
  label,
  value,
  sub,
  mono = false
}: {
  label: string
  value: string
  sub?: string
  mono?: boolean
}) {
  return (
    <div className='flex items-start justify-between gap-4 px-3 py-2.5'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='text-right'>
        <div
          className={`text-sm font-semibold text-foreground ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </div>
        {sub && <div className='text-xs text-muted-foreground'>{sub}</div>}
      </dd>
    </div>
  )
}

// Small helper component to show asset button with its symbol
function AssetButton({
  address,
  isSelected,
  onClick
}: {
  address: `0x${string}`
  isSelected: boolean
  onClick: () => void
}) {
  const { data: symbol } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!address }
  })

  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      size='sm'
      onClick={onClick}
      className='text-xs'
    >
      {(symbol as string) ?? address.slice(0, 6) + '...'}
    </Button>
  )
}
