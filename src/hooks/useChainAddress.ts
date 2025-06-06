import { useChainId } from 'wagmi'
import { useMemo } from 'react'
import { paymentsConfig } from '../generated'

type ContractName = 'payments'

const contractConfigs = {
  payments: paymentsConfig
}

export function useChainAddress(contractName: ContractName) {
  const chainId = useChainId()

  const address = useMemo(() => {
    const config = contractConfigs[contractName]
    return config.address[chainId as keyof typeof config.address]
  }, [chainId, contractName])

  return address
}
