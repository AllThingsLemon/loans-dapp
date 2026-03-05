'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <div className='flex items-center justify-center w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <header className='flex items-center justify-between p-4 min-w-full max-w-screen-xl'>
        <div className='flex items-center space-x-3'>
          <Link href='/' className='flex items-center space-x-3'>
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
          </Link>
          <nav className='flex items-center space-x-4 ml-6'>
            <Link
              href='/'
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Loans
            </Link>
            <Link
              href='/liquidity'
              className={`text-sm font-medium transition-colors ${
                pathname === '/liquidity'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Liquidity
            </Link>
          </nav>
        </div>
        <ConnectButton />
      </header>
    </div>
  )
}
