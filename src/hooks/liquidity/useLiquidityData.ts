import { useMemo, useCallback } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import {
  useReadLiquidityPoolStableToken,
  useReadLiquidityPoolLockDuration,
  liquidityPoolAddress,
  liquidityPoolAbi,
  useReadLoansGetLiquidityStatus,
  useReadLoansTotalLoansIssued,
  useReadLoansCumulativeLoanValue,
} from '@/src/generated'
import {
  parseUserStatus,
  parsePoolStatus,
  parseLiquidityStatus,
} from '@/src/types/liquidity'
import type {
  UserStatus,
  PoolStatus,
  LockEntry,
  FeeConfig,
  LiquidityStatus,
} from '@/src/types/liquidity'

export interface UseLiquidityDataReturn {
  // User data
  userStatus: UserStatus | undefined
  lockEntries: LockEntry[]
  hasPosition: boolean

  // Pool data
  poolStatus: PoolStatus | undefined
  feeConfig: FeeConfig | undefined

  // Loans contract data
  liquidityStatus: LiquidityStatus | undefined
  totalLoansIssued: bigint | undefined
  cumulativeLoanValue: bigint | undefined

  // Token info
  stableTokenAddress: `0x${string}` | undefined
  stableTokenSymbol: string | undefined
  stableTokenDecimals: number | undefined

  // User balance & allowance
  userTokenBalance: bigint | undefined
  currentAllowance: bigint | undefined

  // Lock duration (seconds)
  lockDuration: bigint | undefined

  // Contract address
  liquidityPoolContractAddress: `0x${string}` | undefined

  // States
  isLoading: boolean
  error: Error | null

  // Utility
  refetch: () => Promise<void>
}

