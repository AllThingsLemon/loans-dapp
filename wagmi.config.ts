import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config() // Also load .env if it exists

import { defineConfig } from '@wagmi/cli'
import { react, actions } from '@wagmi/cli/plugins'
import { Abi } from 'viem'

// Import contract ABIs when available
import LoansAbi from './src/abis/Loans.json'
import PriceDataFeedAbi from './src/abis/PriceDataFeed.json'
import LiquidityPoolAbi from './src/abis/LiquidityPool.json'
import PriceHelperAbi from './src/abis/PriceHelper.json'
import CollateralManagerAbi from './src/abis/CollateralManager.json'

// Chain configuration following wagmi best practices
const CHAINS = {
  LEMON: 1006,
  CITRON: 1005,
} as const

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

// Contract addresses by chain (following wagmi patterns)
const ADDRESSES = {
  [CHAINS.LEMON]: {
    loans: (process.env.NEXT_PUBLIC_LEMON_LOANS_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
    liquidityPool: (process.env.NEXT_PUBLIC_LEMON_LIQUIDITY_POOL_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
    collateralManager: (process.env.NEXT_PUBLIC_LEMON_COLLATERAL_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  },
  [CHAINS.CITRON]: {
    loans: (process.env.NEXT_PUBLIC_CITRON_LOANS_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
    liquidityPool: (process.env.NEXT_PUBLIC_CITRON_LIQUIDITY_POOL_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
    collateralManager: (process.env.NEXT_PUBLIC_CITRON_COLLATERAL_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
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
        [CHAINS.LEMON]: ADDRESSES[CHAINS.LEMON].loans,
      }
    },
    {
      name: 'PriceDataFeed',
      abi: PriceDataFeedAbi as Abi,
      // Address will be dynamically obtained from Loans contract
    },
    {
      name: 'PriceHelper',
      abi: PriceHelperAbi as Abi,
      // Address will be dynamically obtained from LiquidityPool contract via priceHelper()
    },
    {
      name: 'LiquidityPool',
      abi: LiquidityPoolAbi as Abi,
      address: {
        [CHAINS.CITRON]: ADDRESSES[CHAINS.CITRON].liquidityPool,
        [CHAINS.LEMON]: ADDRESSES[CHAINS.LEMON].liquidityPool,
      }
    },
    {
      name: 'CollateralManager',
      abi: CollateralManagerAbi as Abi,
      address: {
        [CHAINS.CITRON]: ADDRESSES[CHAINS.CITRON].collateralManager,
        [CHAINS.LEMON]: ADDRESSES[CHAINS.LEMON].collateralManager,
      }
    },
  ],
  plugins: [
    react(),
    actions(),
  ]
})
