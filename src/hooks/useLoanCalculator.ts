import { useMemo, useState, useEffect } from 'react'
import {
  useReadLoansCalculateInterestApr,
  useReadLoansOriginationFees
} from '@/generated'
import { useContractTokenConfiguration } from './useContractTokenConfiguration'
import { formatPercentage, formatTokenAmount } from '@/utils/decimals'

export interface LoanCalculation {
  loanAmount: number
  loanTerm: number
  ltv: number
  lemonPrice: number
  lemonRequired: number
  apr: number
  originationFeeDollars: number
  monthlyPayment: number
  balloonPayment: number
  isValid: boolean
  priceError?: string
  contractApr?: string
  contractFee?: string
}

// Type definitions for API responses
interface CoinMarketCapResponse {
  status: {
    error_code: number
  }
  data: {
    LEMX: {
      quote: {
        USD: {
          price: string
        }
      }
    }
  }
}

export const useLoanCalculator = (
  loanAmount: number,
  loanTerm: number,
  ltv: number,
  initialLemonPrice: number = 0
) => {
  const [lemonPrice, setLemonPrice] = useState(initialLemonPrice)
  const [priceError, setPriceError] = useState<string | undefined>()

  // Get contract token and decimal configuration
  const { tokenConfig } = useContractTokenConfiguration()

  // Convert loan term to seconds for contract call
  const loanDurationSeconds = BigInt(loanTerm * 30 * 24 * 60 * 60) // months to seconds

  // Fetch APR from contract based on loan duration
  const { data: contractApr } = useReadLoansCalculateInterestApr({
    args: [loanDurationSeconds]
  })

  // Convert LTV percentage to contract format for fee lookup
  const ltvForContract = tokenConfig?.ltvDecimals
    ? (BigInt(ltv) * tokenConfig.precision) / 100n
    : undefined

  // Fetch origination fee from contract
  const { data: contractOriginationFee } = useReadLoansOriginationFees({
    args: ltvForContract ? [ltvForContract] : undefined
  })

  // Function to get LEMX price (tries historical first, then current)
  const getLemxPrice = async () => {
    const baseWorkerUrl = process.env.NEXT_PUBLIC_LEMX_PRICE_WORKER_URL || 'https://lem-loans.clients-lemon.workers.dev'
    
    try {
      // Try to get 30-day historical average first
      const workerUrl = `${baseWorkerUrl}?type=historical`

      const response = await fetch(workerUrl, {
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Worker responded with ${response.status}`)
      }

      const data = (await response.json()) as CoinMarketCapResponse

      if (
        data.status &&
        data.status.error_code === 0 &&
        data.data &&
        data.data.LEMX
      ) {
        const price = parseFloat(data.data.LEMX.quote.USD.price)
        return price
      } else {
        throw new Error('Historical data not available')
      }
    } catch (error) {
      // Fallback to current price from Worker
      try {
        return await getCurrentLemxPrice()
      } catch (fallbackError) {
        // Final fallback - show error message instead of hardcoded price
        throw new Error('Could not get price of LEMX')
      }
    }
  }

  // Function to get current LEMX price from Worker
  const getCurrentLemxPrice = async () => {
    const workerUrl = process.env.NEXT_PUBLIC_LEMX_PRICE_WORKER_URL || 'https://lem-loans.clients-lemon.workers.dev'

    const response = await fetch(workerUrl, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }

    const data = (await response.json()) as CoinMarketCapResponse

    if (
      data.status &&
      data.status.error_code === 0 &&
      data.data &&
      data.data.LEMX
    ) {
      const price = parseFloat(data.data.LEMX.quote.USD.price)
      return price
    } else {
      throw new Error('LEMX current price not found in response')
    }
  }

  // Fetch price when component mounts
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getLemxPrice()
        setLemonPrice(price)
        setPriceError(undefined)
      } catch (error) {
        // Set price to 0 to indicate error
        setLemonPrice(0)
        setPriceError('Could not get price of LEMX')
      }
    }
    fetchPrice()
  }, [getLemxPrice]) // Include getLemxPrice in dependency array

  const calculation = useMemo((): LoanCalculation => {
    // Get APR from contract
    const getAprFromContract = (): number => {
      if (contractApr && tokenConfig) {
        // Convert from contract precision to percentage
        return Number(formatPercentage(contractApr, tokenConfig.interestRateDecimals))
      }
      // Return 0 when contract data is not available
      return 0
    }

    const getOriginationFeeFromContract = (): number => {
      if (contractOriginationFee && tokenConfig) {
        // Convert from wei to dollar amount (assuming fee token represents dollars)
        return Number(
          formatTokenAmount(contractOriginationFee, tokenConfig.feeToken.decimals)
        )
      }
      // Return 0 when contract data is not available
      return 0
    }

    // Validation - include price error check
    const isValid =
      loanAmount >= 1000 &&
      loanAmount <= 100000 &&
      ltv >= 20 &&
      ltv <= 60 &&
      loanTerm > 0 &&
      lemonPrice > 0 &&
      !priceError

    if (!isValid) {
      return {
        loanAmount: 0,
        loanTerm: 0,
        ltv: 0,
        lemonPrice: lemonPrice,
        lemonRequired: 0,
        apr: 0,
        originationFeeDollars: 0,
        monthlyPayment: 0,
        balloonPayment: 0,
        isValid: false,
        priceError: priceError
      }
    }

    const lemonRequired = loanAmount / (lemonPrice * (ltv / 100))
    const apr = getAprFromContract()
    const originationFeeDollars = getOriginationFeeFromContract()
    const monthlyPayment = loanAmount * (apr / 100 / 12)
    const balloonPayment = loanAmount

    // Debug info for contract data
    const contractAprFormatted =
      contractApr && tokenConfig
        ? formatPercentage(contractApr, tokenConfig.interestRateDecimals)
        : undefined
    const contractFeeFormatted =
      contractOriginationFee && tokenConfig
        ? formatTokenAmount(contractOriginationFee, tokenConfig.feeToken.decimals)
        : undefined

    return {
      loanAmount,
      loanTerm,
      ltv,
      lemonPrice,
      lemonRequired,
      apr,
      originationFeeDollars,
      monthlyPayment,
      balloonPayment,
      isValid: true,
      priceError: undefined,
      contractApr: contractAprFormatted,
      contractFee: contractFeeFormatted
    }
  }, [
    loanAmount,
    loanTerm,
    ltv,
    lemonPrice,
    priceError,
    contractApr,
    contractOriginationFee,
    tokenConfig
  ])

  return calculation
}
