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
  aprYearDuration: bigint
}

export interface InterestAprConfig {
  minDuration: bigint
  maxDuration: bigint
  interestApr: bigint
}

export const useLoanConfig = (asset?: `0x${string}`) => {
  const {
    data: loanConfigRaw,
    isLoading: loadingConfig,
    error: configError
  } = useReadLoansLoanConfig()

  const loanConfig = useMemo(() => {
    if (!loanConfigRaw) return undefined
    return parseLoanConfig(loanConfigRaw as LoanConfigResponse)
  }, [loanConfigRaw])

  // @ts-ignore - wagmi deep type instantiation
  const interestAprConfigsResult = useReadLoansGetAllInterestAprConfigs({
    args: asset ? [asset] : undefined,
    query: { enabled: !!asset }
  })
  const interestAprConfigsRaw = interestAprConfigsResult.data
  const loadingInterestConfigs = interestAprConfigsResult.isLoading
  const interestConfigsError = interestAprConfigsResult.error

  const interestAprConfigs = useMemo(() => {
    if (!interestAprConfigsRaw) return []
    return interestAprConfigsRaw.map((config) => ({
      minDuration: config.minDuration,
      maxDuration: config.maxDuration,
      interestApr: config.interestApr
    }))
  }, [interestAprConfigsRaw])

  // @ts-ignore - wagmi deep type instantiation
  const {
    data: originationFeesRaw,
    isLoading: loadingOriginationFees,
    error: originationFeesError
  } = useReadLoansGetAllOriginationFees({
    args: asset ? [asset] : undefined,
    query: { enabled: !!asset }
  })

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
    loadingConfig || (!!asset && (loadingInterestConfigs || loadingOriginationFees))

  const error = configError || interestConfigsError || originationFeesError

  const durationRange = useMemo(() => {
    if (!loanConfig) return { min: 0, max: 0 }
    return {
      min: Number(loanConfig.minLoanDuration),
      max: Number(loanConfig.maxLoanDuration)
    }
  }, [loanConfig])

  return {
    loanConfig,
    interestAprConfigs,
    ltvOptions,
    durationRange,
    isLoading,
    error
  }
}
