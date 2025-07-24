import { useMemo } from 'react'
import {
  useReadLoansLoanConfig,
  useReadLoansInterestAprConfigs,
  useReadLoansCalculateInterestApr,
  useReadLoansOriginationFees
} from '@/src/generated'
import { useContractDecimals } from '../useContractDecimals'
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
  // Get decimal configuration for LTV precision
  const { decimals } = useContractDecimals()

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

  // Fetch interestAprConfigs sequentially - only fetch valid indices (0, 1, 2)
  const config0 = useReadLoansInterestAprConfigs({ args: [0n] })
  const config1 = useReadLoansInterestAprConfigs({ args: [1n] })
  const config2 = useReadLoansInterestAprConfigs({ args: [2n] })

  // Convert to array and filter successful results using safe parser
  const interestAprConfigs = useMemo(() => {
    const configs = [config0, config1, config2]
      .map((query) => {
        if (query.data) {
          return parseInterestConfig(query.data as InterestConfigResponse)
        }
        return null
      })
      .filter((config): config is NonNullable<typeof config> => config !== null)

    return configs
  }, [config0.data, config1.data, config2.data])

  // LTV values that match the contract setup using dynamic precision
  const testLTVs = useMemo(() => {
    if (!decimals) return []
    return DEFAULT_LTV_VALUES.map(value => 
      parsePercentage(value, decimals.ltvDecimals)
    )
  }, [decimals])

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


  // Calculate loading states
  const interestConfigsLoading =
    config0.isLoading || config1.isLoading || config2.isLoading
  const interestConfigsError = config0.error || config1.error || config2.error

  const isLoading =
    loadingConfig ||
    ltv1Fee.isLoading ||
    ltv2Fee.isLoading ||
    ltv3Fee.isLoading ||
    ltv4Fee.isLoading ||
    ltv5Fee.isLoading ||
    interestConfigsLoading

  const error =
    configError ||
    ltv1Fee.error ||
    ltv2Fee.error ||
    ltv3Fee.error ||
    ltv4Fee.error ||
    ltv5Fee.error ||
    interestConfigsError

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
