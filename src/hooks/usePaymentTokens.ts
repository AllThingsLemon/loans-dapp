import { useState, useEffect } from "react"
import { Address } from "viem"
import { ethers } from 'ethers'
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract
} from 'wagmi'

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)']

export interface PaymentToken {
  symbol: string
  address: Address
  decimals: number
  balance: bigint
  isNative: boolean
}

const fetchBalances = async (
  address: `0x${string}`,
  setBalances: (balances: any) => void,
  tokenSymbolList: string[],
  tokenAddressList: string[]
) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)

    const balanceResult = await Promise.all([
      provider.getBalance(address),
      ...[tokenAddressList.map((tokenAddress) => new ethers.Contract(tokenAddress, ERC20_ABI, provider).balanceOf(address))]
    ])

    const balance: any = {
      native: balanceResult[0]
    }
    for (let i =0; i< tokenSymbolList.length;i++) {
      balance[
        tokenSymbolList[i]
      ] = balanceResult[i - 1];

    }


    setBalances(balance)
  } catch (error) {
    console.error('Error fetching balances:', error)
  }
}

export const usePaymentTokens = () => {
  const [
    paymentTokenSymbols,
    setPaymentTokenSymbols
] = useState<string[]>(['USDT'])
  const [
    paymentTokenAddresses,
    setPaymentTokenAddresses
  ] = useState<string[]>([
    '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
  ])
  const [
    paymentTokens,
    setPaymentTokens
  ] = useState<PaymentToken[]>([{
    symbol: 'tBNB',
  address: '0x',
  decimals: 16,
  balance: 0n,
  isNative: true
  }])
  const [
    paymentToken,
    setPaymentToken
  ] = useState<PaymentToken>({
    symbol: 'tBNB',
  address: '0x',
  decimals: 16,
  balance: 0n,
  isNative: true
  } as PaymentToken)

  // paymentToken: PaymentToken | null
  // setPaymentToken: (token: PaymentToken) => void

  // TODO: need real contract integration
  const { address } = useAccount()
  const [balances, setBalances] = useState()

    // Fetch balances
    useEffect(() => {
      if (address) {
        fetchBalances(address, setBalances, paymentTokenSymbols, paymentTokenAddresses)
      }
    }, [address, paymentTokenSymbols, paymentTokenAddresses])

    return {
      paymentTokens,
    // setPaymentTokens,
    paymentToken,
    setPaymentToken
    }

}