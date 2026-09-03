import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
  rainbowWallet
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig } from 'wagmi'
import { defineChain, fallback, http, type Chain } from 'viem'

const bsc = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB'
  },
  rpcUrls: {
    default: {
      http: [
        'https://bsc-mainnet.nodereal.io/v1/1491626c51634eb8bffd3d824757787c',
        'https://bsc-rpc.publicnode.com',
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed2.binance.org',
        'https://bsc-dataseed3.binance.org',
        'https://bsc-dataseed4.binance.org'
      ],
      webSocket: [
        'wss://bsc-mainnet.nodereal.io/ws/v1/1491626c51634eb8bffd3d824757787c'
      ]
    },
    public: {
      http: [
        'https://bsc-mainnet.nodereal.io/v1/1491626c51634eb8bffd3d824757787c',
        'https://bsc-rpc.publicnode.com',
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed2.binance.org',
        'https://bsc-dataseed3.binance.org',
        'https://bsc-dataseed4.binance.org'
      ],
      webSocket: [
        'wss://bsc-mainnet.nodereal.io/ws/v1/1491626c51634eb8bffd3d824757787c'
      ]
    }
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' }
  }
})

const bscTestnet = defineChain({
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tBNB',
    symbol: 'tBNB'
  },
  rpcUrls: {
    default: {
      http: [
        'https://bsc-testnet.nodereal.io/v1/1491626c51634eb8bffd3d824757787c',
        'https://data-seed-prebsc-1-s1.binance.org:8545',
        'https://data-seed-prebsc-2-s1.binance.org:8545',
        'https://data-seed-prebsc-1-s2.binance.org:8545'
      ],
      webSocket: [
        'wss://bsc-testnet.nodereal.io/ws/v1/1491626c51634eb8bffd3d824757787c'
      ]
    },
    public: {
      http: [
        'https://bsc-testnet.nodereal.io/v1/1491626c51634eb8bffd3d824757787c',
        'https://data-seed-prebsc-1-s1.binance.org:8545',
        'https://data-seed-prebsc-2-s1.binance.org:8545'
      ],
      webSocket: [
        'wss://bsc-testnet.nodereal.io/ws/v1/1491626c51634eb8bffd3d824757787c'
      ]
    }
  },
  blockExplorers: {
    default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' }
  },
  testnet: true
})

const citron = {
  id: 1005,
  name: 'LemonChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TLEMX',
    symbol: 'tLEMX'
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.lemonchain.io'] },
    public: { http: ['https://rpc.testnet.lemonchain.io'] }
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
    default: { http: ['https://rpc.lemonchain.io'] },
    public: { http: ['https://rpc.lemonchain.io'] }
  },
  blockExplorers: {
    default: {
      name: 'Lemon Chain Explorer',
      url: 'https://explorer.lemonchain.io/'
    }
  }
} as const satisfies Chain

// Registry of every chain the protocol could be deployed on, keyed by
// chain id. Add new chains here as deployments expand.
const SUPPORTED_CHAIN_REGISTRY: Record<number, Chain> = {
  [lemon.id]: lemon,
  [citron.id]: citron,
  [bsc.id]: bsc,
  [bscTestnet.id]: bscTestnet
}

// Resolve the active chain set from NEXT_PUBLIC_SUPPORTED_CHAINS, a
// comma-separated list of chain ids (e.g. "1006,1005"). Order matters —
// the first entry is the default the wallet connects to. Defaults to the
// LemonChain mainnet id when the env var is missing or unparseable.
const resolveSupportedChains = (): readonly [Chain, ...Chain[]] => {
  const raw = process.env.NEXT_PUBLIC_SUPPORTED_CHAINS ?? String(lemon.id)
  const ids = raw
    .split(',')
    .map((k) => Number.parseInt(k.trim(), 10))
    .filter((id) => Number.isFinite(id))
  const resolved = ids
    .map((id) => SUPPORTED_CHAIN_REGISTRY[id])
    .filter((c): c is Chain => !!c)
  if (resolved.length === 0) return [lemon] as const
  return resolved as unknown as readonly [Chain, ...Chain[]]
}

const chains = resolveSupportedChains()

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        walletConnectWallet,
        rainbowWallet
      ]
    }
  ],
  {
    appName: 'Loans DApp',
    projectId: walletConnectProjectId
  }
)

const buildTransport = (chain: Chain) => {
  const urls = chain.rpcUrls.default.http
  if (urls.length > 1) {
    return fallback(
      urls.map((url) => http(url, { retryCount: 3, retryDelay: 1000 })),
      { rank: true, retryCount: 5, retryDelay: 1000 }
    )
  }
  return http(urls[0], { retryCount: 5, retryDelay: 1000 })
}

export const config = createConfig({
  chains,
  connectors,
  transports: Object.fromEntries(chains.map((c) => [c.id, buildTransport(c)])),
  pollingInterval: 4000,
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16
    }
  }
})

export { chains }
