import { useState, useMemo, useEffect } from 'react'
import { useReadContract, useChainId } from 'wagmi'
import {
  useReadCollateralManagerGetSupportedAssets,
  useReadCollateralManagerGetAssetConfig,
  collateralManagerAddress
} from '../generated'
import erc20Abi from '../abis/ERC20.json'

export interface CollateralTokenInfo {
  address: `0x${string}`
  symbol: string
  decimals: number
}

export interface UseCollateralManagerReturn {
  supportedCollateralTokens: CollateralTokenInfo[]
  selectedCollateral: CollateralTokenInfo | undefined
  setSelectedCollateral: (token: CollateralTokenInfo) => void
  collateralManagerAddress: `0x${string}` | undefined
  getCollateralByAddress: (addr: string) => CollateralTokenInfo | undefined
  isLoading: boolean
  error: Error | null
}

// Internal hook to load a single asset's metadata
function useCollateralAsset(
  tokenAddress: `0x${string}` | undefined
): { info: CollateralTokenInfo | undefined; isLoading: boolean; error: Error | null } {
  const { data: config, isLoading: configLoading, error: configError } =
    useReadCollateralManagerGetAssetConfig({
      args: tokenAddress ? [tokenAddress] : undefined,
      query: { enabled: !!tokenAddress }
    })

  const { data: symbol, isLoading: symbolLoading, error: symbolError } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'symbol',
      query: { enabled: !!tokenAddress }
    })

  const info = useMemo((): CollateralTokenInfo | undefined => {
    if (!tokenAddress || !config || !symbol) return undefined
    return {
      address: tokenAddress,
      symbol: symbol as string,
      decimals: config.decimals
    }
  }, [tokenAddress, config, symbol])

  return {
    info,
    isLoading: configLoading || symbolLoading,
    error: (configError || symbolError) ?? null
  }
}

// Wrap the per-asset hook so we can call it for a known set of addresses.
// React hooks must run in the same order every render, so we use fixed slots.
// We load up to 8 assets; add more slots here if collateral options grow past 8.
function useCollateralAssets(addresses: readonly `0x${string}`[]) {
  const a0 = useCollateralAsset(addresses[0])
  const a1 = useCollateralAsset(addresses[1])
  const a2 = useCollateralAsset(addresses[2])
  const a3 = useCollateralAsset(addresses[3])
  const a4 = useCollateralAsset(addresses[4])
  const a5 = useCollateralAsset(addresses[5])
  const a6 = useCollateralAsset(addresses[6])
  const a7 = useCollateralAsset(addresses[7])

  return useMemo(() => {
    const slots = [a0, a1, a2, a3, a4, a5, a6, a7].slice(0, addresses.length)
    return {
      infos: slots.map((s) => s.info).filter((i): i is CollateralTokenInfo => !!i),
      isLoading: slots.some((s) => s.isLoading),
      error: slots.find((s) => s.error)?.error ?? null
    }
  }, [a0, a1, a2, a3, a4, a5, a6, a7, addresses.length])
}

export function useCollateralManager(): UseCollateralManagerReturn {
  const chainId = useChainId()
  const [selectedCollateral, setSelectedCollateral] = useState<
    CollateralTokenInfo | undefined
  >(undefined)

  const cmAddress =
    collateralManagerAddress[chainId as keyof typeof collateralManagerAddress]

  const {
    data: supportedAssetAddresses,
    isLoading: assetsLoading,
    error: assetsError
  } = useReadCollateralManagerGetSupportedAssets()

  // Filter to only allowed assets
  const allowedAddresses = useMemo(
    () =>
      (supportedAssetAddresses ?? []).filter(
        (addr): addr is `0x${string}` => !!addr
      ),
    [supportedAssetAddresses]
  )

  const { infos: supportedCollateralTokens, isLoading: metaLoading, error: metaError } =
    useCollateralAssets(allowedAddresses)

  // Auto-select when exactly one token is configured
  useEffect(() => {
    if (supportedCollateralTokens.length === 1 && !selectedCollateral) {
      setSelectedCollateral(supportedCollateralTokens[0])
    }
  }, [supportedCollateralTokens, selectedCollateral])

  const getCollateralByAddress = useMemo(
    () => (addr: string) =>
      supportedCollateralTokens.find(
        (t) => t.address.toLowerCase() === addr.toLowerCase()
      ),
    [supportedCollateralTokens]
  )

  return {
    supportedCollateralTokens,
    selectedCollateral,
    setSelectedCollateral,
    collateralManagerAddress: cmAddress,
    getCollateralByAddress,
    isLoading: assetsLoading || metaLoading,
    error: assetsError ?? metaError ?? null
  }
}
