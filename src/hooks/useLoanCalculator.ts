import { useMemo, useState, useEffect } from 'react'

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
  initialLemonPrice: number = 35.00
) => {
  const [lemonPrice, setLemonPrice] = useState(initialLemonPrice)
  const [priceError, setPriceError] = useState<string | undefined>()

  // Function to get LEMX price (tries historical first, then current)
  const getLemxPrice = async () => {
    try {
      console.log('Fetching LEMX historical price from Cloudflare Worker...')
      
      // Try to get 30-day historical average first
      const workerUrl = 'https://lem-loans.clients-lemon.workers.dev?type=historical'
      
      const response = await fetch(workerUrl, {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Worker responded with ${response.status}`)
      }
      
      const data = await response.json() as CoinMarketCapResponse
      console.log('Historical data response:', data)
      
      if (data.status && data.status.error_code === 0 && data.data && data.data.LEMX) {
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
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }
    
    const data = await response.json() as CoinMarketCapResponse
    console.log('Current price response:', data)
    
    if (data.status && data.status.error_code === 0 && data.data && data.data.LEMX) {
      const price = parseFloat(data.data.LEMX.quote.USD.price)
      console.log('LEMX current price from Worker:', price)
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
        console.error('Failed to fetch LEMX price:', error)
        // Set price to 0 to indicate error
        setLemonPrice(0)
        setPriceError('Could not get price of LEMX')
      }
    }
    fetchPrice()
  }, [])

  const calculation = useMemo((): LoanCalculation => {
    // APR lookup table based on loan term only
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

    // Origination fee lookup table based on LTV ratio (fixed dollar amounts)
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

    // Function to get APR from the table based on term
    const getAprFromTable = (termValue: number): number => {
      const entry = aprTable.find(item => item.term === termValue)
      return entry ? entry.apr : 5.0 // Default APR if not found
    }

    // Function to get origination fee dollar amount from LTV
    const getOriginationFeeDollars = (ltvValue: number): number => {
      const entry = originationFeeTable.find(item => item.ltv === ltvValue)
      return entry ? entry.feeDollars : 50.00 // Default $50.00 if not found
    }

    // Validation - include price error check
    const isValid = loanAmount >= 1000 && loanAmount <= 100000 && 
                   ltv >= 20 && ltv <= 60 && 
                   loanTerm > 0 && lemonPrice > 0 && !priceError

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
    const apr = getAprFromTable(loanTerm)
    const originationFeeDollars = getOriginationFeeDollars(ltv)
    const monthlyPayment = (loanAmount * (apr / 100 / 12))
    const balloonPayment = loanAmount

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
      priceError: undefined
    }
  }, [loanAmount, loanTerm, ltv, lemonPrice, priceError])

  return calculation
} 