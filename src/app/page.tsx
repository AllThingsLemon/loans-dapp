'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Dashboard } from '@/src/components/dashboard/Dashboard'
import { DisconnectedDashboard } from '@/src/components/dashboard/DisconnectedDashboard'
import { isLoansPageHidden } from '@/src/config/referral'

export default function Home() {
  const { isConnected } = useAccount()
  const router = useRouter()

  // NEXT_PUBLIC_HIDE_LOANS_PAGE is inlined at build time, so this branch is
  // constant for the life of the bundle.
  useEffect(() => {
    if (isLoansPageHidden) router.replace('/liquidity')
  }, [router])

  // Returning before rendering Dashboard matters: it keeps the loans UI from
  // flashing during the redirect AND stops its hooks — which poll contracts on
  // an interval — from ever mounting.
  if (isLoansPageHidden) {
    return <div className='min-h-screen bg-gray-50' />
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {isConnected ? <Dashboard /> : <DisconnectedDashboard />}
      </div>
    </div>
  )
}
