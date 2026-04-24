import '../css/globals.css'
import Header from '@/src/components/common/Header'
import Footer from '@/src/components/common/Footer'
import { Providers } from '@/src/components/common/Providers'
import { Toaster } from '@/src/components/ui/toaster'

export const metadata = {
  title: 'LemLoans - DeFi Lending on LemonChain',
  description:
    'Decentralized lending and borrowing platform on LemonChain. Create loans, lend funds, and earn interest with transparent, secure smart contracts.',
  keywords:
    'DeFi, lending, borrowing, LemonChain, cryptocurrency, loans, decentralized finance',
  openGraph: {
    title: 'LemLoans - DeFi Lending on LemonChain',
    description:
      'Decentralized lending and borrowing platform on LemonChain. Create loans, lend funds, and earn interest with transparent, secure smart contracts.',
    url: 'https://www.lemloans.io/',
    siteName: 'LemLoans',
    images: [
      {
        url: '/images/lemloans-logo.png',
        width: 1200,
        height: 630,
        alt: 'LemLoans - DeFi Lending Platform'
      }
    ],
    locale: 'en_US',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='icon' href='/images/lemloans-logo.png' />
        <link rel='apple-touch-icon' href='/images/lemloans-logo.png' />
      </head>
      <body className='flex flex-col min-h-screen'>
        <Providers>
          <Header />
          <main className='flex-1'>
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
