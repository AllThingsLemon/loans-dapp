'use client'
import { useState, useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { erc20Abi } from 'viem'
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
import type { LockDurationTier } from '@/src/types/liquidity'
import { liquidityPoolAbi, liquidityPoolAddress } from '@/src/generated'
import PriceDataFeedAbi from '@/src/abis/PriceDataFeed.json'
import { useChainId } from 'wagmi'

function formatLockDuration(duration: bigint): string {
  const s = Number(duration)
  if (s === 0) return '0'
  const years = Math.floor(s / (365.25 * 24 * 3600))
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
  const years = Math.floor(s / (365.25 * 24 * 3600))
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
}

export function AddLiquidityCard({ liquidityPool }: AddLiquidityCardProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isNonEarning, setIsNonEarning] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null)
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null)
  const { toast } = useToast()
  const { address } = useAccount()
  const chainId = useChainId()

  const lpAddress = liquidityPoolAddress[chainId as keyof typeof liquidityPoolAddress]

  const {
    stableTokenAddress,
    liquidityPoolContractAddress,
    approveToken,
    deposit,
    refetch,
  } = liquidityPool

  // Read supported assets from the pool
  const { data: supportedAssetsRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getSupportedAssets',
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
      args: [asset],
    })) as any[],
    query: { enabled: allAssets.length > 0 && !!lpAddress },
  })

  const depositableAssets = useMemo(() => {
    if (!assetConfigsRaw) return []
    return allAssets.filter((_, idx) => {
      const cfg = assetConfigsRaw[idx]?.result as
        | { isEnabled: boolean; isInternalOnly: boolean }
        | undefined
      return cfg?.isEnabled === true && cfg?.isInternalOnly === false
    })
  }, [allAssets, assetConfigsRaw])

  const selectedAsset = selectedAssetIndex !== null ? depositableAssets[selectedAssetIndex] as `0x${string}` | undefined : undefined

  // Read asset config for selected asset
  const { data: assetConfigRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getAssetConfig',
    args: selectedAsset ? [selectedAsset] : undefined,
    query: { enabled: !!selectedAsset },
  })
  const assetConfig = assetConfigRaw as { isEnabled: boolean; isInternalOnly: boolean; usesPriceFeed: boolean; stablePrice: bigint; decimals: number; swapSchedulerId: `0x${string}` } | undefined

  // Read price feed address from LP
  const { data: priceDataFeedAddress } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'priceDataFeed',
  })

  // Read spot price for selected asset when usesPriceFeed is true
  const { data: spotPriceRaw } = useReadContract({
    address: priceDataFeedAddress as `0x${string}` | undefined,
    abi: PriceDataFeedAbi,
    functionName: 'getSpotPrice',
    args: selectedAsset ? [selectedAsset] : undefined,
    query: { enabled: !!priceDataFeedAddress && !!selectedAsset && assetConfig?.usesPriceFeed === true },
  })

  // Token USD price: spot price from feed, or stablePrice from config, in 8 decimals
  const tokenUsdPrice = useMemo((): number | undefined => {
    if (!assetConfig) return undefined
    if (assetConfig.usesPriceFeed) {
      if (spotPriceRaw === undefined) return undefined
      return Number(spotPriceRaw as bigint) / 1e8
    }
    if (assetConfig.stablePrice > 0n) {
      return Number(assetConfig.stablePrice) / 1e8
    }
    return undefined
  }, [assetConfig, spotPriceRaw])

  // Read lock tiers for selected asset
  const { data: lockTiersRaw } = useReadContract({
    address: lpAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getAssetLockTiers',
    args: selectedAsset ? [selectedAsset] : undefined,
    query: { enabled: !!selectedAsset },
  })
  const assetLockTiers = useMemo((): LockDurationTier[] => {
    if (!lockTiersRaw) return []
    return (lockTiersRaw as readonly { duration: bigint; interestMultiplier: bigint; isEnabled: boolean }[]).map(t => ({
      duration: t.duration,
      interestMultiplier: t.interestMultiplier,
      isEnabled: t.isEnabled,
    }))
  }, [lockTiersRaw])

  // Read token metadata for selected asset
  const { data: tokenSymbol } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!selectedAsset },
  })

  const { data: tokenDecimals } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!selectedAsset },
  })

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!selectedAsset && !!address },
  })

  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: selectedAsset,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && liquidityPoolContractAddress ? [address, liquidityPoolContractAddress] : undefined,
    query: { enabled: !!selectedAsset && !!address && !!liquidityPoolContractAddress },
  })

  const decimals = tokenDecimals !== undefined ? Number(tokenDecimals) : 18
  const symbol = (tokenSymbol as string) ?? 'Token'
  const userTokenBalance = tokenBalance as bigint | undefined
  const currentAllowance = tokenAllowance as bigint | undefined

  // Filter to enabled tiers only
  const enabledTiers = useMemo(() => {
    return assetLockTiers.filter((t: LockDurationTier) => t.isEnabled)
  }, [assetLockTiers])

  const selectedTier = selectedTierIndex !== null ? enabledTiers[selectedTierIndex] : undefined

  const selectedLockDuration = useMemo(() => {
    if (selectedTier) return selectedTier.duration
    return 0n
  }, [selectedTier])

  // Input is USD amount — convert to token amount using price
  const tokenAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !tokenUsdPrice) return undefined
    const usdAmount = Number(amount)
    const tokens = usdAmount / tokenUsdPrice
    try {
      return parseTokenAmount(tokens.toFixed(decimals > 8 ? 8 : decimals), decimals)
    } catch {
      return undefined
    }
  }, [amount, tokenUsdPrice, decimals])

  const tokenEquivalent = useMemo(() => {
    if (!tokenAmount) return undefined
    const formatted = parseFloat(formatTokenAmount(tokenAmount, decimals))
    return formatted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [tokenAmount, decimals])

  const formattedBalance = useMemo(() => {
    if (userTokenBalance === undefined) return undefined
    return formatTokenAmount(userTokenBalance, decimals)
  }, [userTokenBalance, decimals])

  const balanceInUsd = useMemo(() => {
    if (userTokenBalance === undefined || !tokenUsdPrice) return undefined
    const tokens = parseFloat(formatTokenAmount(userTokenBalance, decimals))
    return (tokens * tokenUsdPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [userTokenBalance, decimals, tokenUsdPrice])

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
    if (!tokenAmount || !selectedAsset || !liquidityPoolContractAddress) return
    setIsProcessing(true)
    try {
      const approvalAmount = tokenAmount + (tokenAmount / 10n)
      await approveToken(approvalAmount, selectedAsset, liquidityPoolContractAddress)
      await refetchAllowance()
      toast({
        title: '\u2705 Approval Successful',
        description: `Approved ${tokenEquivalent} ${symbol}. You can now deposit.`,
      })
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Approval Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const canDeposit = !!tokenAmount && !insufficientBalance && selectedAsset !== undefined && selectedTier !== undefined

  const handleDepositClick = () => {
    if (!canDeposit) return
    setShowConfirmDialog(true)
  }

  const handleConfirmDeposit = async () => {
    if (!tokenAmount || !selectedAsset) return
    setShowConfirmDialog(false)
    setIsProcessing(true)
    try {
      await deposit(selectedAsset, tokenAmount, selectedLockDuration, isNonEarning)
      toast({
        title: '\u2705 Deposit Successful',
        description: `Deposited $${amount} (${tokenEquivalent} ${symbol})${isNonEarning ? ' as non-earning liquidity' : ' into the liquidity pool'}.`,
      })
      setAmount('')
      await refetchBalance()
      await refetchAllowance()
      await refetch()
    } catch (err: unknown) {
      handleContractError(err as ContractError, toast, 'Deposit Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAssetChange = (index: number) => {
    setSelectedAssetIndex(index)
    setSelectedTierIndex(null)
    setAmount('')
  }

  const requiresSwap = selectedAsset !== undefined && stableTokenAddress !== undefined &&
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
            <label className='text-xs font-medium text-muted-foreground'>Lock Duration · Interest Multiplier</label>
            <div className='flex gap-2 flex-wrap'>
              {enabledTiers.map((tier, idx) => {
                const mult = Number(tier.interestMultiplier) / 10000
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

        {requiresSwap && (
          <p className='text-xs text-muted-foreground'>
            This token will be converted to stablecoins via DCA swap after deposit.
          </p>
        )}

        <div className='flex-1'>
          {insufficientBalance && (
            <p className='text-sm text-destructive'>
              Insufficient balance. You need ~{tokenEquivalent} {symbol} but only have{' '}
              {formattedBalance ? parseFloat(formattedBalance).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0'}{' '}
              {symbol}.
            </p>
          )}
        </div>

        <div>
        {needsApproval && tokenAmount && !insufficientBalance ? (
          <Button
            onClick={handleApprove}
            disabled={isProcessing || !tokenAmount}
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
            disabled={isProcessing || !canDeposit}
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
              You are about to deposit ${amount} USD (~{tokenEquivalent} {symbol}) into the liquidity pool.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <p className='text-sm text-muted-foreground'>
              Your deposit will be locked for <span className='font-semibold text-foreground'>{formatLockDurationLong(selectedLockDuration)}</span>.
              {selectedTier && !isNonEarning && (
                <> Interest share multiplier: <span className='font-semibold text-foreground'>{Number(selectedTier.interestMultiplier) / 10000}x</span>.</>
              )}
            </p>
            {requiresSwap && (
              <p className='text-sm text-muted-foreground'>
                Your {symbol} will be queued for conversion to stablecoins via the SwapScheduler.
              </p>
            )}
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

// Small helper component to show asset button with its symbol
function AssetButton({ address, isSelected, onClick }: {
  address: `0x${string}`
  isSelected: boolean
  onClick: () => void
}) {
  const { data: symbol } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!address },
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
