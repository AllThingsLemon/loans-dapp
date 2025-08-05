'use client'
import { useAccount } from 'wagmi'
import { Dashboard } from '@/src/components/dashboard/Dashboard'
import { DisconnectedDashboard } from '@/src/components/dashboard/DisconnectedDashboard'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {isConnected ? <Dashboard /> : <DisconnectedDashboard />}
      </div>
    </div>
  )
}
