'use client'
import { useLiquidityPool } from '@/src/hooks/liquidity/useLiquidityPool'
import { AddLiquidityCard } from './AddLiquidityCard'
import { RemoveLiquidityCard } from './RemoveLiquidityCard'
import { LiquidityPerformance } from './LiquidityPerformance'
import { Web3ErrorBoundary } from '@/src/components/error/Web3ErrorBoundary'
import { ProtocolStatusBanner } from '@/src/components/common/ProtocolStatusBanner'
import { ReferralBanner } from '@/src/components/referral/ReferralBanner'
import { useReferralState } from '@/src/hooks/referral/useReferralState'

export function LiquidityDashboard() {
  const liquidityPool = useLiquidityPool()

  // Owned here rather than in AddLiquidityCard so the banner can span the full
  // dashboard width above both cards while still sharing one instance with the
  // deposit form. Inert unless a router is configured for the active chain.
  const referral = useReferralState(liquidityPool.liquidityPoolContractAddress)

  return (
    <div className='space-y-6'>
      {/* Protocol health — paused contracts / stale price feed */}
      <Web3ErrorBoundary>
        <ProtocolStatusBanner />
      </Web3ErrorBoundary>

      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Become a LemLoans Liquidity Provider
        </h1>
        <p className='text-gray-600'>
          Provide liquidity to the lending pool and earn yield from borrower interest payments
        </p>
      </div>

      {/* Full width, above both cards — renders nothing when no router is
          configured or no referrer was captured. */}
      <Web3ErrorBoundary>
        <ReferralBanner
          referral={referral}
          stableDecimals={liquidityPool.stableTokenDecimals ?? 18}
        />
      </Web3ErrorBoundary>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Web3ErrorBoundary>
          <AddLiquidityCard
            liquidityPool={liquidityPool}
            referral={referral}
          />
        </Web3ErrorBoundary>
        <Web3ErrorBoundary>
          <RemoveLiquidityCard liquidityPool={liquidityPool} />
        </Web3ErrorBoundary>
      </div>

      <Web3ErrorBoundary>
        <LiquidityPerformance liquidityPool={liquidityPool} />
      </Web3ErrorBoundary>
    </div>
  )
}
