import { useMemo, useCallback } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { erc20Abi, parseAbiItem } from 'viem'
import { useQuery } from '@tanstack/react-query'
import {
  liquidityPoolAbi,
  useReadLoansGetLiquidityStatus,
  useReadLoansTotalLoansIssued,
  useReadLoansCumulativeLoanValue,
} from '@/src/generated'
import { useProtocolAddresses } from '@/src/hooks/useProtocolAddresses'
import {
  parseUserStatus,
  parsePoolStatus,
  parseLiquidityStatus,
} from '@/src/types/liquidity'
import type {
  UserStatus,
  PoolStatus,
  LockEntry,
  DepositEntry,
  FeeConfig,
  LiquidityStatus,
  WithdrawalRequest,
} from '@/src/types/liquidity'

export interface UseLiquidityDataReturn {
  // User data
  userStatus: UserStatus | undefined
  lockEntries: LockEntry[]
  depositEntries: DepositEntry[]
  hasPosition: boolean

  // Pool data
  poolStatus: PoolStatus | undefined
  feeConfig: FeeConfig | undefined

  // Pool reads
  currentUtilization: bigint | undefined
  totalCommittedStableToken: bigint | undefined
  acceptableLiquidityAmount: bigint | undefined

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

  // Withdrawal queue
  withdrawalRequests: { requestIds: bigint[]; requests: WithdrawalRequest[] }

  // Map of "token:unlockTime:lockDuration" → original stableTokenValue at deposit time
  originalDepositValues: Map<string, bigint>

  // Map of token address (lowercase) → { symbol, decimals }
  tokenMetadata: Map<string, { symbol: string; decimals: number }>

  // Contract address
  liquidityPoolContractAddress: `0x${string}` | undefined

  // States
  isLoading: boolean
  error: Error | null

  // Utility
  refetch: () => Promise<void>
}

const DEPOSITED_EVENT = parseAbiItem(
  'event Deposited(address indexed user, address indexed token, uint256 tokenAmount, uint256 stableTokenValue, uint256 liquidityShares, uint256 interestShares, uint256 unlockTime, uint256 lockDuration, bool nonEarning)'
)

