import {
  useReadLoansCollateralManager,
  useReadLoansLiquidityPool,
  liquidityPoolAbi,
  loansAddress
} from '@/src/generated'
import { useChainId, useReadContract } from 'wagmi'

/**
 * Resolves all protocol contract addresses from a single Loans address in env.
 *
 * Only NEXT_PUBLIC_*_LOANS_ADDRESS is required. The remaining addresses are
 * discovered on-chain:
 *   CollateralManager  = Loans.collateralManager()
 *   LiquidityPool      = Loans.liquidityPool()
 *   SwapManager        = LiquidityPool.swapManager()
 *
 * All addresses are undefined while their underlying read is pending, so
 * consumers must gate dependent reads/writes on the address being defined.
 */
export function useProtocolAddresses() {
  const chainId = useChainId()
  const loans = loansAddress[chainId as keyof typeof loansAddress] as
    | `0x${string}`
    | undefined

  const {
    data: collateralManager,
    isLoading: cmLoading,
    error: cmError
  } = useReadLoansCollateralManager()

  const {
    data: liquidityPool,
    isLoading: lpLoading,
    error: lpError
  } = useReadLoansLiquidityPool()

  // Use useReadContract directly — the generated hook hits TS deep-instantiation limits.
  const {
    data: swapManager,
    isLoading: smLoading,
    error: smError
  } = useReadContract({
    address: liquidityPool as `0x${string}` | undefined,
    abi: liquidityPoolAbi,
    functionName: 'swapManager',
    query: { enabled: !!liquidityPool }
  })

  return {
    loans,
    collateralManager: collateralManager as `0x${string}` | undefined,
    liquidityPool: liquidityPool as `0x${string}` | undefined,
    swapManager: swapManager as `0x${string}` | undefined,
    isLoading: cmLoading || lpLoading || smLoading,
    error: cmError ?? lpError ?? smError ?? null
  }
}
