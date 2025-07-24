import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
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

export interface UseContractDecimalsResult {
  decimals: ContractDecimals | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to fetch and cache all contract decimal configurations
 * Fetches PRECISION from Loans contract and decimals from token contracts
 */
export function useContractDecimals(): UseContractDecimalsResult {
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

  // Calculate loading state
  const isLoading =
    precisionLoading ||
    loanTokenLoading ||
    feeTokenLoading ||
    loanDecimalsLoading ||
    feeDecimalsLoading

  // Collect all errors
  const error =
    precisionError ||
    loanTokenError ||
    feeTokenError ||
    loanDecimalsError ||
    feeDecimalsError

  // Memoize the decimal configuration
  const decimals = useMemo((): ContractDecimals | undefined => {
    if (
      !precision ||
      loanTokenDecimals === undefined ||
      feeTokenDecimals === undefined
    ) {
      return undefined
    }

    try {
      // Calculate precision decimals from the contract PRECISION constant
      const precisionDecimals = calculateDecimalPlaces(precision)

      const config: ContractDecimals = {
        precision,
        precisionDecimals,
        loanTokenDecimals: Number(loanTokenDecimals),
        feeTokenDecimals: Number(feeTokenDecimals),
        ltvDecimals: 6, // LTV uses 1e6 precision on contract
        interestRateDecimals: 6 // Interest rates use 1e6 precision on contract
      }

      // Validate the configuration
      validateContractDecimals(config)

      return config
    } catch (err) {
      console.error('Error calculating contract decimals:', err)
      return undefined
    }
  }, [precision, loanTokenDecimals, feeTokenDecimals])

  return {
    decimals,
    isLoading,
    error: error || null
  }
}

/**
 * Hook that throws if decimals are not available
 * Useful for components that require decimals to function
 */
export function useRequiredContractDecimals(): ContractDecimals {
  const { decimals, isLoading, error } = useContractDecimals()

  if (error) {
    throw new DecimalError(
      `Failed to fetch contract decimals: ${error.message}`
    )
  }

  if (isLoading) {
    throw new DecimalError('Contract decimals are still loading')
  }

  if (!decimals) {
    throw new DecimalError('Contract decimals are not available')
  }

  return decimals
}

/**
 * Hook that provides individual decimal values with fallbacks
 * Returns reasonable defaults while still loading
 */
export function useContractDecimalsWithDefaults() {
  const { decimals, isLoading, error } = useContractDecimals()

  return {
    precision: decimals?.precision ?? 100000000n, // Default to 1e8
    precisionDecimals: decimals?.precisionDecimals ?? 8,
    loanTokenDecimals: decimals?.loanTokenDecimals ?? 18,
    feeTokenDecimals: decimals?.feeTokenDecimals ?? 18,
    ltvDecimals: decimals?.ltvDecimals ?? 6,
    interestRateDecimals: decimals?.interestRateDecimals ?? 6,
    isLoading,
    error,
    hasDecimals: !!decimals
  }
}
