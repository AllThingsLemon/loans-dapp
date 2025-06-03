import { useEffect, useState } from 'react'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { Address, zeroAddress, erc20Abi } from 'viem'
import { useReadPaymentsGetAllPaymentTokenSymbols } from '../generated'

import oracleAbi from '@/src/abis/OracleAbi.json'
import paymentsAbi from '@/src/abis/Payments.json'

export interface PaymentToken {
  symbol: string
  address: Address
  priceFeed: Address
  price: bigint
  decimals: number
  balance: string
  isNative: boolean
}

export const usePaymentTokens = () => {
  const { address } = useAccount()
  const { data: nativeBalanceData } = useBalance({ address })
  const { data: symbols } = useReadPaymentsGetAllPaymentTokenSymbols()

  const enabled = !!symbols?.length
  const PAYMENTS_ADDRESS = zeroAddress as `0x${string}` // replace with actual contract address

  // Read paymentTokens (tokenAddress, oracle) from contract
  const contracts =
    symbols?.map((symbol) => ({
      address: PAYMENTS_ADDRESS,
      abi: paymentsAbi,
      functionName: 'paymentTokens',
      args: [symbol]
    })) ?? []

  const { data: paymentTokensData } = useReadContracts({
    contracts,
    enabled,
    watch: true
  })

  // Parse payment token info
  const baseTokens: PaymentToken[] =
    symbols?.map((symbol, idx) => {
      const result = paymentTokensData?.[idx]?.result as any
      const tokenAddress = result?.tokenAddress as Address
      const isNative = tokenAddress === zeroAddress
      return {
        symbol,
        address: tokenAddress,
        priceFeed: result?.chainlinkFeed as Address,
        decimals: 0,
        balance: '0',
        price: 0n,
        isNative
      }
    }) ?? []

  // Generate list of ERC20 addresses
  const erc20Addresses = baseTokens
    .filter((t) => !t.isNative)
    .map((t) => t.address)

  const erc20Contracts = erc20Addresses.flatMap((token) => [
    { address: token, abi: erc20Abi, functionName: 'decimals' },
    {
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address!]
    }
  ])

  const { data: erc20Data } = useReadContracts({
    contracts: erc20Contracts,
    enabled: !!address && erc20Contracts.length > 0,
    watch: true
  })

  const priceFeedContracts = baseTokens.map((token) => [
    {
      address: token.priceFeed,
      abi: oracleAbi,
      functionName: 'latestAnswer'
    }
  ])

  const { data: priceFeedData } = useReadContracts({
    contracts: priceFeedContracts,
    enabled: !!address && erc20Contracts.length > 0,
    watch: true
  })

  // Merge balance/decimals into baseTokens
  let tokenIndex = 0
  const tokensWithBalances = baseTokens.map((token, i) => {
    if (token.isNative) {
      return {
        ...token,
        decimals: nativeBalanceData?.decimals ?? 18,
        balance: nativeBalanceData?.value?.toString() ?? '0',
        price: priceFeedData?.[i]?.result as bigint
      }
    } else {
      const decimals = erc20Data?.[tokenIndex * 2]?.result as number
      const balance = erc20Data?.[tokenIndex * 2 + 1]?.result as bigint
      tokenIndex++
      return {
        ...token,
        decimals: decimals ?? 0,
        balance: balance?.toString() ?? '0',
        price: priceFeedData?.[i]?.result as bigint
      }
    }
  })

  const [paymentTokens, setPaymentTokens] = useState<PaymentToken[]>([])
  const [paymentToken, setPaymentToken] = useState<PaymentToken>(
    {} as PaymentToken
  )

  useEffect(() => {
    setPaymentTokens(tokensWithBalances)
    setPaymentToken(tokensWithBalances[0])
  }, [tokensWithBalances])

  return {
    paymentTokens,
    paymentToken,
    setPaymentToken
  }
}
