import '../css/globals.css'
import Header from '@/src/components/common/Header'
import { Providers } from '@/src/components/common/Providers'
import { Toaster } from '@/src/components/ui/toaster'

export const metadata = {
  title: 'LemLoans'
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
      <body>
        <Providers>
          <Header />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
