import { useMemo, useState, useEffect } from 'react'
import {
  useReadLoansCalculateInterestApr,
  useReadLoansOriginationFees
} from '@/generated'
import { useContractDecimals } from './useContractDecimals'
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

  // Get contract decimal configuration
  const { decimals } = useContractDecimals()

  // Convert loan term to seconds for contract call
  const loanDurationSeconds = BigInt(loanTerm * 30 * 24 * 60 * 60) // months to seconds

  // Fetch APR from contract based on loan duration
  const { data: contractApr } = useReadLoansCalculateInterestApr({
    args: [loanDurationSeconds]
  })

  // Convert LTV percentage to contract format for fee lookup
  const ltvForContract = decimals
    ? (BigInt(ltv) * decimals.precision) / 100n
    : undefined

  // Fetch origination fee from contract
  const { data: contractOriginationFee } = useReadLoansOriginationFees({
    args: ltvForContract ? [ltvForContract] : undefined
  })

  // Function to get LEMX price (tries historical first, then current)
  const getLemxPrice = async () => {
    try {
      console.log('Fetching LEMX historical price from Cloudflare Worker...')

      // Try to get 30-day historical average first
      const workerUrl =
        'https://lem-loans.clients-lemon.workers.dev?type=historical'

      const response = await fetch(workerUrl, {
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Worker responded with ${response.status}`)
      }

      const data = (await response.json()) as CoinMarketCapResponse
      console.log('Historical data response:', data)

      if (
        data.status &&
        data.status.error_code === 0 &&
        data.data &&
        data.data.LEMX
      ) {
        const price = parseFloat(data.data.LEMX.quote.USD.price)
        console.log('LEMX historical price from Worker:', price)
        return price
      } else {
        console.error('Historical data failed, trying current price:', data)
        throw new Error('Historical data not available')
      }
    } catch (error) {
      console.error('Error fetching LEMX historical price:', error)
      console.log('Falling back to current price from Worker...')

      // Fallback to current price from Worker
      try {
        return await getCurrentLemxPrice()
      } catch (fallbackError) {
        console.error('Current price fallback also failed:', fallbackError)
        // Final fallback - show error message instead of hardcoded price
        throw new Error('Could not get price of LEMX')
      }
    }
  }

  // Function to get current LEMX price from Worker
  const getCurrentLemxPrice = async () => {
    const workerUrl = 'https://lem-loans.clients-lemon.workers.dev'

    const response = await fetch(workerUrl, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }

    const data = (await response.json()) as CoinMarketCapResponse
    console.log('Current price response:', data)

    if (
      data.status &&
      data.status.error_code === 0 &&
      data.data &&
      data.data.LEMX
    ) {
      const price = parseFloat(data.data.LEMX.quote.USD.price)
      console.log('LEMX current price from Worker:', price)
      return price
    } else {
      throw new Error('LEMX current price not found in response')
    }
  }

  // Fetch price when component mounts
  useEffect(() => {
    // Function to get LEMX price (tries historical first, then current)
    const getLemxPriceInternal = async () => {
      try {
        console.log('Fetching LEMX historical price from Cloudflare Worker...')

        // Try to get 30-day historical average first
        const workerUrl =
          'https://lem-loans.clients-lemon.workers.dev?type=historical'

        const response = await fetch(workerUrl, {
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Worker responded with ${response.status}`)
        }

        const data = (await response.json()) as CoinMarketCapResponse
        console.log('Historical data response:', data)

        if (
          data.status &&
          data.status.error_code === 0 &&
          data.data &&
          data.data.LEMX
        ) {
          const price = parseFloat(data.data.LEMX.quote.USD.price)
          console.log('LEMX historical price from Worker:', price)
          return price
        } else {
          console.error('Historical data failed, trying current price:', data)
          throw new Error('Historical data not available')
        }
      } catch (error) {
        console.error('Error fetching LEMX historical price:', error)
        console.log('Falling back to current price from Worker...')

        // Fallback to current price from Worker
        try {
          return await getCurrentLemxPrice()
        } catch (fallbackError) {
          console.error('Current price fallback also failed:', fallbackError)
          // Final fallback - show error message instead of hardcoded price
          throw new Error('Could not get price of LEMX')
        }
      }
    }

    const fetchPrice = async () => {
      try {
        const price = await getLemxPriceInternal()
        setLemonPrice(price)
        setPriceError(undefined)
      } catch (error) {
        console.error('Failed to fetch LEMX price:', error)
        // Set price to 0 to indicate error
        setLemonPrice(0)
        setPriceError('Could not get price of LEMX')
      }
    }
    fetchPrice()
  }, []) // Empty dependency array is correct - we only want to fetch once on mount

  const calculation = useMemo((): LoanCalculation => {
    // Use contract data when available, fallback to hardcoded values for development
    const getAprFromContract = (): number => {
      if (contractApr && decimals) {
        // Convert from contract precision to percentage
        return Number(formatPercentage(contractApr, decimals.precisionDecimals))
      }

      // Fallback APR table for development/testing
      const aprTable = [
        { term: 3, apr: 18 },
        { term: 6, apr: 16 },
        { term: 9, apr: 14 },
        { term: 12, apr: 13 },
        { term: 18, apr: 11.5 },
        { term: 24, apr: 10 },
        { term: 30, apr: 9 },
        { term: 36, apr: 8 },
        { term: 42, apr: 7 },
        { term: 48, apr: 6 },
        { term: 54, apr: 5.5 },
        { term: 60, apr: 5 }
      ]

      const entry = aprTable.find((item) => item.term === loanTerm)
      return entry ? entry.apr : 5.0
    }

    const getOriginationFeeFromContract = (): number => {
      if (contractOriginationFee && decimals) {
        // Convert from wei to dollar amount (assuming fee token represents dollars)
        return Number(
          formatTokenAmount(contractOriginationFee, decimals.feeTokenDecimals)
        )
      }

      // Fallback fee table for development/testing
      const originationFeeTable = [
        { ltv: 20, feeDollars: 100 },
        { ltv: 25, feeDollars: 200 },
        { ltv: 30, feeDollars: 300 },
        { ltv: 35, feeDollars: 400 },
        { ltv: 40, feeDollars: 600 },
        { ltv: 45, feeDollars: 1000 },
        { ltv: 50, feeDollars: 2000 },
        { ltv: 55, feeDollars: 3500 },
        { ltv: 60, feeDollars: 5000 }
      ]

      const entry = originationFeeTable.find((item) => item.ltv === ltv)
      return entry ? entry.feeDollars : 50.0
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
      contractApr && decimals
        ? formatPercentage(contractApr, decimals.precisionDecimals)
        : undefined
    const contractFeeFormatted =
      contractOriginationFee && decimals
        ? formatTokenAmount(contractOriginationFee, decimals.feeTokenDecimals)
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
    decimals
  ])

  return calculation
}
