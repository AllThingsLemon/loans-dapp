'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'

export default function Header() {
  return (
    <div className='flex items-center justify-center w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <header className='flex items-center justify-between p-4 min-w-full max-w-screen-xl'>
        <div className='flex items-center space-x-3'>
          <Image
            src='/images/lemloans-logo.png'
            alt='LemLoans Logo'
            width={40}
            height={40}
            className='h-auto'
            priority
          />
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            LemLoans
          </h1>
        </div>
        <ConnectButton />
      </header>
    </div>
  )
}
