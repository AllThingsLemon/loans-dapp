import * as dotenv from 'dotenv'
dotenv.config()

import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { bsc, bscTestnet } from 'wagmi/chains'
import { Abi } from 'viem'
import PaymentsAbi from './src/abis/Payments.json'

const NEXT_PUBLIC_MAINNET_PAYMENTS_ADDRESS = process.env
  .NEXT_PUBLIC_MAINNET_PAYMENTS_ADDRESS as `0x${string}`

const NEXT_PUBLIC_TESTNET_PAYMENTS_ADDRESS = process.env
  .NEXT_PUBLIC_TESTNET_PAYMENTS_ADDRESS as `0x${string}`

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'Payments',
      abi: PaymentsAbi as Abi,
      address: {
        [bsc.id]: NEXT_PUBLIC_MAINNET_PAYMENTS_ADDRESS,
        [bscTestnet.id]: NEXT_PUBLIC_TESTNET_PAYMENTS_ADDRESS
      }
    },
  ],
  plugins: [react()]
})
