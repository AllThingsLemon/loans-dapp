import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
  rainbowWallet
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig } from 'wagmi'
import { defineChain, type Chain } from 'viem'
import {
  BSC_RPC_URLS,
  BSC_TESTNET_RPC_URLS,
  PROXIED_RPC_URLS,
  rpcProxyPath
} from './rpc'
import { buildTransport } from './transport'

const bsc = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB'
  },
  // Only the binance dataseeds answer browsers reliably (see src/config/rpc.ts).
  rpcUrls: {
    default: { http: BSC_RPC_URLS },
    public: { http: BSC_RPC_URLS }
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 15921452
    }
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
  // Same endpoints the proxy relays to (see src/config/rpc.ts).
  rpcUrls: {
    default: { http: BSC_TESTNET_RPC_URLS },
    public: {
      http: [
        'https://data-seed-prebsc-1-s1.binance.org:8545',
        'https://data-seed-prebsc-2-s1.binance.org:8545'
      ]
    }
  },
  blockExplorers: {
    default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 17422483
    }
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

/**
 * The site's own /api/rpc proxy for a BNB chain, in a browser: the last
 * resort for visitors whose network, DNS filter or ad blocker blocks
 * binance.org (see buildTransport). Absolute, since viem builds a Request
 * from it; none during prerender, which sends no requests.
 */
const proxyUrlFor = (chainId: number) =>
  PROXIED_RPC_URLS[chainId] && typeof window !== 'undefined'
    ? `${window.location.origin}${rpcProxyPath(chainId)}`
    : undefined

export const config = createConfig({
  chains,
  connectors,
  transports: Object.fromEntries(
    chains.map((c) => [
      c.id,
      buildTransport(c.rpcUrls.default.http, proxyUrlFor(c.id))
    ])
  ),
  pollingInterval: 4000,
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16
    }
  }
})

export { chains }
