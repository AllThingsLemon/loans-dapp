import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { type Chain } from 'viem'

const citron = {
  id: 1005,
  name: 'LemonChainTestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TLEMX',
    symbol: 'tLEMX'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.lemonchain.io']
    },
    public: {
      http: ['https://rpc.testnet.lemonchain.io']
    }
  },
  blockExplorers: {
    default: {
      name: 'Lemon Chain Testnet Explorer',
      url: 'https://explorer-testnet.lemonchain.io/'
    }
  }
} as const satisfies Chain

const lemon = {
  id: 1006,
  name: 'LemonChain',
  nativeCurrency: {
    decimals: 18,
    name: 'LEMX',
    symbol: 'LEMX'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.lemonchain.io']
    },
    public: {
      http: ['https://rpc.lemonchain.io']
    }
  },
  blockExplorers: {
    default: {
      name: 'Lemon Chain Explorer',
      url: 'https://explorer.lemonchain.io/'
    }
  }
} as const satisfies Chain

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''


const chains = [
  lemon,
  ...(process.env.NEXT_PUBLIC_INCLUDE_TESTNET === 'true' ? [citron] : [])
] as const

const { connectors } = getDefaultWallets({
  appName: 'Loans DApp',
  projectId: walletConnectProjectId
})

export const config = createConfig({
  chains,
  connectors,
  transports: {
    [citron.id]: http(),
    [lemon.id]: http(),
  },
  pollingInterval: 4000, // Poll every 4 seconds
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16,
    },
  },
})

export { chains }
