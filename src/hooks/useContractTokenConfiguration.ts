import { useMemo } from 'react'
import { useReadContract, usePublicClient } from 'wagmi'
import {
  useReadLoansLoanToken,
  useReadLoansOriginationFeeToken,
  useReadLoansLtvDecimals,
  useReadLoansAprDecimals
} from '../generated'
import erc20Abi from '../abis/ERC20.json'
import { DEFAULT_DECIMALS } from '../constants'

// Export types for use in other hooks
export interface TokenInfo {
  address: `0x${string}`
  symbol: string
  decimals: number
}

// Main configuration interface combining all token data
export interface ContractTokenConfiguration {
  loanToken: TokenInfo
  feeToken: TokenInfo
  nativeToken: {
    symbol: string
    decimals: number
  }
  ltvDecimals: number
  aprDecimals: number
}

export interface UseContractTokenConfigurationResult {
  tokenConfig: ContractTokenConfiguration | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to fetch and cache contract token configuration including symbols and decimals.
 * Collateral token info (decimals, symbol) now comes from useCollateralManager per-token.
 */
export function useContractTokenConfiguration(): UseContractTokenConfigurationResult {
  const publicClient = usePublicClient()

  const nativeTokenSymbol =
    publicClient?.chain?.nativeCurrency?.symbol ?? 'LEMX'

  const {
    data: ltvDecimals,
    isLoading: ltvDecimalsLoading,
    error: ltvDecimalsError
  } = useReadLoansLtvDecimals()

  const {
    data: aprDecimals,
    isLoading: aprDecimalsLoading,
    error: aprDecimalsError
  } = useReadLoansAprDecimals()

  const {
    data: loanTokenAddress,
    isLoading: loanTokenLoading,
    error: loanTokenError
  } = useReadLoansLoanToken()

  const {
    data: feeTokenAddress,
    isLoading: feeTokenLoading,
    error: feeTokenError
  } = useReadLoansOriginationFeeToken()

  const {
    data: loanTokenDecimals,
    isLoading: loanDecimalsLoading,
    error: loanDecimalsError
  } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!loanTokenAddress }
  })

  const {
    data: loanTokenSymbol,
    isLoading: loanSymbolLoading,
    error: loanSymbolError
  } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!loanTokenAddress }
  })

  const {
    data: feeTokenDecimals,
    isLoading: feeDecimalsLoading,
    error: feeDecimalsError
  } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!feeTokenAddress }
  })

  const {
    data: feeTokenSymbol,
    isLoading: feeSymbolLoading,
    error: feeSymbolError
  } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!feeTokenAddress }
  })

  const isLoading =
    ltvDecimalsLoading ||
    aprDecimalsLoading ||
    loanTokenLoading ||
    feeTokenLoading ||
    loanDecimalsLoading ||
    loanSymbolLoading ||
    feeDecimalsLoading ||
    feeSymbolLoading

  const error =
    ltvDecimalsError ||
    aprDecimalsError ||
    loanTokenError ||
    feeTokenError ||
    loanDecimalsError ||
    loanSymbolError ||
    feeDecimalsError ||
    feeSymbolError

  const tokenConfig = useMemo((): ContractTokenConfiguration | undefined => {
    if (
      ltvDecimals === undefined ||
      aprDecimals === undefined ||
      !loanTokenAddress ||
      !feeTokenAddress ||
      loanTokenDecimals === undefined ||
      feeTokenDecimals === undefined ||
      !loanTokenSymbol ||
      !feeTokenSymbol
    ) {
      return undefined
    }

    try {
      return {
        loanToken: {
          address: loanTokenAddress,
          symbol: loanTokenSymbol as string,
          decimals: Number(loanTokenDecimals)
        },
        feeToken: {
          address: feeTokenAddress,
          symbol: feeTokenSymbol as string,
          decimals: Number(feeTokenDecimals)
        },
        nativeToken: {
          symbol: nativeTokenSymbol,
          decimals: DEFAULT_DECIMALS.NATIVE_TOKEN
        },
        ltvDecimals: Number(ltvDecimals),
        aprDecimals: Number(aprDecimals)
      }
    } catch {
      return undefined
    }
  }, [
    ltvDecimals,
    aprDecimals,
    loanTokenAddress,
    feeTokenAddress,
    loanTokenDecimals,
    loanTokenSymbol,
    feeTokenDecimals,
    feeTokenSymbol,
    nativeTokenSymbol
  ])

  return {
    tokenConfig,
    isLoading,
    error: error || null
  }
}

/**
 * Backward compatibility export
 */
export const useContractDecimals = useContractTokenConfiguration
