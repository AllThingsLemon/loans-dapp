import { useState, useMemo, useEffect } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { erc20Abi } from 'viem'

import { PaymentToken } from './usePaymentTokens'
import { useWritePaymentsProcessPayment } from '../generated'
import { useToast } from './use-toast'
import { useChainAddress } from '@/src/hooks/useChainAddress'

export const usePaymentProcess = (
  isReady: boolean,
  token: PaymentToken,
  requiredAmount: bigint,
  orderId: string,
  usdAmount: bigint,
  receiverId: string,
  refetchQueriesAfterProcess: any[]
) => {
  const { toast } = useToast()

  const PAYMENTS_ADDRESS = useChainAddress('payments')
  const { address } = useAccount()

  isReady =
    isReady &&
    token &&
    token.address &&
    address != undefined &&
    PAYMENTS_ADDRESS != undefined

  const [isSettingAllowance, setIsSettingAllowance] = useState(false)
  const [isSettingProcess, setIsSettingProcess] = useState(false)

  const { data: allowanceForPay, refetch: refetchTokenAllowance } =
    useReadContract({
      address: isReady ? (token.address as `0x${string}`) : undefined,
      abi: erc20Abi,
      functionName: 'allowance',
      args: isReady ? [address!, PAYMENTS_ADDRESS] : undefined
    })

  const isTokenApproved = useMemo(() => {
    if (token && token.isNative) return true
    if (!token || !allowanceForPay || !requiredAmount) return false
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

  const approveButtonClicked = () => {
    try {
      setIsSettingAllowance(true)
      increaseAllowance({
        address: token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PAYMENTS_ADDRESS, requiredAmount]
      })
    } catch (error) {
      console.error('Error approving tokens:', error)
      throw error
    }
  }

  useEffect(() => {
    if (isTokenAllowanceSuccess) {
      refetchTokenAllowance()
    }
    setIsSettingAllowance(false)
  }, [isTokenAllowanceSuccess, refetchTokenAllowance])

  const { writeContractAsync: processPaymentAsync, data: processPaymentData } =
    useWritePaymentsProcessPayment()

  const { isLoading: isPaymentProcessing, isSuccess: isPaymentProcessSuccess } =
    useWaitForTransactionReceipt({
      hash: processPaymentData
    })

  const [processTxHash, setProcessTxHash] = useState<`0x${string}` | undefined>(
    undefined
  )

  const processButtonClicked = async () => {
    try {
      setIsSettingProcess(true)
      const tx = await processPaymentAsync({
        args: [
          BigInt(orderId),
          BigInt(usdAmount),
          BigInt(receiverId),
          token.symbol
        ],
        value: token.isNative ? requiredAmount : 0n
      })

      setProcessTxHash(tx)

      toast({
        title: 'Thank you!',
        description: 'Your payment has been successfully processed!',
        duration: 3000
      })
    } catch (error) {
      console.error('Error processing payments:', error)
      setProcessTxHash(undefined)
      throw error
    } finally {
      setIsSettingProcess(false)
    }
  }

  useEffect(() => {
    if (
      isPaymentProcessSuccess &&
      refetchQueriesAfterProcess &&
      refetchQueriesAfterProcess.length > 0
    ) {
      if (!token.isNative) {
        refetchTokenAllowance()
      }
      for (const refetchQuery of refetchQueriesAfterProcess) {
        refetchQuery()
      }
    }
  }, [
    isPaymentProcessSuccess,
    refetchQueriesAfterProcess,
    refetchTokenAllowance,
    token
  ])

  return {
    isTokenApproved,
    increaseAllowance,
    isApproveLoading: isSettingAllowance || isTokenAllowanceLoading,
    processButtonClicked,
    approveButtonClicked,
    isProcessLoading: isSettingProcess || isPaymentProcessing,
    processTxHash
  }
}
