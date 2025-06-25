'use client'
import { WagmiProvider } from 'wagmi'
import { config } from '../../config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import React from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import { client } from '@/src/client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const [queryClient] = React.useState<QueryClient>(() => new QueryClient())
  React.useEffect(() => setMounted(true), [])

  client.setConfig({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || ''
  })

  if (!mounted) return null

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            ...darkTheme.accentColors.blue
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
