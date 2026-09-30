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
        url: '/images/lemloans-hero.jpg',
        width: 1200,
        height: 1200,
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
        {/* Exact-size icons so browsers never downscale a large image into
            the 16/32px tab slot — that rescaling is what made the mark look
            blurry. /favicon.ico (src/app/favicon.ico) carries 16-128px
            layers for the browsers that insist on it. */}
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/images/icon-32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/images/icon-16.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/images/apple-touch-icon.png'
        />
      </head>
      <body className='flex flex-col min-h-screen'>
        <Providers>
          <Header />
          <main className='flex-1'>{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
