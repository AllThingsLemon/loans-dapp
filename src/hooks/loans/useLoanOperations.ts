import { useCallback } from 'react'
import { useAccount, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { DEFAULT_DECIMALS } from '@/src/constants'
import {
  useWriteLoansInitiateLoan,
  useWriteLoansMakeLoanPayment,
  useSimulateLoansInitiateLoan,
  useReadLoansOriginationFeeToken,
  useReadLoansCollateralTokenPrice,
  loansAddress,
  useWriteLoansWithdrawCollateral
} from '@/src/generated'
import { useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { erc20Abi } from 'viem'
import { useContractCall } from './useContractCall'
import { useContractTokenConfiguration } from '../useContractTokenConfiguration'
import { formatTokenAmount } from '../../utils/decimals'

export interface LoanRequest {
  loanAmount: bigint // wei (token decimals)
  duration: bigint // seconds
  ltv: bigint // percentage scaled by PRECISION (e.g., 50 * 1e8 = 50%)
}

// Calculate required collateral using contract formula: (loanAmount * collateralTokenPrice) / ltv
const calculateRequiredCollateral = (
  loanAmount: bigint,
  ltv: bigint,
  collateralTokenPrice: bigint
): bigint => {
  return (loanAmount * collateralTokenPrice) / ltv
}

export const useLoanOperations = (options?: {
  loanRequest?: LoanRequest
  selectedLtvOption?: { ltv: bigint; fee: bigint }
  onDataChange?: () => Promise<void>
}) => {
  const { loanRequest, selectedLtvOption, onDataChange } = options || {}
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  
  // Get native token decimals from chain config
  const nativeTokenDecimals = publicClient?.chain?.nativeCurrency?.decimals ?? DEFAULT_DECIMALS.NATIVE_TOKEN

  // Get loans contract address for current chain
  const loansContractAddress =
    loansAddress[chainId as keyof typeof loansAddress]

  // Get contract token and decimal configuration
  const {
      tokenConfig,
      isLoading: decimalsLoading,
      error: decimalsError
  } = useContractTokenConfiguration()

  // Get the fee token address from contract
  const { data: feeTokenAddress } = useReadLoansOriginationFeeToken()

  // Get the collateral token price from contract
  const { data: collateralTokenPrice } = useReadLoansCollateralTokenPrice()

  // Get user's LMLN balance
  const { data: userLmlnBalance } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!feeTokenAddress && !!address
    }
  })

  // Get loan token data from tokenConfig
  const loanTokenAddress = tokenConfig?.loanToken.address
  const loanTokenDecimals = tokenConfig?.loanToken.decimals

  // Get user's loan token balance
  const { data: userLoanTokenBalance, refetch: refetchBalance } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!loanTokenAddress && !!address
    }
  })

  // Get current token allowance for payments
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      address && loansContractAddress
        ? [address, loansContractAddress]
        : undefined,
    query: {
      enabled: !!loanTokenAddress && !!address && !!loansContractAddress
    }
  })

  // Contract write functions
  const { writeContractAsync: initiateLoan, isPending: isCreatingLoan } =
    useWriteLoansInitiateLoan({
      mutation: {
        retry: false, // Disable retries to prevent double MetaMask popups
      }
    })
  const { writeContractAsync: makeLoanPayment, isPending: isPayingLoan } =
    useWriteLoansMakeLoanPayment({
      mutation: {
        retry: false, // Disable retries to prevent double MetaMask popups
      }
    })
  const { writeContractAsync: approveToken, isPending: isApprovingToken } =
    useWriteContract({
      mutation: {
        retry: false, // Disable retries to prevent double MetaMask popups
      }
    })
  const { writeContractAsync: withdrawCollateral, isPending: isWithdrawingCollateral } =
    useWriteLoansWithdrawCollateral({
      mutation: {
        retry: false, // Disable retries to prevent double MetaMask popups
      }
    })

  // Check if user has sufficient LMLN for origination fee
  const hasInsufficientLmln =
    selectedLtvOption && userLmlnBalance !== undefined
      ? userLmlnBalance < selectedLtvOption.fee
      : false

  // Calculate required collateral for simulation
  const requiredCollateralValue =
    loanRequest && collateralTokenPrice
      ? calculateRequiredCollateral(
          loanRequest.loanAmount,
          loanRequest.ltv,
          collateralTokenPrice
        )
      : undefined

  // Simulate the loan creation to get required collateral
  const {
    data: simulationData,
    isLoading: isSimulating,
    error: simulationError
  } = useSimulateLoansInitiateLoan({
    args: loanRequest
      ? [loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv]
      : undefined,
    value: requiredCollateralValue,
    query: {
      enabled: !!loanRequest && !!address && !hasInsufficientLmln && !!requiredCollateralValue
    }
  })


  // Contract call wrapper with error handling and cache invalidation
  const {
    executeCall,
    isLoading: isExecuting,
    error: executionError
  } = useContractCall({
    invalidateQueries: true
  })

  const createLoan = useCallback(
    async (loanRequest: LoanRequest) => {
      if (!address) throw new Error('Wallet not connected')
      if (!simulationData?.request)
        throw new Error('Transaction simulation failed')

      const result = await executeCall(async () => {
        // Use the simulated transaction parameters including the required msg.value
        const txHash = await initiateLoan(simulationData.request)

        // Wait for transaction to be confirmed on blockchain
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash })
        }

        return txHash
      }, address)

      // If loan creation was successful, trigger data refresh
      if (result && onDataChange) {
        await onDataChange()
      }

      return result
    },
    [address, initiateLoan, executeCall, simulationData, onDataChange]
  )

  // Function to approve token allowance if needed
  const approveTokenAllowance = useCallback(
    async (amount: bigint) => {
      if (!address || !loanTokenAddress || !loansContractAddress) {
        throw new Error('Missing required data for token approval')
      }

      const result = await executeCall(async () => {
        const txHash = await approveToken({
          address: loanTokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [loansContractAddress, amount]
        })
        
        // Wait for transaction to be mined
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash })
        }

        return txHash
      }, address)

      // After transaction is confirmed, refetch the allowance
      if (result) {
        await refetchAllowance()
      }

      return result
    },
    [address, loanTokenAddress, loansContractAddress, approveToken, executeCall, refetchAllowance, publicClient]
  )

  const payLoan = useCallback(
    async (loanId: `0x${string}`, amount: bigint) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      if (!loanTokenAddress) {
        throw new Error('Loan token address not found')
      }

      if (!loansContractAddress) {
        throw new Error('Loans contract address not found')
      }

      // Check if user has sufficient loan token balance
      if (userLoanTokenBalance && userLoanTokenBalance < amount) {
        throw new Error(`Insufficient loan token balance`)
      }

      // Check if we need to approve tokens first
      if (!currentAllowance || currentAllowance < amount) {
        try {
          // First approve the tokens
          await approveTokenAllowance(amount)
        } catch (error) {
          // Re-throw the error to be handled by the calling component
          throw error
        }
      }

      const result = await executeCall(async () => {
        const tx = await makeLoanPayment({
          args: [loanId, amount]
        })

        return tx
      }, address)

      // If payment was successful, trigger data refresh
      if (result && onDataChange) {
        await onDataChange()
      }

      return result
    },
    [
      address,
      makeLoanPayment,
      executeCall,
      loanTokenAddress,
      loansContractAddress,
      userLoanTokenBalance,
      currentAllowance,
      approveTokenAllowance,
      onDataChange
    ]
  )

  const pullCollateral = useCallback(
    async (loanId: `0x${string}`) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      const result = await executeCall(async () => {
        const tx = await withdrawCollateral({
          args: [loanId]
        })
        return tx
      }, address)

      // If withdrawal was successful, trigger data refresh
      if (result && onDataChange) {
        await onDataChange()
      }

      return result
    },
    [address]
  )
  return {
    // Operations
    createLoan,
    payLoan,
    pullCollateral,
    approveTokenAllowance,
    
    // Transaction states
    isTransacting:
      isCreatingLoan || isPayingLoan || isExecuting || isApprovingToken,
    isSimulating: isSimulating || decimalsLoading,
    
    // Loan creation data
    requiredCollateral: simulationData?.request?.value,
    hasInsufficientLmln,
    
    // Contract addresses
    loansContractAddress,
    
    // User balances
    userLmlnBalance,
    userLoanTokenBalance,
    currentAllowance,
    
    // Error state
    error: executionError || simulationError || decimalsError
  }
}
