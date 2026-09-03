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
import ReferralDepositRouterAbi from './src/abis/ReferralDepositRouter.json'

// Only the Loans address is sourced from env. Every other protocol contract
// address is discovered on-chain at runtime via useProtocolAddresses():
//   CollateralManager  = Loans.collateralManager()
//   LiquidityPool      = Loans.liquidityPool()
//   SwapManager        = LiquidityPool.swapManager()
const CHAINS = {
  LEMON: 1006,
  CITRON: 1005,
  BSC: 56,
  BSC_TESTNET: 97,
} as const

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

const LOANS_ADDRESSES = {
  [CHAINS.LEMON]: (process.env.NEXT_PUBLIC_LEMON_LOANS_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  [CHAINS.CITRON]: (process.env.NEXT_PUBLIC_CITRON_LOANS_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  [CHAINS.BSC]: (process.env.NEXT_PUBLIC_BSC_LOANS_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  [CHAINS.BSC_TESTNET]: (process.env.NEXT_PUBLIC_BSC_TESTNET_LOANS_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
} as const

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'Loans',
      abi: LoansAbi as Abi,
      address: LOANS_ADDRESSES,
    },
    {
      name: 'PriceDataFeed',
      abi: PriceDataFeedAbi as Abi,
      // Address resolved at runtime from Loans.priceDataFeed()
    },
    {
      name: 'PriceHelper',
      abi: PriceHelperAbi as Abi,
      // Address resolved at runtime from LiquidityPool.priceHelper()
    },
    {
      name: 'LiquidityPool',
      abi: LiquidityPoolAbi as Abi,
      // Address resolved at runtime from Loans.liquidityPool()
    },
    {
      name: 'CollateralManager',
      abi: CollateralManagerAbi as Abi,
      // Address resolved at runtime from Loans.collateralManager()
    },
    {
      name: 'ReferralDepositRouter',
      abi: ReferralDepositRouterAbi as Abi,
      // ABI only — deliberately NO address map here. The address is resolved at
      // runtime by src/config/referral.ts, which validates it and treats
      // anything malformed as "no router configured". Declaring it here instead
      // would make wagmi validate the env var at BUILD time, so a stray space or
      // a placeholder in a deployment variable fails the whole build rather than
      // just disabling referrals.
    },
  ],
  plugins: [
    react(),
    actions(),
  ]
})
