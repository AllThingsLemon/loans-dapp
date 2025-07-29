import { useMemo } from 'react'
import {
  useReadLoansLoanConfig,
  useReadLoansGetAllInterestAprConfigs,
  useReadLoansGetAllOriginationFees
} from '@/src/generated'
import { type LoanConfigResponse, parseLoanConfig } from '@/src/types/contracts'

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

  // Get all interest APR configs directly
  const {
    data: interestAprConfigsRaw,
    isLoading: loadingInterestConfigs,
    error: interestConfigsError
  } = useReadLoansGetAllInterestAprConfigs()

  // Parse the interest configs
  const interestAprConfigs = useMemo(() => {
    if (!interestAprConfigsRaw) return []
    const parsed = interestAprConfigsRaw.map((config) => ({
      minDuration: config.minDuration,
      maxDuration: config.maxDuration,
      interestApr: config.interestApr
    }))

    return parsed
  }, [interestAprConfigsRaw])

  // Get all origination fees directly
  const {
    data: originationFeesRaw,
    isLoading: loadingOriginationFees,
    error: originationFeesError
  } = useReadLoansGetAllOriginationFees()

  // Parse origination fees into LTV options
  const ltvOptions = useMemo(() => {
    if (!originationFeesRaw) return []
    const [ltvs = [], fees = []] = originationFeesRaw || []

    return ltvs
      .map((ltv, index) => ({
        ltv,
        fee: fees[index] ?? 0n
      }))
      .filter((option) => option.fee && option.fee > 0n)
  }, [originationFeesRaw])

  const isLoading =
    loadingConfig || loadingInterestConfigs || loadingOriginationFees

  const error = configError || interestConfigsError || originationFeesError

  // Calculate duration range from all configs
  const durationRange = useMemo(() => {
    if (interestAprConfigs.length === 0) {
      return { min: 0, max: 0 }
    }

    const minDuration = Math.min(
      ...interestAprConfigs.map((config) => Number(config.minDuration))
    )
    const maxDuration = Math.max(
      ...interestAprConfigs.map((config) => Number(config.maxDuration))
    )

    return { min: minDuration, max: maxDuration }
  }, [interestAprConfigs])

  return {
    loanConfig,
    interestAprConfigs,
    ltvOptions,
    durationRange,
    isLoading,
    error
  }
}
