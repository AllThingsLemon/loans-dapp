'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'

export function DisconnectedDashboard() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8'>
      <div className='flex flex-col items-center space-y-6'>
        <div className='flex items-center space-x-4'>
          <Image
            src='/images/lemloans-logo.png'
            alt='LemLoans Logo'
            width={80}
            height={80}
            className='h-auto'
            priority
          />
          <h1 className='text-4xl font-bold text-gray-900 dark:text-gray-100'>
            LemLoans
          </h1>
        </div>
        <h2 className='text-2xl font-semibold text-gray-700 dark:text-gray-300'>
          Welcome to the future of DeFi lending!
        </h2>
      </div>
      <ConnectButton />
    </div>
  )
}
