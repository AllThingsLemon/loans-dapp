'use client'
import { WagmiProvider } from 'wagmi'
import { config } from '../../config/wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import React from 'react'
import { queryClient } from '../../hooks/query/queryClient'
import '@rainbow-me/rainbowkit/styles.css'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

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
