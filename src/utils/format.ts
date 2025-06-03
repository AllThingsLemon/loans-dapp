import BigNumber from 'bignumber.js'

export const formatCurrency = (number: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  return formatter.format(number)
}

//if a variable can be either a number OR big number object, makes sure that it is a big number object
export const formatBigNumber = (
  value: number | string | BigNumber | BigInt | undefined
): BigNumber => new BigNumber(value?.toString() || Number(value))

export const formatDelta = (
  current: string,
  previous: string
): { change: 'neutral' | 'positive' | 'negative' | string; delta: string } => {
  const today = new BigNumber(current)
  const h24Change = new BigNumber(previous)

  const displayPercentage = h24Change.abs()
  let delta = '±'
  let change = 'neutral'

  if (h24Change.isLessThan(0)) {
    delta = '-'
    change = 'negative'
  } else if (h24Change.isGreaterThan(0)) {
    delta = '+'
    change = 'positive'
  }

  const marketDelta = `${delta}${displayPercentage.toFixed(2)}%`
  return {
    change,
    delta: marketDelta
  }
}

export const formatAtomicUnits = (
  amount: bigint | undefined,
  decimals: bigint,
  symbol: string | undefined,
  decimalPlaces: number = 4,
  hideZero = false
) => {
  if (!amount) {
    return '-'
  }
  if (amount == 0n) {
    return '-'
  }
  const amountBigNum = BigNumber(amount.toString())
  const moveDecimalDivisorBigNum = BigNumber((10n ** decimals).toString())
  const unitsWithDecimals = amountBigNum.div(moveDecimalDivisorBigNum)

  const num = unitsWithDecimals.toNumber().toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  })

  return `${hideZero ? Number(num) : num} ${symbol?.toUpperCase()}`
}
