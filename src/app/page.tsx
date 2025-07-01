'use client'
import { useAccount } from 'wagmi'
import { Dashboard } from '@/src/components/dashboard/Dashboard'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? (
          <Dashboard />
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Loans DApp
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect your wallet to start managing loans and lending activities
            </p>
            <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
              <p className="text-gray-500">
                Please connect your wallet to access the loan management dashboard
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
