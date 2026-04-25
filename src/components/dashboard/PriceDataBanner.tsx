'use client'

import { usePricing } from '@/src/hooks/usePricing'
import { Card, CardContent } from '@/src/components/ui/card'
import { BarChart } from 'lucide-react'

function PriceDataBannerSkeleton() {
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='animate-pulse flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='h-8 w-8 bg-gray-200 rounded'></div>
            <div>
              <div className='h-5 w-32 bg-gray-200 rounded mb-2'></div>
              <div className='h-4 w-24 bg-gray-200 rounded'></div>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <div>
              <div className='h-4 w-16 bg-gray-200 rounded mb-2'></div>
              <div className='h-6 w-20 bg-gray-200 rounded'></div>
            </div>
            <div>
              <div className='h-4 w-20 bg-gray-200 rounded mb-2'></div>
              <div className='h-6 w-20 bg-gray-200 rounded'></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PriceDataBannerError({ error }: { error: Error }) {
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <BarChart className='h-8 w-8 text-gray-400' />
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                Price Data Unavailable
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Unable to fetch current prices
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PriceDataBanner() {
  const {
    spotPrice,
    monthlyAverage,
    feeTokenPrice,
    collateralSymbol,
    feeTokenSymbol,
    isLoading,
    error
  } = usePricing()

  if (isLoading) return <PriceDataBannerSkeleton />
  if (error) return <PriceDataBannerError error={error} />

  return (
    <Card>
      {/* On mobile: title row stacks above a 3-column price grid so the
          values get equal share of the width and don't get cut off. On
          sm+ the original side-by-side layout returns. */}
      <CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pr-8'>
        <div className='flex items-center gap-3'>
          <BarChart className='h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
          <div className='min-w-0'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
              Token Price Data
            </h3>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              Current market information
            </p>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-8'>
          <div className='text-center'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              {collateralSymbol ?? 'Collateral'} Price
            </p>
            <p className='text-base font-bold text-gray-900 dark:text-gray-100'>
              ${spotPrice ?? '—'}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              {collateralSymbol ?? 'Collateral'} Monthly Avg
            </p>
            <p className='text-base font-bold text-gray-900 dark:text-gray-100'>
              ${monthlyAverage ?? '—'}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              {feeTokenSymbol ?? 'Fee'} Price
            </p>
            <p className='text-base font-bold text-gray-900 dark:text-gray-100'>
              ${feeTokenPrice ?? '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
