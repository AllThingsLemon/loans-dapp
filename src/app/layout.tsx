import '../css/globals.css'
import Header from '@/src/components/common/Header'
import { Providers } from '@/src/components/common/Providers'
import { Toaster } from '@/src/components/ui/toaster'

export const metadata = {
  title: 'Loans DApp'
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
