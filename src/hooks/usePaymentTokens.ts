import { useEffect, useState } from 'react'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { Address, zeroAddress, erc20Abi, Abi } from 'viem'
import { useReadPaymentsGetAllPaymentTokenSymbols } from '../generated'

import { useChainAddress } from '@/src/hooks/useChainAddress'
import ChainlinkFeed from '@/src/abis/ChainlinkFeed.json'
import PaymentsAbi from '@/src/abis/Payments.json'

export interface PaymentToken {
  symbol: string
  address: Address
  priceFeed: Address
  price: string
  decimals: number
  balance: string
  isNative: boolean
}

export const usePaymentTokens = () => {
  const { address } = useAccount()

  const { data: nativeBalanceData, refetch: refetchNativeBalanceQuery } =
    useBalance({ address })
  const { data: symbols } = useReadPaymentsGetAllPaymentTokenSymbols()

  let enabled = !!symbols?.length
  const PAYMENTS_ADDRESS = useChainAddress('payments')

  const contracts =
    symbols?.map((symbol) => ({
      address: PAYMENTS_ADDRESS,
      abi: PaymentsAbi as Abi,
      functionName: 'paymentTokens',
      args: [symbol]
    })) ?? []

  const { data: paymentTokensData } = useReadContracts({
    contracts,
    query: {
      enabled
    }
  })

  // Parse payment token info
  const baseTokens: PaymentToken[] =
    symbols?.map((symbol, idx) => {
      const result = paymentTokensData?.[idx]?.result as any
      const tokenAddress = result?.[0] as Address
      const isNative = tokenAddress === zeroAddress
      return {
        symbol,
        address: tokenAddress,
        priceFeed: result?.[1] as Address,
        decimals: 0,
        balance: '0',
        price: '0',
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

  const { data: erc20Data, refetch: refetchErc20BalanceQuery } =
    useReadContracts({
      contracts: erc20Contracts,
      query: {
        enabled: !!address && erc20Contracts.length > 0
      }
    })

  const priceFeedContracts = baseTokens.flatMap((token) => ({
    address: token.priceFeed,
    abi: ChainlinkFeed as Abi,
    functionName: 'latestAnswer'
  }))

  const { data: priceFeedData } = useReadContracts({
    contracts: priceFeedContracts,
    query: {
      enabled: !!address && baseTokens.length > 0
    }
  })

  // Merge balance/decimals into baseTokens
  let tokenIndex = 0
  const tokensWithBalances: PaymentToken[] = baseTokens.map((token, i) => {
    if (token.isNative) {
      return {
        ...token,
        decimals: nativeBalanceData?.decimals ?? 18,
        balance: nativeBalanceData?.value?.toString() ?? '0',
        price: priceFeedData?.[i]?.result?.toString() ?? '0'
      }
    } else {
      const decimals = erc20Data?.[tokenIndex * 2]?.result as number
      const balance = erc20Data?.[tokenIndex * 2 + 1]?.result as bigint
      tokenIndex++
      return {
        ...token,
        decimals: decimals ?? 0,
        balance: balance?.toString() ?? '0',
        price: priceFeedData?.[i]?.result?.toString() ?? '0'
      }
    }
  })

  const [paymentTokens, setPaymentTokens] = useState<PaymentToken[]>([])
  const [paymentToken, setPaymentToken] = useState<PaymentToken>(
    {} as PaymentToken
  )

  useEffect(() => {
    if (
      !symbols ||
      !paymentTokensData ||
      !erc20Data ||
      !priceFeedData ||
      !tokensWithBalances ||
      tokensWithBalances.length === 0
    ) {
      return
    }

    if (JSON.stringify(paymentTokens) !== JSON.stringify(tokensWithBalances)) {
      setPaymentTokens(tokensWithBalances)
      setPaymentToken(tokensWithBalances[0])
    }
  }, [
    symbols,
    paymentTokensData,
    erc20Data,
    priceFeedData,
    tokensWithBalances,
    paymentTokens
  ])

  return {
    paymentTokens,
    paymentToken,
    setPaymentToken,
    refetchBalanceQueries: [refetchNativeBalanceQuery, refetchErc20BalanceQuery]
  }
}
