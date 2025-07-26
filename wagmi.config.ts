import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config() // Also load .env if it exists

import { defineConfig } from '@wagmi/cli'
import { react, actions } from '@wagmi/cli/plugins'
import { Abi } from 'viem'

// Import contract ABIs when available
import LoansAbi from './src/abis/Loans.json'

// Chain configuration following wagmi best practices
const CHAINS = {
  LEMON: 1006,
  CITRON: 1005,
} as const

// Contract addresses by chain (following wagmi patterns)
const ADDRESSES = {
  [CHAINS.LEMON]: {
    loans: process.env.NEXT_PUBLIC_LEMON_LOANS_ADDRESS as `0x${string}`,
  },
  [CHAINS.CITRON]: {
    loans: process.env.NEXT_PUBLIC_CITRON_LOANS_ADDRESS as `0x${string}`,
  },
} as const

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'Loans',
      abi: LoansAbi as Abi,
      address: {
        [CHAINS.CITRON]: ADDRESSES[CHAINS.CITRON].loans,
      }
    },
  ],
  plugins: [
    react(),
    actions(),
  ]
})
