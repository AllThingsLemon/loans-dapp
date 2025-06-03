import { useState, useCallback, useMemo } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { zeroAddress, erc20Abi, parseUnits } from 'viem'
import { PaymentToken } from './usePaymentTokens'
import { useWritePaymentsProcessPayment } from '../generated'
import { useToast } from './use-toast'

export const usePaymentProcess = (
  isReady: boolean,
  token: PaymentToken,
  requiredAmount: bigint,
  orderId: string,
  usdAmount: string,
  receiverId: string
) => {
  const { toast } = useToast()

  const PAYMENTS_ADDRESS = zeroAddress as `0x${string}` // TODO: replace with proper payments contract
  const { address } = useAccount()

  isReady = isReady && token && token.address && address != undefined

  const [isSettingAllowance, setIsSettingAllowance] = useState(false)

  const { data: allowanceForPay, refetch: refetchTokenAllowance } =
    useReadContract({
      address: isReady ? (token.address as `0x${string}`) : undefined,
      abi: erc20Abi,
      functionName: 'allowance',
      args: isReady ? [address!, PAYMENTS_ADDRESS] : undefined
    })

  const isTokenApproved = useMemo(() => {
    if (token.isNative) return true
    if (!allowanceForPay || !requiredAmount) return false
    return allowanceForPay >= requiredAmount
  }, [allowanceForPay, token, requiredAmount])

  const { writeContract: increaseAllowance, data: allowanceHash } =
    useWriteContract()
  const {
    isLoading: isTokenAllowanceLoading,
    isSuccess: isTokenAllowanceSuccess
  } = useWaitForTransactionReceipt({
    hash: allowanceHash
  })

  const approveTokens = useCallback(async () => {
    if (!address || !requiredAmount || !token.address || !token.decimals) {
      throw new Error('Missing required data for approval')
    }
    try {
      setIsSettingAllowance(true)
      await increaseAllowance({
        address: token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [
          PAYMENTS_ADDRESS,
          parseUnits(BigInt(requiredAmount).toString(), token.decimals)
        ]
      })
      refetchTokenAllowance()
    } catch (error) {
      console.error('Error approving tokens:', error)
      throw error
    } finally {
      setIsSettingAllowance(false)
    }
  }, [
    token,
    increaseAllowance,
    requiredAmount,
    address,
    refetchTokenAllowance,
    PAYMENTS_ADDRESS
  ])

  const { writeContractAsync: processPaymentAsync, data: collectData } =
    useWritePaymentsProcessPayment()

  const { isLoading: isProcessing, isSuccess: isProcessSuccess } =
    useWaitForTransactionReceipt({
      hash: collectData as `0x${string}`
    })

  const processPayment = useCallback(async () => {
    try {
      await processPaymentAsync({
        args: [
          BigInt(orderId),
          BigInt(usdAmount),
          BigInt(receiverId),
          token.symbol
        ],
        address: PAYMENTS_ADDRESS as `0x${string}`
      })

      toast({
        title: 'Thank you!',
        description: 'Your payment has been successfully processed!',
        duration: 3000
      })
    } catch (error) {
      console.error('Error processing payments:', error)
      throw error
    }
  }, [
    token,
    processPaymentAsync,
    orderId,
    usdAmount,
    receiverId,
    PAYMENTS_ADDRESS,
    toast
  ])

  return {
    isTokenApproved,
    approveTokens,
    isSettingAllowance,
    isApproveLoading: isSettingAllowance || isTokenAllowanceLoading,
    processPayment,
    isProcessLoading: isProcessing
  }
}
