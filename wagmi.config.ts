import * as dotenv from 'dotenv'
dotenv.config()

import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { bsc, bscTestnet } from 'wagmi/chains'
import { Abi } from 'viem'
import NftAbi from './src/abis/NftAbi.json'

const NEXT_PUBLIC_TESTNET_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_TESTNET_NFT_ADDRESS as `0x${string}`

const NEXT_PUBLIC_MAINNET_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_MAINNET_NFT_ADDRESS as `0x${string}`

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    
    {
      name: 'Nft',
      abi: NftAbi as Abi,
      address: {
        [bsc.id]: NEXT_PUBLIC_MAINNET_NFT_ADDRESS,
        [bscTestnet.id]: NEXT_PUBLIC_TESTNET_NFT_ADDRESS
      }
    },

  ],
  plugins: [react()]
})
