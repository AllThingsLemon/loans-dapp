import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
  rainbowWallet
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { type Chain } from 'viem'

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
  [citron.id]: citron
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

export const config = createConfig({
  chains,
  connectors,
  transports: Object.fromEntries(chains.map((c) => [c.id, http()])),
  pollingInterval: 4000,
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16
    }
  }
})

export { chains }
