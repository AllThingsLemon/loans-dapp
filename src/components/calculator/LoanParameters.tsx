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
          <div className='relative'>
            <span
              className={`absolute left-3 top-3 ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
            >
              $
            </span>
            <Input
              type='number'
              value={loanAmount === 0 ? '' : loanAmount}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  setLoanAmount(0)
                  return
                }

                const numValue = Number(value)
                const maxAmount = loanConfig?.minLoanAmount
                  ? Number(
                      formatUnits(
                        loanConfig.minLoanAmount,
                        tokenConfig?.loanToken.decimals || 18
                      )
                    ) * 100
                  : 100000
                if (numValue <= maxAmount) {
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
              max={
                loanConfig?.minLoanAmount
                  ? Number(
                      formatUnits(
                        loanConfig.minLoanAmount,
                        tokenConfig?.loanToken.decimals || 18
                      )
                    ) * 100
                  : 100000
              }
              className={`pl-8 text-lg ${!isDashboard ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400' : ''}`}
              placeholder='10000'
            />
          </div>
          <div
            className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
          >
            {tokenConfig?.loanToken.symbol || 'Token'} - $
            {loanConfig?.minLoanAmount
              ? formatUnits(
                  loanConfig.minLoanAmount,
                  tokenConfig?.loanToken.decimals || 18
                )
              : '1000'}{' '}
            minimum loan
          </div>
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
                min={0}
                max={ltvPercentages.length - 1}
                step={1}
                value={ltvPercentages.indexOf(ltv)}
                disabled={ltvOptions.length === 0}
                onChange={(e) => {
                  const index = Number(e.target.value)
                  setLtv(ltvPercentages[index])
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
