import { useEffect, useState } from 'react'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { Address, zeroAddress, erc20Abi, Abi } from 'viem'
import {
  useReadPaymentsGetAllPaymentTokenSymbols,
  useReadPaymentsPaymentIds
} from '../generated'

import { useChainAddress } from '@/src/hooks/useChainAddress'
import ChainlinkFeed from '@/src/abis/ChainlinkFeed.json'
import PaymentsAbi from '@/src/abis/Payments.json'

export interface PaymentToken {
  symbol: string
  address: Address
  priceFeed: Address
  isNative: boolean

  price: string
  priceDecimals: number

  tokenDecimals: number
  tokenBalance: string
}

export const usePaymentTokens = (parsedUSDAmount: bigint, orderId: bigint) => {
  const { address } = useAccount()

  const { data: nativeBalanceData, refetch: refetchNativeBalanceQuery } =
    useBalance({ address })
  const { data: paymentId, refetch: refetchPaymentId } =
    useReadPaymentsPaymentIds({
      args: [orderId]
    })
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
        isNative,

        tokenDecimals: 18,
        tokenBalance: '0',

        priceDecimals: 18,
        price: '0'
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

  const priceFeedContracts = baseTokens.flatMap((token) => [
    {
      address: token.priceFeed,
      abi: ChainlinkFeed as Abi,
      functionName: 'latestAnswer'
    },
    {
      address: token.priceFeed,
      abi: ChainlinkFeed as Abi,
      functionName: 'decimals'
    }
  ])

  const { data: priceFeedData } = useReadContracts({
    contracts: priceFeedContracts,
    query: {
      enabled: !!address && baseTokens.length > 0
    }
  })

  // Merge balance/decimals into baseTokens
  let tokenIndex = 0
  const tokensWithBalances: PaymentToken[] = baseTokens.map((token, i) => {
    const price = priceFeedData?.[tokenIndex * 2]?.result?.toString() ?? '0'
    const priceDecimals =
      Number(priceFeedData?.[tokenIndex * 2 + 1]?.result) ?? 18

    let tokenDecimals = 18
    let tokenBalance = '0'

    if (token.isNative) {
      tokenDecimals = nativeBalanceData?.decimals ?? 18
      tokenBalance = nativeBalanceData?.value?.toString() ?? '0'
    } else {
      tokenDecimals =
        Number(erc20Data?.[tokenIndex * 2]?.result as number) ?? 18
      tokenBalance = erc20Data?.[tokenIndex * 2 + 1]?.result?.toString() ?? '0'
    }

    tokenIndex++

    return {
      ...token,
      tokenDecimals,
      tokenBalance,
      priceDecimals,
      price
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

  const priceDecimals = (paymentToken?.priceDecimals as number) ?? 18
  const tokenDecimals = (paymentToken?.tokenDecimals as number) ?? 18

  const consumingTokenAmounts =
    (BigInt(paymentToken?.price || '0') * parsedUSDAmount) /
    BigInt(10 ** (18 + priceDecimals - tokenDecimals))

  return {
    paymentId,
    paymentTokens,
    paymentToken,
    setPaymentToken,
    consumingTokenAmounts,
    refetchQueriesAfterProcess: [
      refetchNativeBalanceQuery,
      refetchErc20BalanceQuery,
      refetchPaymentId
    ]
  }
}