export function useLiquidityData(): UseLiquidityDataReturn {
  const { address } = useAccount()
  const chainId = useChainId()

  const liquidityPoolContractAddress =
    liquidityPoolAddress[chainId as keyof typeof liquidityPoolAddress]

  // Get stable token address from LiquidityPool
  const {
    data: stableTokenAddress,
    isLoading: stableTokenLoading,
    error: stableTokenError,
  } = useReadLiquidityPoolStableToken()

  // Get stable token metadata
  const { data: stableTokenSymbol } = useReadContract({
    address: stableTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!stableTokenAddress },
  })

  const { data: stableTokenDecimals } = useReadContract({
    address: stableTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!stableTokenAddress },
  })

  // Get user's stable token balance
  const { data: userTokenBalance, refetch: refetchBalance } = useReadContract({
    address: stableTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!stableTokenAddress && !!address },
  })

  // Get user's allowance for LiquidityPool
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: stableTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      address && liquidityPoolContractAddress
        ? [address, liquidityPoolContractAddress]
        : undefined,
    query: {
      enabled: !!stableTokenAddress && !!address && !!liquidityPoolContractAddress,
    },
  })

  // LiquidityPool reads (use useReadContract to avoid deep type instantiation)
  const {
    data: userStatusRaw,
    isLoading: userStatusLoading,
    error: userStatusError,
    refetch: refetchUserStatus,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getUserStatus',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  const {
    data: poolStatusRaw,
    isLoading: poolStatusLoading,
    error: poolStatusError,
    refetch: refetchPoolStatus,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getPoolStatus',
    query: { refetchInterval: 10000 },
  })

  // Use useReadContract with liquidityPoolAbi to avoid deep type instantiation errors
  const {
    data: depositEntriesRaw,
    isLoading: depositEntriesLoading,
    error: depositEntriesError,
    refetch: refetchDepositEntries,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getUserDepositEntries',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Fee config: separate calls for FEE_BPS and feeReceiver (use useReadContract to avoid deep type instantiation)
  const {
    data: feeBps,
    isLoading: feeBpsLoading,
    error: feeBpsError,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'FEE_BPS',
  })

  const {
    data: feeReceiverRaw,
    isLoading: feeReceiverLoading,
    error: feeReceiverError,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'feeReceiver',
  })

  // Loans contract reads
  const {
    data: liquidityStatusRaw,
    isLoading: liquidityStatusLoading,
    error: liquidityStatusError,
    refetch: refetchLiquidityStatus,
  } = useReadLoansGetLiquidityStatus()

  const {
    data: totalLoansIssued,
    isLoading: totalLoansLoading,
  } = useReadLoansTotalLoansIssued()

  const {
    data: cumulativeLoanValue,
    isLoading: cumulativeLoanLoading,
  } = useReadLoansCumulativeLoanValue()

  const {
    data: lockDuration,
    isLoading: lockDurationLoading,
  } = useReadLiquidityPoolLockDuration()

  // Parse data
  const userStatus = useMemo(() => {
    if (!userStatusRaw) return undefined
    return parseUserStatus(userStatusRaw as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint])
  }, [userStatusRaw])

  const poolStatus = useMemo(() => {
    if (!poolStatusRaw) return undefined
    return parsePoolStatus(poolStatusRaw as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint])
  }, [poolStatusRaw])

  const feeConfig = useMemo((): FeeConfig | undefined => {
    if (feeBps === undefined || feeReceiverRaw === undefined) return undefined
    return {
      feeBps: feeBps as unknown as bigint,
      feeReceiver: feeReceiverRaw as unknown as `0x${string}`,
    }
  }, [feeBps, feeReceiverRaw])

  const liquidityStatus = useMemo(() => {
    if (!liquidityStatusRaw) return undefined
    return parseLiquidityStatus(liquidityStatusRaw as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint])
  }, [liquidityStatusRaw])

  const lockEntries = useMemo((): LockEntry[] => {
    if (!depositEntriesRaw) return []
    // DepositEntry: { token, tokenAmount, stableTokenValue, liquidityShares, interestShares, unlockTime, lockDuration }
    return (depositEntriesRaw as any[]).map((entry: any) => ({
      amount: entry.stableTokenValue as bigint,
      unlockTime: entry.unlockTime as bigint,
    }))
  }, [depositEntriesRaw])

  const hasPosition = useMemo(() => {
    if (!userStatus) return false
    return userStatus.totalPrincipal > 0n || userStatus.totalShares > 0n || userStatus.totalNonEarningShares > 0n
  }, [userStatus])

  // Combined states
  const isLoading =
    stableTokenLoading ||
    userStatusLoading ||
    poolStatusLoading ||
    depositEntriesLoading ||
    feeBpsLoading ||
    feeReceiverLoading ||
    liquidityStatusLoading ||
    totalLoansLoading ||
    cumulativeLoanLoading ||
    lockDurationLoading

  const error =
    stableTokenError ||
    userStatusError ||
    poolStatusError ||
    depositEntriesError ||
    feeBpsError ||
    feeReceiverError ||
    liquidityStatusError ||
    null

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchBalance(),
      refetchAllowance(),
      refetchUserStatus(),
      refetchPoolStatus(),
      refetchDepositEntries(),
      refetchLiquidityStatus(),
    ])
  }, [refetchBalance, refetchAllowance, refetchUserStatus, refetchPoolStatus, refetchDepositEntries, refetchLiquidityStatus])

  return {
    userStatus,
    lockEntries,
    hasPosition,
    poolStatus,
    feeConfig,
    liquidityStatus,
    totalLoansIssued,
    cumulativeLoanValue,
    stableTokenAddress,
    stableTokenSymbol: stableTokenSymbol as string | undefined,
    stableTokenDecimals: stableTokenDecimals !== undefined ? Number(stableTokenDecimals) : undefined,
    userTokenBalance: userTokenBalance as bigint | undefined,
    currentAllowance: currentAllowance as bigint | undefined,
    lockDuration,
    liquidityPoolContractAddress,
    isLoading,
    error,
    refetch,
  }
}
