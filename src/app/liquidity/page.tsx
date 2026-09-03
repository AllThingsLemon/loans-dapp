'use client'
import { useEffect, useRef } from 'react'
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
  // enough to outlast it on a slower machine.
  //
  // Only reset on an actual connect/disconnect transition — never on mount,
  // where the retry window would fight a visitor already scrolling. wagmi's
  // auto-reconnect flips isConnected shortly after hydration; that transition
  // still swaps the page content, so it legitimately re-runs the reset.
  const prevConnected = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevConnected.current === null) {
      prevConnected.current = isConnected
      return
    }
    if (prevConnected.current === isConnected) return
    prevConnected.current = isConnected

    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    toTop()
    const timers = [60, 250, 600, 1000, 1500].map((ms) =>
      window.setTimeout(toTop, ms)
    )
    // A deliberate scroll wins immediately: drop the remaining retries the
    // moment the user touches the wheel, trackpad, or keyboard.
    const cancel = () => timers.forEach(window.clearTimeout)
    const opts = { passive: true, once: true } as const
    window.addEventListener('wheel', cancel, opts)
    window.addEventListener('touchmove', cancel, opts)
    window.addEventListener('keydown', cancel, opts)
    return () => {
      cancel()
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchmove', cancel)
      window.removeEventListener('keydown', cancel)
    }
  }, [isConnected])

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {isConnected ? <LiquidityDashboard /> : <DisconnectedLiquidity />}
      </div>
    </div>
  )
}
