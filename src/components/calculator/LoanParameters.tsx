'use client'

import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatUnits } from 'viem'
import { formatPercentage, formatDurationRange } from '../../utils/decimals'
import { formatDuration } from '../../utils/format'

interface LoanParametersProps {
  loanAmount: number
  setLoanAmount: (amount: number) => void
  duration: number
  setDuration: (duration: number) => void
  ltv: number
  setLtv: (ltv: number) => void
  loanConfig: any
  tokenConfig: any
  interestAprConfigs: any[]
  ltvOptions: any[]
  durationRange: { min: number; max: number }
  configLoading: boolean
  availableLiquidity?: bigint
  isDashboard?: boolean
}

export function LoanParameters({
  loanAmount,
  setLoanAmount,
  duration,
  setDuration,
  ltv,
  setLtv,
  loanConfig,
  tokenConfig,
  interestAprConfigs,
  ltvOptions,
  durationRange,
  configLoading,
  availableLiquidity,
  isDashboard = false
}: LoanParametersProps) {
  // Use pre-calculated duration range from the hook
  const minDuration = durationRange.min
  const maxDuration = durationRange.max

  // Calculate LTV percentages from the raw options
  const ltvPercentages =
    ltvOptions.length > 0 && tokenConfig
      ? ltvOptions.map((option) =>
          Number(formatPercentage(option.ltv, tokenConfig.ltvDecimals))
        )
      : []

  // Calculate min/max LTV from the actual percentages
  const minLtvPercentage =
    ltvPercentages.length > 0 ? Math.min(...ltvPercentages) : 0
  const maxLtvPercentage =
    ltvPercentages.length > 0 ? Math.max(...ltvPercentages) : 0

  // Check if loan amount is below minimum
  const minLoanAmount = loanConfig?.minLoanAmount && tokenConfig
    ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig.loanToken.decimals || 18))
    : 0
  const isBelowMinimum = loanAmount > 0 && loanAmount < minLoanAmount

  const maxLoanAmount = availableLiquidity !== undefined && tokenConfig
    ? Number(formatUnits(availableLiquidity, tokenConfig.loanToken.decimals || 18))
    : loanConfig?.minLoanAmount
      ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)) * 100
      : 100000

  const hasNoLiquidity = availableLiquidity !== undefined && availableLiquidity === 0n

  // Safe index for the slider — use the actual percentage as value instead of indexOf
  const ltvStep = ltvPercentages.length >= 2
    ? ltvPercentages[1] - ltvPercentages[0]
    : 10

  return (
    <Card
      className={`${!isDashboard ? 'animate-slide-in-left bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-700 text-white' : ''}`}
    >
      <CardHeader>
        <CardTitle className={`${!isDashboard ? 'text-2xl text-white' : ''}`}>
          Loan Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Loan Amount Input */}
        <div>
          <label
            className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
          >
            💰 How much do you need?
          </label>
          <div className='relative flex items-center'>
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
            >
              $
            </span>
            <Input
              type='number'
              value={loanAmount === 0 ? '' : loanAmount}
              disabled={hasNoLiquidity}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  setLoanAmount(0)
                  return
                }

                const numValue = Number(value)
                if (numValue <= maxLoanAmount) {
                  setLoanAmount(numValue)
                }
              }}
              onBlur={(e) => {
                const value = e.target.value
                const minAmount = loanConfig?.minLoanAmount
                  ? Number(
                      formatUnits(
                        loanConfig.minLoanAmount,
                        tokenConfig?.loanToken.decimals || 18
                      )
                    )
                  : 1000
                if (value === '' || Number(value) < minAmount) {
                  setLoanAmount(minAmount)
                }
              }}
              min={
                loanConfig?.minLoanAmount
                  ? formatUnits(
                      loanConfig.minLoanAmount,
                      tokenConfig?.loanToken.decimals || 18
                    )
                  : '1000'
              }
              max={maxLoanAmount}
              className={`pl-8 text-lg ${!isDashboard ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed' : 'disabled:opacity-50 disabled:cursor-not-allowed'} ${isBelowMinimum ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              placeholder='10000'
            />
          </div>
          {hasNoLiquidity ? (
            <p className='text-sm text-red-500 mt-1'>
              No liquidity available — loans are currently unavailable.
            </p>
          ) : (
            <div
              className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
            >
              <span>
                {tokenConfig?.loanToken.symbol || 'Token'} — $
                {loanConfig?.minLoanAmount
                  ? formatUnits(
                      loanConfig.minLoanAmount,
                      tokenConfig?.loanToken.decimals || 18
                    )
                  : '1000'}{' '}
                min
              </span>
              <span>
                {availableLiquidity !== undefined
                  ? `$${Math.floor(Number(formatUnits(availableLiquidity, tokenConfig?.loanToken.decimals || 18))).toLocaleString()} available`
                  : 'Loading liquidity...'}
              </span>
            </div>
          )}
        </div>

        {/* Duration Slider */}
        <div>
          <label
            className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
          >
            📅 Loan Duration: {formatDuration(BigInt(duration))}
          </label>
          {interestAprConfigs.length === 0 ? (
            <div
              className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
            >
              {configLoading
                ? 'Loading durations...'
                : 'No durations available'}
            </div>
          ) : (
            <>
              <input
                type='range'
                min={minDuration}
                max={maxDuration}
                step={loanConfig.loanCycleDuration}
                value={duration}
                disabled={interestAprConfigs.length === 0}
                onChange={(e) => {
                  const seconds = Number(e.target.value)
                  setDuration(seconds)
                }}
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed'
              />
              <div
                className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
              >
                <span>{formatDuration(BigInt(minDuration))}</span>
                <span>{formatDuration(BigInt(maxDuration))}</span>
              </div>
            </>
          )}
        </div>

        {/* LTV Slider */}
        <div>
          <label
            className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
          >
            ⚖️ Loan-to-Value Ratio: {ltv}%
          </label>
          {ltvOptions.length === 0 ? (
            <div
              className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
            >
              {configLoading
                ? 'Loading LTV options...'
                : 'No LTV options available'}
            </div>
          ) : (
            <>
              <input
                type='range'
                min={minLtvPercentage}
                max={maxLtvPercentage}
                step={ltvStep}
                value={ltv}
                disabled={ltvOptions.length === 0}
                onChange={(e) => {
                  const pct = Number(e.target.value)
                  setLtv(pct)
                }}
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed'
              />
              <div
                className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
              >
                <span>{minLtvPercentage}%</span>
                <span>{maxLtvPercentage}%</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
