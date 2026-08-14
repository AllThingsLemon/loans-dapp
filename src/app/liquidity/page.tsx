'use client'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { LiquidityDashboard } from '@/src/components/liquidity/LiquidityDashboard'
import { DisconnectedLiquidity } from '@/src/components/liquidity/DisconnectedLiquidity'

export default function LiquidityPage() {
  const { isConnected } = useAccount()

  // Connecting swaps a tall marketing page for the dashboard, but the browser
  // keeps whatever scroll offset the visitor had reached — connect from the
  // button near the bottom of the landing page and you arrive part-way down the
  // dashboard.
  //
  // Resetting once is not enough. RainbowKit's modal restores the scroll offset
  // it captured as it tears down, which lands AFTER the connection does — a
  // single reset here is simply undone. Measured on this page, the restore
  // settles roughly 600ms after the effect fires, so retry across a window wide
  // enough to outlast it on a slower machine. The last attempt is early enough
  // that a deliberate scroll by the user is not fought.
  useEffect(() => {
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    toTop()
    const timers = [60, 250, 600, 1000, 1500].map((ms) =>
      window.setTimeout(toTop, ms)
    )
    return () => timers.forEach(window.clearTimeout)
  }, [isConnected])

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {isConnected ? <LiquidityDashboard /> : <DisconnectedLiquidity />}
      </div>
    </div>
  )
}
