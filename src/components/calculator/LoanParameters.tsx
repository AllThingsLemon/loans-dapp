'use client'

import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatUnits } from 'viem'
import { formatPercentage, formatDurationRange } from '../../utils/decimals'

interface LoanParametersProps {
  loanAmount: number
  setLoanAmount: (amount: number) => void
  selectedConfigIndex: number
  setSelectedConfigIndex: (index: number) => void
  ltv: number
  setLtv: (ltv: number) => void
  loanConfig: any
  tokenConfig: any
  interestAprConfigs: any[]
  selectedConfig: any
  configLoading: boolean
  isDashboard?: boolean
}

export function LoanParameters({
  loanAmount,
  setLoanAmount,
  selectedConfigIndex,
  setSelectedConfigIndex,
  ltv,
  setLtv,
  loanConfig,
  tokenConfig,
  interestAprConfigs,
  selectedConfig,
  configLoading,
  isDashboard = false
}: LoanParametersProps) {
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
                  ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)) * 100
                  : 100000
                if (numValue <= maxAmount) {
                  setLoanAmount(numValue)
                }
              }}
              onBlur={(e) => {
                const value = e.target.value
                const minAmount = loanConfig?.minLoanAmount
                  ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18))
                  : 1000
                if (value === '' || Number(value) < minAmount) {
                  setLoanAmount(minAmount)
                }
              }}
              min={
                loanConfig?.minLoanAmount
                  ? formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)
                  : '1000'
              }
              max={
                loanConfig?.minLoanAmount
                  ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)) * 100
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
              ? formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)
              : '1000'}{' '}
            minimum loan
          </div>
        </div>

        {/* Duration Selection */}
        <div>
          <label
            className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
          >
            📅 Loan Duration
          </label>
          <Select
            value={selectedConfigIndex.toString()}
            onValueChange={(value) => setSelectedConfigIndex(Number(value))}
          >
            <SelectTrigger
              className={`w-full ${!isDashboard ? 'bg-white/10 border-white/20 text-white' : ''}`}
            >
              <SelectValue placeholder='Select loan duration' />
            </SelectTrigger>
            <SelectContent>
              {interestAprConfigs.length === 0 ? (
                <SelectItem value='loading' disabled>
                  {configLoading ? 'Loading durations...' : 'No durations available'}
                </SelectItem>
              ) : (
                interestAprConfigs.map((config, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {formatDurationRange(
                      config.minDuration,
                      config.maxDuration
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedConfig && (
            <div
              className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
            >
              APR:{' '}
              {Number(
                formatPercentage(
                  selectedConfig.interestApr,
                  tokenConfig?.interestRateDecimals || 6
                )
              ).toFixed(1)}
              %
            </div>
          )}
        </div>

        {/* LTV Slider */}
        <div>
          <label
            className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
          >
            ⚖️ Loan-to-Value Ratio: {ltv}%
          </label>
          <input
            type='range'
            min='20'
            max='60'
            step='10'
            value={ltv}
            onChange={(e) => setLtv(Number(e.target.value))}
            className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
          />
          <div
            className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
          >
            <span>20% (Safer)</span>
            <span>60% (Max)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}