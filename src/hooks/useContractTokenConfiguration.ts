import { useMemo } from 'react'
import { useReadContract, usePublicClient } from 'wagmi'
import {
  useReadLoansPrecision,
  useReadLoansLoanToken,
  useReadLoansOriginationFeeToken
} from '../generated'
import erc20Abi from '../abis/ERC20.json'
import {
  ContractDecimals,
  calculateDecimalPlaces,
  validateContractDecimals,
  DecimalError
} from '../utils/decimals'

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
  precision: bigint
  precisionDecimals: number
  ltvDecimals: number
  interestRateDecimals: number
}

export interface UseContractTokenConfigurationResult {
  tokenConfig: ContractTokenConfiguration | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to fetch and cache all contract token configuration including symbols and decimals
 * Fetches PRECISION from Loans contract, token addresses, and ERC20 metadata
 */
export function useContractTokenConfiguration(): UseContractTokenConfigurationResult {
  const publicClient = usePublicClient()
  
  // Get native token info from chain config
  const nativeTokenSymbol = publicClient?.chain?.nativeCurrency?.symbol ?? 'ETH'
  const nativeTokenDecimals = publicClient?.chain?.nativeCurrency?.decimals ?? 18

  // Fetch PRECISION constant from Loans contract
  const {
    data: precision,
    isLoading: precisionLoading,
    error: precisionError
  } = useReadLoansPrecision()

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
    precisionLoading ||
    loanTokenLoading ||
    feeTokenLoading ||
    loanDecimalsLoading ||
    loanSymbolLoading ||
    feeDecimalsLoading ||
    feeSymbolLoading

  // Collect all errors
  const error =
    precisionError ||
    loanTokenError ||
    feeTokenError ||
    loanDecimalsError ||
    loanSymbolError ||
    feeDecimalsError ||
    feeSymbolError

  // Memoize the token configuration
  const tokenConfig = useMemo((): ContractTokenConfiguration | undefined => {
    if (
      !precision ||
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
      // Calculate precision decimals from the contract PRECISION constant
      const precisionDecimals = calculateDecimalPlaces(precision)

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
        precision,
        precisionDecimals,
        ltvDecimals: 6, // LTV uses 1e6 precision on contract
        interestRateDecimals: 6 // Interest rates use 1e6 precision on contract
      }

      return config
    } catch (err) {
      return undefined
    }
  }, [
    precision,
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