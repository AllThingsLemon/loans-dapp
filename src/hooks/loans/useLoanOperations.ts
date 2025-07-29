import { useCallback } from 'react'
import { useAccount, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { DEFAULT_DECIMALS } from '@/src/constants'
import {
  useWriteLoansInitiateLoan,
  useWriteLoansMakeLoanPayment,
  useReadLoansOriginationFeeToken,
  useReadLoansCollateralTokenPrice,
  useReadLoansCalculateLoanDetails,
  loansAddress,
  useWriteLoansWithdrawCollateral
} from '@/src/generated'
import { useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { config } from '@/src/config/wagmi'
import { erc20Abi } from 'viem'
import { useContractTokenConfiguration } from '../useContractTokenConfiguration'
import { loanKeys } from '../query/loanQueries'

export interface LoanRequest {
  loanAmount: bigint // wei (token decimals)
  duration: bigint // seconds
  ltv: bigint // percentage scaled by PRECISION (e.g., 50 * 1e8 = 50%)
}

export interface UseLoanOperationsOptions {
  loanRequest?: LoanRequest
  selectedLtvOption?: { ltv: bigint; fee: bigint }
}

export interface UseLoanOperationsReturn {
  // Operations
  createLoan: (loanRequest: LoanRequest) => Promise<`0x${string}` | undefined>
  approveLoanFee: () => Promise<`0x${string}` | undefined>
  payLoan: (loanId: `0x${string}`, amount: bigint) => Promise<`0x${string}` | undefined>
  pullCollateral: (loanId: `0x${string}`) => Promise<`0x${string}` | undefined>
  approveTokenAllowance: (amount: bigint) => Promise<`0x${string}` | undefined>
  
  // Transaction states
  isTransacting: boolean
  isSimulating: boolean
  
  // Loan creation data
  requiredCollateral: bigint | undefined
  hasInsufficientLmln: boolean
  calculationData: {
    interestAmount: bigint | undefined
    interestApr: bigint | undefined
    originationFee: bigint | undefined
    collateralAmount: bigint | undefined
    loanCycleDuration: bigint | undefined
    firstLoanPayment: bigint | undefined
  } | undefined
  
  // Contract addresses
  loansContractAddress: `0x${string}` | undefined
  
  // User balances
  userLmlnBalance: bigint | undefined
  userLoanTokenBalance: bigint | undefined
  currentAllowance: bigint | undefined
  currentLmlnAllowance: bigint | undefined
  
  // Error state  
  error: Error | null
}

// No longer needed - calculateLoanDetails provides this

export const useLoanOperations = (options?: UseLoanOperationsOptions): UseLoanOperationsReturn => {
  const { loanRequest, selectedLtvOption } = options || {}
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  
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

  // Get current LMLN token allowance for origination fees
  const { data: currentLmlnAllowance, refetch: refetchLmlnAllowance } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      address && loansContractAddress
        ? [address, loansContractAddress]
        : undefined,
    query: {
      enabled: !!feeTokenAddress && !!address && !!loansContractAddress
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

  // Calculate loan details using the view function (no token interactions)
  const {
    data: calculationData,
    isLoading: isCalculating,
    error: calculationError
  } = useReadLoansCalculateLoanDetails({
    args: loanRequest
      ? [loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv]
      : undefined,
    query: {
      enabled: !!loanRequest
    }
  })

  // Extract calculation results
  const [
    interestAmount,
    interestApr,
    originationFee,
    collateralAmount,
    loanCycleDuration,
    firstLoanPayment
  ] = calculationData || []




  // Function to approve LMLN tokens for loan creation
  const approveLoanFee = useCallback(
    async () => {
      if (!address) throw new Error('Wallet not connected')
      if (!originationFee) throw new Error('Origination fee not calculated')
      if (!feeTokenAddress || !loansContractAddress) {
        throw new Error('Missing token addresses for approval')
      }

      // Approve LMLN tokens for origination fee
      const approvalTxHash = await approveToken({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [loansContractAddress, originationFee]
      })

      // Wait for approval transaction to be confirmed
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approvalTxHash })
      }

      // Refetch allowance after approval
      await refetchLmlnAllowance()

      return approvalTxHash
    },
    [address, originationFee, feeTokenAddress, loansContractAddress, approveToken, publicClient, refetchLmlnAllowance]
  )

  const createLoan = useCallback(
    async (loanRequest: LoanRequest) => {
      if (!address) throw new Error('Wallet not connected')
      if (!collateralAmount) throw new Error('Collateral amount not calculated')
      if (!originationFee) throw new Error('Origination fee not calculated')
      
      // Check if we have sufficient allowance (approval should be done before calling this)
      if (currentLmlnAllowance === undefined || currentLmlnAllowance < originationFee) {
        throw new Error('Insufficient LMLN allowance. Please approve first.')
      }

      // Execute the transaction directly with calculated parameters
      const txHash = await initiateLoan({
        args: [loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv],
        value: collateralAmount
      })

      // Wait for transaction to be confirmed on blockchain
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      // If loan creation was successful, invalidate queries
      if (txHash && address) {
        // Comprehensive invalidation to ensure UI updates immediately
        await Promise.all([
          // Invalidate wagmi-generated queries for account loan IDs
          queryClient.invalidateQueries({
            predicate: (query) => {
              const key = query.queryKey
              return Array.isArray(key) &&
                     key.some(part =>
                       typeof part === 'object' &&
                       part !== null &&
                       'args' in part &&
                       Array.isArray(part.args) &&
                       part.args[0] === address
                     )
            }
          }),
          
          // Invalidate custom loan queries
          queryClient.invalidateQueries({ 
            queryKey: loanKeys.all 
          }),
          
          // Invalidate individual loan detail queries
          queryClient.invalidateQueries({ 
            predicate: (query) => 
              Array.isArray(query.queryKey) && 
              query.queryKey[0] === 'loan'
          }),
          
          // Broad invalidation as fallback
          queryClient.invalidateQueries()
        ])
      }

      return txHash
    },
    [address, initiateLoan, collateralAmount, originationFee, currentLmlnAllowance, feeTokenAddress, loansContractAddress, approveToken, publicClient, refetchLmlnAllowance, queryClient]
  )

  // Function to approve token allowance if needed
  const approveTokenAllowance = useCallback(
    async (amount: bigint) => {
      if (!address || !loanTokenAddress || !loansContractAddress) {
        throw new Error('Missing required data for token approval')
      }

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

      // After transaction is confirmed, refetch the allowance
      await refetchAllowance()

      return txHash
    },
    [address, loanTokenAddress, loansContractAddress, approveToken, refetchAllowance, publicClient]
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

      const txHash = await makeLoanPayment({
        args: [loanId, amount]
      })

      // Wait for transaction to be confirmed
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      // If payment was successful, invalidate queries
      if (txHash && address) {
        await Promise.all([
          // Invalidate wagmi-generated queries
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey
              return Array.isArray(key) && 
                     key.some(part => 
                       typeof part === 'object' && 
                       part !== null && 
                       'args' in part && 
                       Array.isArray(part.args) && 
                       part.args[0] === address
                     )
            }
          }),
          queryClient.invalidateQueries({ queryKey: loanKeys.all }),
          queryClient.invalidateQueries({ 
            predicate: (query) => 
              Array.isArray(query.queryKey) && 
              query.queryKey[0] === 'loan'
          }),
          queryClient.invalidateQueries()
        ])
      }

      return txHash
    },
    [
      address,
      makeLoanPayment,
      loanTokenAddress,
      loansContractAddress,
      userLoanTokenBalance,
      currentAllowance,
      approveTokenAllowance,
      publicClient,
      queryClient
    ]
  )

  const pullCollateral = useCallback(
    async (loanId: `0x${string}`) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      const txHash = await withdrawCollateral({
        args: [loanId]
      })

      // Wait for transaction to be confirmed
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      // If withdrawal was successful, invalidate queries
      if (txHash && address) {
        await Promise.all([
          // Invalidate wagmi-generated queries
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey
              return Array.isArray(key) && 
                     key.some(part => 
                       typeof part === 'object' && 
                       part !== null && 
                       'args' in part && 
                       Array.isArray(part.args) && 
                       part.args[0] === address
                     )
            }
          }),
          queryClient.invalidateQueries({ queryKey: loanKeys.all }),
          queryClient.invalidateQueries({ 
            predicate: (query) => 
              Array.isArray(query.queryKey) && 
              query.queryKey[0] === 'loan'
          }),
          queryClient.invalidateQueries()
        ])
      }

      return txHash
    },
    [address, withdrawCollateral, publicClient, queryClient]
  )
  return {
    // Operations
    createLoan,
    approveLoanFee,
    payLoan,
    pullCollateral,
    approveTokenAllowance,
    
    // Transaction states
    isTransacting:
      isCreatingLoan || isPayingLoan || isWithdrawingCollateral || isApprovingToken,
    isSimulating: isCalculating || decimalsLoading,
    
    // Loan creation data
    requiredCollateral: collateralAmount,
    hasInsufficientLmln,
    calculationData: calculationData ? {
      interestAmount,
      interestApr,
      originationFee,
      collateralAmount,
      loanCycleDuration,
      firstLoanPayment
    } : undefined,
    
    // Contract addresses
    loansContractAddress,
    
    // User balances
    userLmlnBalance,
    userLoanTokenBalance,
    currentAllowance,
    currentLmlnAllowance,
    
    // Error state  
    error: calculationError || decimalsError
  }
}
