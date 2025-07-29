import { useMemo } from 'react'
import { useReadContract, usePublicClient } from 'wagmi'
import {
  useReadLoansLoanToken,
  useReadLoansOriginationFeeToken,
  useReadLoansLtvDecimals,
  useReadLoansAprDecimals,
  useReadLoansCollateralTokenDecimals,
  useReadLoansCollateralTokenPriceDecimals
} from '../generated'
import erc20Abi from '../abis/ERC20.json'

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
  collateralTokenDecimals: number
  collateralTokenPriceDecimals: number
}

export interface UseContractTokenConfigurationResult {
  tokenConfig: ContractTokenConfiguration | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to fetch and cache all contract token configuration including symbols and decimals
 * Fetches precision constants, token addresses, and ERC20 metadata from Loans contract
 */
export function useContractTokenConfiguration(): UseContractTokenConfigurationResult {
  const publicClient = usePublicClient()
  
  // Get native token info from chain config
  const nativeTokenSymbol = publicClient?.chain?.nativeCurrency?.symbol ?? "LEMX"
  const nativeTokenDecimals = publicClient?.chain?.nativeCurrency?.decimals ?? 18

  // Fetch precision constants from Loans contract
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
    data: collateralTokenDecimals,
    isLoading: collateralTokenDecimalsLoading,
    error: collateralTokenDecimalsError
  } = useReadLoansCollateralTokenDecimals()
  
  const {
    data: collateralTokenPriceDecimals,
    isLoading: collateralTokenPriceDecimalsLoading,
    error: collateralTokenPriceDecimalsError
  } = useReadLoansCollateralTokenPriceDecimals()

  // Fetch loan token address
  const {
    data: loanTokenAddress,
    isLoading: loanTokenLoading,
    error: loanTokenError
  } = useReadLoansLoanToken()

  // Fetch fee token address
  const {
    data: feeTokenAddress,
    isLoading: feeTokenLoading,
    error: feeTokenError
  } = useReadLoansOriginationFeeToken()

  // Fetch loan token decimals
  const {
    data: loanTokenDecimals,
    isLoading: loanDecimalsLoading,
    error: loanDecimalsError
  } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!loanTokenAddress
    }
  })

  // Fetch loan token symbol
  const {
    data: loanTokenSymbol,
    isLoading: loanSymbolLoading,
    error: loanSymbolError
  } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!loanTokenAddress
    }
  })

  // Fetch fee token decimals
  const {
    data: feeTokenDecimals,
    isLoading: feeDecimalsLoading,
    error: feeDecimalsError
  } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!feeTokenAddress
    }
  })

  // Fetch fee token symbol
  const {
    data: feeTokenSymbol,
    isLoading: feeSymbolLoading,
    error: feeSymbolError
  } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!feeTokenAddress
    }
  })

  // Calculate loading state
  const isLoading =
    ltvDecimalsLoading ||
    aprDecimalsLoading ||
    collateralTokenDecimalsLoading ||
    collateralTokenPriceDecimalsLoading ||
    loanTokenLoading ||
    feeTokenLoading ||
    loanDecimalsLoading ||
    loanSymbolLoading ||
    feeDecimalsLoading ||
    feeSymbolLoading

  // Collect all errors
  const error =
    ltvDecimalsError ||
    aprDecimalsError ||
    collateralTokenDecimalsError ||
    collateralTokenPriceDecimalsError ||
    loanTokenError ||
    feeTokenError ||
    loanDecimalsError ||
    loanSymbolError ||
    feeDecimalsError ||
    feeSymbolError

  // Memoize the token configuration
  const tokenConfig = useMemo((): ContractTokenConfiguration | undefined => {
    if (
      ltvDecimals === undefined ||
      aprDecimals === undefined ||
      collateralTokenDecimals === undefined ||
      collateralTokenPriceDecimals === undefined ||
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
      const config: ContractTokenConfiguration = {
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
          decimals: nativeTokenDecimals
        },
        ltvDecimals: Number(ltvDecimals),
        aprDecimals: Number(aprDecimals),
        collateralTokenDecimals: Number(collateralTokenDecimals),
        collateralTokenPriceDecimals: Number(collateralTokenPriceDecimals)
      }

      return config
    } catch (err) {
      return undefined
    }
  }, [
    ltvDecimals,
    aprDecimals,
    collateralTokenDecimals,
    collateralTokenPriceDecimals,
    loanTokenAddress,
    feeTokenAddress,
    loanTokenDecimals,
    loanTokenSymbol,
    feeTokenDecimals,
    feeTokenSymbol,
    nativeTokenSymbol,
    nativeTokenDecimals
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