export function useLiquidityData(): UseLiquidityDataReturn {
  const { address } = useAccount()
  const publicClient = usePublicClient()

  // LiquidityPool address is resolved on-chain via Loans.liquidityPool()
  const { liquidityPool: liquidityPoolContractAddress } = useProtocolAddresses()

  // Get stable token address from LiquidityPool — use useReadContract directly
  // because the generated hook hits TS deep-instantiation limits when address is overridden.
  const {
    data: stableTokenAddressRaw,
    isLoading: stableTokenLoading,
    error: stableTokenError,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'stableToken',
    query: { enabled: !!liquidityPoolContractAddress },
  })
  const stableTokenAddress = stableTokenAddressRaw as `0x${string}` | undefined

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

  // Withdrawal queue
  const {
    data: withdrawalRequestsRaw,
    refetch: refetchWithdrawalRequests,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getUserWithdrawalRequests',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  // Additional pool reads
  const {
    data: currentUtilizationRaw,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getCurrentUtilization',
    query: { refetchInterval: 10000 },
  })

  const {
    data: totalCommittedStableTokenRaw,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'totalCommittedStableToken',
  })

  const {
    data: acceptableLiquidityAmountRaw,
  } = useReadContract({
    address: liquidityPoolContractAddress,
    abi: liquidityPoolAbi as unknown as any[],
    functionName: 'getAcceptableLiquidityAmount',
    query: { refetchInterval: 10000 },
  })

  // Fetch Deposited events to recover original stableTokenValue per deposit entry
  const { data: depositedLogs } = useQuery({
    queryKey: ['depositedEvents', address, liquidityPoolContractAddress],
    queryFn: async () => {
      if (!publicClient || !address || !liquidityPoolContractAddress) return []
      return publicClient.getLogs({
        address: liquidityPoolContractAddress,
        event: DEPOSITED_EVENT,
        args: { user: address },
        fromBlock: 0n,
      })
    },
    enabled: !!publicClient && !!address && !!liquidityPoolContractAddress,
    staleTime: 30_000,
  })

  const originalDepositValues = useMemo(() => {
    const map = new Map<string, bigint>()
    if (!depositedLogs) return map
    for (const log of depositedLogs) {
      const { token, stableTokenValue, unlockTime, lockDuration } = log.args
      if (token && stableTokenValue !== undefined && unlockTime !== undefined && lockDuration !== undefined) {
        const key = `${token.toLowerCase()}:${unlockTime}:${lockDuration}`
        map.set(key, (map.get(key) ?? 0n) + stableTokenValue)
      }
    }
    return map
  }, [depositedLogs])

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

  const depositEntries = useMemo((): DepositEntry[] => {
    if (!depositEntriesRaw) return []
    return (depositEntriesRaw as any[]).map((entry: any) => ({
      token: entry.token as `0x${string}`,
      tokenAmount: entry.tokenAmount as bigint,
      stableTokenValue: entry.stableTokenValue as bigint,
      liquidityShares: entry.liquidityShares as bigint,
      interestShares: entry.interestShares as bigint,
      unlockTime: entry.unlockTime as bigint,
      lockDuration: entry.lockDuration as bigint,
    }))
  }, [depositEntriesRaw])

  const withdrawalRequests = useMemo(() => {
    if (!withdrawalRequestsRaw) return { requestIds: [], requests: [] }
    const [ids, reqs] = withdrawalRequestsRaw as unknown as readonly [readonly bigint[], readonly {
      user: `0x${string}`
      amount: bigint
      amountFunded: bigint
      liquiditySharesBurned: bigint
      interestSharesBurned: bigint
      requestTime: bigint
    }[]]
    return {
      requestIds: [...ids],
      requests: reqs.map((r): WithdrawalRequest => ({
        user: r.user,
        amount: r.amount,
        amountFunded: r.amountFunded,
        liquiditySharesBurned: r.liquiditySharesBurned,
        interestSharesBurned: r.interestSharesBurned,
        requestTime: r.requestTime,
      })),
    }
  }, [withdrawalRequestsRaw])

  // Fetch symbol + decimals for each unique token address in deposit entries
  const uniqueTokenAddresses = useMemo(() => {
    const seen = new Set<string>()
    for (const entry of depositEntries) {
      seen.add(entry.token.toLowerCase())
    }
    return [...seen] as `0x${string}`[]
  }, [depositEntries])

  const { data: tokenMetadata = new Map() } = useQuery({
    queryKey: ['tokenMetadata', uniqueTokenAddresses],
    queryFn: async (): Promise<Map<string, { symbol: string; decimals: number }>> => {
      if (!publicClient || uniqueTokenAddresses.length === 0) return new Map()
      const results = await Promise.all(
        uniqueTokenAddresses.map(async (token) => {
          const [symbol, decimals] = await Promise.all([
            publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'symbol' }),
            publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' }),
          ])
          return [token, { symbol: symbol as string, decimals: Number(decimals) }] as const
        })
      )
      return new Map(results)
    },
    enabled: !!publicClient && uniqueTokenAddresses.length > 0,
    staleTime: Infinity,
  })

  const hasPosition = useMemo(() => {
    if (!userStatus) return false
    return userStatus.totalPrincipal > 0n || userStatus.liquidityShares > 0n
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
    cumulativeLoanLoading

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
      refetchWithdrawalRequests(),
    ])
  }, [refetchBalance, refetchAllowance, refetchUserStatus, refetchPoolStatus, refetchDepositEntries, refetchLiquidityStatus, refetchWithdrawalRequests])

  return {
    userStatus,
    lockEntries,
    depositEntries,
    hasPosition,
    poolStatus,
    feeConfig,
    currentUtilization: currentUtilizationRaw as bigint | undefined,
    totalCommittedStableToken: totalCommittedStableTokenRaw as bigint | undefined,
    acceptableLiquidityAmount: acceptableLiquidityAmountRaw as bigint | undefined,
    liquidityStatus,
    totalLoansIssued,
    cumulativeLoanValue,
    stableTokenAddress,
    stableTokenSymbol: stableTokenSymbol as string | undefined,
    stableTokenDecimals: stableTokenDecimals !== undefined ? Number(stableTokenDecimals) : undefined,
    userTokenBalance: userTokenBalance as bigint | undefined,
    currentAllowance: currentAllowance as bigint | undefined,
    withdrawalRequests,
    originalDepositValues,
    tokenMetadata,
    liquidityPoolContractAddress,
    isLoading,
    error,
    refetch,
  }
}
