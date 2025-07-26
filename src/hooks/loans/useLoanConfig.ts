import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { useConfig, useChainId } from 'wagmi'
import {
  useReadLoansLoanConfig,
  useReadLoansCalculateInterestApr,
  useReadLoansOriginationFees,
  useReadLoansGetInterestAprConfigsLength,
  loansAbi,
  loansAddress
} from '@/src/generated'
import { useContractTokenConfiguration } from '../useContractTokenConfiguration'
import { parsePercentage } from '../../utils/decimals'
import { DEFAULT_LTV_VALUES, LIMITS } from '@/src/constants'
import { type LoanConfigResponse, type InterestConfigResponse, parseLoanConfig, parseInterestConfig } from '@/src/types/contracts'

export interface LoanConfiguration {
  minLoanAmount: bigint
  minLoanDuration: bigint
  maxLoanDuration: bigint
  balloonPaymentGraceDuration: bigint
  loanCycleDuration: bigint
  maxLoanExtension: bigint
}

export interface InterestAprConfig {
  minDuration: bigint
  maxDuration: bigint
  interestApr: bigint
}

export const useLoanConfig = () => {
  // Get token configuration for LTV precision
  const { tokenConfig } = useContractTokenConfiguration()
  const config = useConfig()
  const chainId = useChainId()

  // Get loan configuration
  const {
    data: loanConfigRaw,
    isLoading: loadingConfig,
    error: configError
  } = useReadLoansLoanConfig()

  // Convert array to object structure using safe parser
  const loanConfig = useMemo(() => {
    if (!loanConfigRaw) return undefined
    return parseLoanConfig(loanConfigRaw as LoanConfigResponse)
  }, [loanConfigRaw])

  // Get the length of interest APR configs
  const { data: interestConfigsLength, isLoading: loadingInterestLength, error: interestLengthError } = useReadLoansGetInterestAprConfigsLength()

  // Dynamically fetch interest configs based on length
  const { data: interestAprConfigs = [], isLoading: loadingInterestConfigs, error: interestConfigsError } = useQuery({
    queryKey: ['interestAprConfigs', interestConfigsLength ? Number(interestConfigsLength) : null],
    queryFn: async () => {
      if (!config || !interestConfigsLength) return []
      
      const length = Number(interestConfigsLength)
      const promises = []
      
      for (let i = 0; i < length; i++) {
        promises.push(
          readContract(config, {
            address: loansAddress[chainId as keyof typeof loansAddress],
            abi: loansAbi,
            functionName: 'interestAprConfigs',
            args: [BigInt(i)]
          })
        )
      }
      
      const results = await Promise.all(promises)
      return results.map(data => parseInterestConfig(data as InterestConfigResponse))
    },
    enabled: !!config && !!interestConfigsLength && !interestLengthError,
    staleTime: 30000
  })

  // LTV values that match the contract setup using dynamic precision
  const testLTVs = useMemo(() => {
    if (!tokenConfig) return []
    return DEFAULT_LTV_VALUES.map(value => 
      parsePercentage(value, tokenConfig.ltvDecimals)
    )
  }, [tokenConfig])

  // Fetch origination fees for test LTVs (only if testLTVs is populated)
  const ltv1Fee = useReadLoansOriginationFees({
    args: testLTVs.length > 0 ? [testLTVs[0]] : [0n],
    query: { enabled: testLTVs.length > 0 }
  })
  const ltv2Fee = useReadLoansOriginationFees({
    args: testLTVs.length > 1 ? [testLTVs[1]] : [0n],
    query: { enabled: testLTVs.length > 1 }
  })
  const ltv3Fee = useReadLoansOriginationFees({
    args: testLTVs.length > 2 ? [testLTVs[2]] : [0n],
    query: { enabled: testLTVs.length > 2 }
  })
  const ltv4Fee = useReadLoansOriginationFees({
    args: testLTVs.length > 3 ? [testLTVs[3]] : [0n],
    query: { enabled: testLTVs.length > 3 }
  })
  const ltv5Fee = useReadLoansOriginationFees({
    args: testLTVs.length > 4 ? [testLTVs[4]] : [0n],
    query: { enabled: testLTVs.length > 4 }
  })

  // Get available LTV options with their fees
  const ltvOptions = useMemo(() => {
    const fees = [
      ltv1Fee.data,
      ltv2Fee.data,
      ltv3Fee.data,
      ltv4Fee.data,
      ltv5Fee.data
    ]


    const options = testLTVs.map((ltv, index) => ({
      ltv,
      fee: fees[index] ?? 0n
    }))

    return options.filter((option) => option.fee && option.fee > 0n)
  }, [
    testLTVs,
    ltv1Fee.data,
    ltv2Fee.data,
    ltv3Fee.data,
    ltv4Fee.data,
    ltv5Fee.data
  ])


  const isLoading =
    loadingConfig ||
    loadingInterestLength ||
    loadingInterestConfigs ||
    ltv1Fee.isLoading ||
    ltv2Fee.isLoading ||
    ltv3Fee.isLoading ||
    ltv4Fee.isLoading ||
    ltv5Fee.isLoading

  const error =
    configError ||
    interestLengthError ||
    interestConfigsError ||
    ltv1Fee.error ||
    ltv2Fee.error ||
    ltv3Fee.error ||
    ltv4Fee.error ||
    ltv5Fee.error


  return {
    loanConfig: loanConfig as LoanConfiguration | undefined,
    interestAprConfigs,
    ltvOptions,
    useInterestRate: (duration: bigint) =>
      useReadLoansCalculateInterestApr({ args: [duration] }),
    isLoading,
    error
  }
}
