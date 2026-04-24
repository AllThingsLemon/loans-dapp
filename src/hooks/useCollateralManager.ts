import { useState, useMemo } from 'react'
import { useReadContract } from 'wagmi'
import {
  useReadCollateralManagerGetSupportedAssets,
  useReadCollateralManagerGetAssetConfig
} from '../generated'
import erc20Abi from '../abis/ERC20.json'
import { useProtocolAddresses } from './useProtocolAddresses'

export interface CollateralTokenInfo {
  address: `0x${string}`
  symbol: string
  decimals: number
}

export interface UseCollateralManagerReturn {
  supportedCollateralTokens: CollateralTokenInfo[]
  selectedCollateral: CollateralTokenInfo | undefined
  setSelectedCollateral: (token: CollateralTokenInfo | undefined) => void
  getCollateralByAddress: (addr: string) => CollateralTokenInfo | undefined
  isLoading: boolean
  error: Error | null
}

// Internal hook to load a single asset's metadata
function useCollateralAsset(
  cmAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined
): { info: CollateralTokenInfo | undefined; isLoading: boolean; error: Error | null } {
  const { data: config, isLoading: configLoading, error: configError } =
    useReadCollateralManagerGetAssetConfig({
      address: cmAddress,
      args: tokenAddress ? [tokenAddress] : undefined,
      query: { enabled: !!cmAddress && !!tokenAddress }
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
function useCollateralAssets(
  cmAddress: `0x${string}` | undefined,
  addresses: readonly `0x${string}`[]
) {
  const a0 = useCollateralAsset(cmAddress, addresses[0])
  const a1 = useCollateralAsset(cmAddress, addresses[1])
  const a2 = useCollateralAsset(cmAddress, addresses[2])
  const a3 = useCollateralAsset(cmAddress, addresses[3])
  const a4 = useCollateralAsset(cmAddress, addresses[4])
  const a5 = useCollateralAsset(cmAddress, addresses[5])
  const a6 = useCollateralAsset(cmAddress, addresses[6])
  const a7 = useCollateralAsset(cmAddress, addresses[7])

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
  const { collateralManager: cmAddress } = useProtocolAddresses()
  const [selectedCollateral, setSelectedCollateral] = useState<
    CollateralTokenInfo | undefined
  >(undefined)

  const {
    data: supportedAssetAddresses,
    isLoading: assetsLoading,
    error: assetsError
  } = useReadCollateralManagerGetSupportedAssets({
    address: cmAddress,
    query: { enabled: !!cmAddress }
  })

  const allowedAddresses = useMemo(
    () =>
      (supportedAssetAddresses ?? []).filter(
        (addr): addr is `0x${string}` => !!addr
      ),
    [supportedAssetAddresses]
  )

  const { infos: supportedCollateralTokens, isLoading: metaLoading, error: metaError } =
    useCollateralAssets(cmAddress, allowedAddresses)

  // No auto-selection — the user must always explicitly pick a collateral token
  // before the loan calculator is usable. This is enforced in the LoanParameters UI.

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
    getCollateralByAddress,
    isLoading: assetsLoading || metaLoading,
    error: assetsError ?? metaError ?? null
  }
}
