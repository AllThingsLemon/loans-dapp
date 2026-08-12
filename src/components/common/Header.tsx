'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isLoansPageHidden } from '@/src/config/referral'

export default function Header() {
  const pathname = usePathname()

  return (
    <div className='sticky top-0 z-50 flex items-center justify-center w-full border-b border-border/40 bg-background'>
      <header className='flex items-center justify-between gap-3 p-3 sm:p-4 min-w-full max-w-screen-xl'>
        <div className='flex items-center min-w-0 gap-2 sm:gap-3'>
          {/* `/` redirects to /liquidity when loans are hidden — link straight
              there so the logo doesn't bounce through a redirect. */}
          <Link
            href={isLoansPageHidden ? '/liquidity' : '/'}
            className='flex items-center gap-2 sm:gap-3 shrink-0'
          >
            <Image
              src='/images/lemloans-logo.png'
              alt='LemLoans Logo'
              width={40}
              height={40}
              className='h-8 w-8 sm:h-10 sm:w-10'
              priority
            />
            {/* Wordmark hidden on small screens to prevent overlap with nav + wallet button */}
            <h1 className='hidden sm:block text-2xl font-bold text-gray-900 dark:text-gray-100'>
              LemLoans
            </h1>
          </Link>
          {/* With loans hidden there is only one page left, so the whole nav
              goes — a lone tab that always points at the page you are already
              on is just clutter. Rendered from a build-time constant, so this
              is identical for connected and disconnected visitors. */}
          {!isLoansPageHidden && (
            <nav className='flex items-center gap-3 sm:gap-4 sm:ml-6 shrink-0'>
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
          )}
        </div>
        {/* Compact RainbowKit button on small screens — drop balance, use a shorter label
            and the icon-only chain status so the wallet pill doesn't blow out the header. */}
        <div className='shrink-0'>
          <div className='hidden sm:block'>
            <ConnectButton />
          </div>
          <div className='block sm:hidden'>
            <ConnectButton
              label='Connect'
              showBalance={false}
              accountStatus='avatar'
              chainStatus='icon'
            />
          </div>
        </div>
      </header>
    </div>
  )
}
