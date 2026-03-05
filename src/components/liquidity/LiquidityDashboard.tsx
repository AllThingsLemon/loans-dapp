'use client'
import { useLiquidityPool } from '@/src/hooks/liquidity/useLiquidityPool'
import { usePricing } from '@/src/hooks/usePricing'
import { AddLiquidityCard } from './AddLiquidityCard'
import { RemoveLiquidityCard } from './RemoveLiquidityCard'
import { LiquidityPerformance } from './LiquidityPerformance'
import { Web3ErrorBoundary } from '@/src/components/error/Web3ErrorBoundary'

export function LiquidityDashboard() {
  const liquidityPool = useLiquidityPool()
  const pricing = usePricing()

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Become a LemLoans Liquidity Provider
        </h1>
        <p className='text-gray-600'>
          Provide liquidity to the lending pool and earn yield from borrower interest payments
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Web3ErrorBoundary>
          <AddLiquidityCard liquidityPool={liquidityPool} pricing={pricing} />
        </Web3ErrorBoundary>
        <Web3ErrorBoundary>
          <RemoveLiquidityCard liquidityPool={liquidityPool} pricing={pricing} />
        </Web3ErrorBoundary>
      </div>

      <Web3ErrorBoundary>
        <LiquidityPerformance liquidityPool={liquidityPool} pricing={pricing} />
      </Web3ErrorBoundary>
    </div>
  )
}
