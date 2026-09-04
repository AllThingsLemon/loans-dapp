'use client'

import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatUnits } from 'viem'
import {
  formatPercentage,
  formatDurationRange,
  formatTokenAmount,
  formatSignificantValue
} from '../../utils/decimals'
import { formatDuration } from '../../utils/format'
import type { CollateralTokenInfo } from '../../hooks/useCollateralManager'
import {
  useReadLoansPriceDataFeed,
  useReadPriceDataFeedGetSpotPrice,
  useReadPriceDataFeedGetMonthlyAverage,
  useReadPriceDataFeedDecimals
} from '../../generated'

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
  supportedCollateralTokens: CollateralTokenInfo[]
  selectedCollateral: CollateralTokenInfo | undefined
  setSelectedCollateral: (token: CollateralTokenInfo | undefined) => void
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
  supportedCollateralTokens,
  selectedCollateral,
  setSelectedCollateral,
  isDashboard = false
}: LoanParametersProps) {
  // Show the selector only when there's more than one collateral token to choose
  // between. With a single configured token the user is auto-selected into it
  // (handled by useCollateralManager) and the rest of the form is usable
  // immediately.
  const hasMultipleCollateral = supportedCollateralTokens.length > 1
  const needsCollateralChoice = hasMultipleCollateral && !selectedCollateral

  // Prices for the SELECTED collateral only — nothing is fetched or shown
  // until a token is picked, so at most two figures ever render. The contract
  // prices the collateral at the LOWER of spot and 30-day average, so the
  // lower tile is highlighted to show which one the summary will use.
  const { data: priceDataFeedAddress } = useReadLoansPriceDataFeed()
  const priceArgs = {
    address: priceDataFeedAddress,
    args: selectedCollateral
      ? ([selectedCollateral.address] as const)
      : undefined,
    query: { enabled: !!(priceDataFeedAddress && selectedCollateral) }
  }
  const { data: spotPriceRaw } = useReadPriceDataFeedGetSpotPrice(priceArgs)
  const { data: monthlyAverageRaw } =
    useReadPriceDataFeedGetMonthlyAverage(priceArgs)
  const { data: priceDecimals } = useReadPriceDataFeedDecimals({
    address: priceDataFeedAddress,
    query: { enabled: !!priceDataFeedAddress }
  })

  const formatPrice = (raw: bigint | undefined): string | undefined => {
    if (raw === undefined || priceDecimals === undefined) return undefined
    return formatSignificantValue(formatTokenAmount(raw, Number(priceDecimals)))
  }
  const spotPriceText = formatPrice(spotPriceRaw)
  const monthlyAverageText = formatPrice(monthlyAverageRaw)
  // Which price the contract will use (ties go to spot — same number either way).
  const spotIsUsed =
    spotPriceRaw !== undefined &&
    monthlyAverageRaw !== undefined &&
    spotPriceRaw <= monthlyAverageRaw
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
  const minLoanAmount =
    loanConfig?.minLoanAmount && tokenConfig
      ? Number(
          formatUnits(
            loanConfig.minLoanAmount,
            tokenConfig.loanToken.decimals || 18
          )
        )
      : 0
  const isBelowMinimum = loanAmount > 0 && loanAmount < minLoanAmount

  const maxLoanAmount =
    availableLiquidity !== undefined && tokenConfig
      ? Number(
          formatUnits(availableLiquidity, tokenConfig.loanToken.decimals || 18)
        )
      : loanConfig?.minLoanAmount
        ? Number(
            formatUnits(
              loanConfig.minLoanAmount,
              tokenConfig?.loanToken.decimals || 18
            )
          ) * 100
        : 100000

  const hasNoLiquidity =
    availableLiquidity !== undefined && availableLiquidity === 0n

  // Tiers need not be uniformly spaced (e.g. 20/30/50), so a fixed step can
  // land the slider on values that have no configured origination fee. Use a
  // fine step and snap every change to the nearest real tier instead.
  const snapToTier = (raw: number): number => {
    if (ltvPercentages.length === 0) return raw
    return ltvPercentages.reduce((closest, candidate) =>
      Math.abs(candidate - raw) < Math.abs(closest - raw) ? candidate : closest
    )
  }

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
        {/* Collateral Token Selector — only shown when more than one is configured */}
        {hasMultipleCollateral && (
          <div>
            <label
              className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
            >
              🪙 Choose your collateral token
            </label>
            <div className='flex flex-wrap gap-2'>
              {supportedCollateralTokens.map((token) => {
                const isSelected =
                  selectedCollateral?.address.toLowerCase() ===
                  token.address.toLowerCase()
                return (
                  <button
                    key={token.address}
                    type='button'
                    onClick={() => setSelectedCollateral(token)}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      isSelected
                        ? !isDashboard
                          ? 'bg-yellow-400 border-yellow-400 text-black'
                          : 'bg-primary border-primary text-primary-foreground'
                        : !isDashboard
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          : 'bg-muted border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {token.symbol}
                  </button>
                )
              })}
            </div>
            {needsCollateralChoice && (
              <p
                className={`text-sm mt-2 ${!isDashboard ? 'text-yellow-300' : 'text-muted-foreground'}`}
              >
                Select a collateral token to see APR and LTV options.
              </p>
            )}
          </div>
        )}

        {/* Collateral price panel — only once a token is selected. The lower
            of the two prices carries the highlight because that is the one
            the contract uses to size the required collateral. */}
        {selectedCollateral && (
          <div>
            <label
              className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
            >
              💱 {selectedCollateral.symbol} collateral pricing
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {[
                { label: 'Spot Price', text: spotPriceText, used: spotIsUsed },
                {
                  label: '30-Day Average',
                  text: monthlyAverageText,
                  used: !spotIsUsed
                }
              ].map(({ label, text, used }) => {
                const bothLoaded =
                  spotPriceText !== undefined &&
                  monthlyAverageText !== undefined
                const highlighted = bothLoaded && used
                return (
                  <div
                    key={label}
                    className={`rounded-md border p-3 text-center transition-colors ${
                      highlighted
                        ? !isDashboard
                          ? 'border-yellow-400 ring-1 ring-yellow-400 bg-yellow-400/10'
                          : 'border-primary ring-1 ring-primary bg-primary/5'
                        : !isDashboard
                          ? 'border-white/20 bg-white/5'
                          : 'border-border bg-muted/50'
                    }`}
                  >
                    <p
                      className={`text-xs ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                    >
                      {label}
                    </p>
                    <p
                      className={`text-base font-bold ${!isDashboard ? 'text-white' : ''}`}
                    >
                      {text !== undefined ? `$${text}` : '…'}
                    </p>
                    {highlighted && (
                      <p
                        className={`text-[10px] font-medium uppercase tracking-wide ${!isDashboard ? 'text-yellow-300' : 'text-primary'}`}
                      >
                        ✓ Used in calculation
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <p
              className={`text-xs mt-1 ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
            >
              Your required collateral is calculated at the lower of the two
              prices.
            </p>
          </div>
        )}

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
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  setLoanAmount(0)
                  return
                }

                const numValue = Number(value)
                // Reject garbage and negatives (a negative passed the old
                // <= max check and flowed into parseUnits), and clamp
                // above-max input to the max instead of silently swallowing
                // the keystroke — a frozen input reads as a broken app.
                if (!Number.isFinite(numValue) || numValue < 0) {
                  return
                }
                setLoanAmount(Math.min(numValue, maxLoanAmount))
              }}
              min={minLoanAmount > 0 ? minLoanAmount : undefined}
              max={maxLoanAmount}
              className={`pl-8 text-lg ${!isDashboard ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400/40 disabled:opacity-50 disabled:cursor-not-allowed' : 'placeholder:text-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed'} ${isBelowMinimum ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              placeholder={minLoanAmount > 0 ? String(minLoanAmount) : ''}
            />
          </div>
          {hasNoLiquidity ? (
            <p className='text-sm text-red-500 mt-1'>
              No liquidity available — loans are currently unavailable.
            </p>
          ) : (
            <>
              <div
                className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
              >
                <span>
                  {tokenConfig?.loanToken.symbol || 'Token'} — $
                  {loanConfig?.minLoanAmount
                    ? Number(
                        formatUnits(
                          loanConfig.minLoanAmount,
                          tokenConfig?.loanToken.decimals || 18
                        )
                      ).toLocaleString()
                    : '1,000'}{' '}
                  min
                </span>
                <span>
                  {availableLiquidity !== undefined
                    ? `$${Math.floor(Number(formatUnits(availableLiquidity, tokenConfig?.loanToken.decimals || 18))).toLocaleString()} available`
                    : 'Loading liquidity...'}
                </span>
              </div>
              {isBelowMinimum && (
                <p className='text-sm text-red-500 mt-1'>
                  Minimum loan is ${minLoanAmount.toLocaleString()}{' '}
                  {tokenConfig?.loanToken.symbol || 'Token'}.
                </p>
              )}
            </>
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
              {needsCollateralChoice
                ? 'Select a collateral token first.'
                : configLoading
                  ? 'Loading durations...'
                  : 'No durations available'}
            </div>
          ) : (
            <>
              <input
                type='range'
                min={minDuration}
                max={maxDuration}
                step={Number(loanConfig.loanCycleDuration)}
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
              {needsCollateralChoice
                ? 'Select a collateral token first.'
                : configLoading
                  ? 'Loading LTV options...'
                  : 'No LTV options available'}
            </div>
          ) : (
            <>
              <input
                type='range'
                min={minLtvPercentage}
                max={maxLtvPercentage}
                step={0.5}
                value={ltv}
                disabled={ltvOptions.length === 0}
                onChange={(e) => {
                  setLtv(snapToTier(Number(e.target.value)))
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
