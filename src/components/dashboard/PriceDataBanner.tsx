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
          <p className='text-sm text-red-600'>Error: {error.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PriceDataBanner() {
  const {
    spotPrice,
    monthlyAverage,
    tokenSymbol,
    isLoading,
    error
  } = usePricing()

  if (isLoading) return <PriceDataBannerSkeleton />
  if (error) return <PriceDataBannerError error={error} />

  return (
    <Card>
      <CardContent className='flex items-center justify-between p-4 pr-8'>
        <div className='flex items-center gap-3'>
          <BarChart className='h-5 w-5 text-blue-600 dark:text-blue-400' />
          <div>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
              {tokenSymbol} Price Data
            </h3>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              Current market information
            </p>
          </div>
        </div>
        
        <div className='flex items-center gap-12'>
          <div className='text-center'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>Current</p>
            <p className='text-base font-bold text-gray-900 dark:text-gray-100'>
              ${spotPrice}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>Monthly Avg</p>
            <p className='text-base font-bold text-gray-900 dark:text-gray-100'>
              ${monthlyAverage}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
