'use client'
import { useAccount } from 'wagmi'
import { Payments } from '../components/dashboard/Payments'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div>
      {isConnected ? (
        <div className="chart-wrapper mx-auto flex flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
          <div className="grid w-full gap-6 lg:max-w-[800px]">
            <Payments />
          </div>
        </div>
      ) : (
        <p className="text-2xl text-center mt-8">
          Connect your wallet to process your payment
        </p>
      )}
    </div>
  )
}
