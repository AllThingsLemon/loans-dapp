import { createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { injected } from 'wagmi/connectors'
import { fallback } from '@wagmi/core'

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

// Only initialize WalletConnect on the client side
const getConnectors = () => {
  if (typeof window === 'undefined' || !walletConnectProjectId) {
    return [injected()]
  }
  
  const { connectors: rainbowConnectors } = getDefaultWallets({
    appName: 'Lemon-Payments',
    projectId: walletConnectProjectId
  })
  
  return [injected(), ...rainbowConnectors]
}

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: getConnectors(),
  transports: {
    [bsc.id]: fallback([
      http('https://bsc-dataseed1.binance.org/'),
      http('https://bsc-dataseed1.ninicoin.io/'),
      http('https://bsc-dataseed1.defibit.io/')
    ]),
    [bscTestnet.id]: fallback([
      http('https://data-seed-prebsc-1-s1.binance.org:8545'),
      http('https://data-seed-prebsc-2-s1.binance.org:8545'),
      http('http://data-seed-prebsc-1-s2.binance.org:8545'),
      http('http://data-seed-prebsc-2-s2.binance.org:8545'),
      http('https://data-seed-prebsc-1-s3.binance.org:8545')
    ])
  }
})
