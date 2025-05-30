import { useChainId } from 'wagmi'
import { useMemo } from 'react'
import {
  nftConfig,
  tokenConfig,
  rewardDistributorConfig,
  usdtConfig,
  usdcConfig
} from '../generated'

type ContractName = 'nft' | 'token' | 'rewardDistributor' | 'usdt' | 'usdc'

const contractConfigs = {
  nft: nftConfig,
  token: tokenConfig,
  rewardDistributor: rewardDistributorConfig,
  usdt: usdtConfig,
  usdc: usdcConfig
}

export function useChainAddress(contractName: ContractName) {
  const chainId = useChainId()

  const address = useMemo(() => {
    const config = contractConfigs[contractName]
    return config.address[chainId as keyof typeof config.address]
  }, [chainId, contractName])

  return address
}
