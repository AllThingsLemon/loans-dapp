import { useCallback } from 'react'
import { useAccount, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { DEFAULT_DECIMALS } from '@/src/constants'
import {
  useWriteLoansInitiateLoan,
  useWriteLoansMakeLoanPayment,
  useSimulateLoansInitiateLoan,
  useReadLoansOriginationFeeToken,
  useReadLoansLoanToken,
  useReadLoansCollateralTokenPrice,
  loansAddress
} from '@/src/generated'
import { useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { erc20Abi } from 'viem'
import { useContractCall } from './useContractCall'
import { useContractDecimals } from '../useContractDecimals'
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

  // Get contract decimal configuration
  const {
    decimals,
    isLoading: decimalsLoading,
    error: decimalsError
  } = useContractDecimals()

  // Get the fee token address from contract
  const { data: feeTokenAddress } = useReadLoansOriginationFeeToken()

  // Get the loan token address from contract
  const { data: loanTokenAddress } = useReadLoansLoanToken()

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

  // Get loan token details (symbol, decimals, etc.)
  const { data: loanTokenSymbol } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    args: [],
    query: {
      enabled: !!loanTokenAddress
    }
  })

  const { data: loanTokenDecimals } = useReadContract({
    address: loanTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    args: [],
    query: {
      enabled: !!loanTokenAddress
    }
  })

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
    useWriteLoansInitiateLoan()
  const { writeContractAsync: makeLoanPayment, isPending: isPayingLoan } =
    useWriteLoansMakeLoanPayment()
  const { writeContractAsync: approveToken, isPending: isApprovingToken } =
    useWriteContract()

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

  // Debug logging for simulation
  console.log('=== useLoanOperations Debug ===')
  console.log('loanRequest:', loanRequest)
  console.log('selectedLtvOption:', selectedLtvOption)
  console.log('address:', address)
  console.log('feeTokenAddress:', feeTokenAddress)
  console.log('userLmlnBalance (wei):', userLmlnBalance?.toString())
  console.log(
    'userLmlnBalance (formatted):',
    userLmlnBalance && decimals
      ? formatTokenAmount(userLmlnBalance, decimals.feeTokenDecimals)
      : '0'
  )
  console.log('collateralTokenPrice:', collateralTokenPrice?.toString())
  console.log('requiredFee (wei):', selectedLtvOption?.fee.toString())
  console.log(
    'requiredFee (formatted):',
    selectedLtvOption?.fee && decimals
      ? formatTokenAmount(selectedLtvOption.fee, decimals.feeTokenDecimals)
      : '0'
  )
  console.log('hasInsufficientLmln:', hasInsufficientLmln)
  console.log(
    'calculatedCollateral (wei):',
    requiredCollateralValue?.toString()
  )
  console.log(
    'calculatedCollateral (LEMX):',
    requiredCollateralValue
      ? formatTokenAmount(requiredCollateralValue, nativeTokenDecimals)
      : '0'
  )
  console.log('isSimulating:', isSimulating)
  console.log('simulationData:', simulationData)
  console.log('simulationError:', simulationError)
  console.log(
    'simulationCollateral (wei):',
    simulationData?.request?.value?.toString()
  )
  console.log(
    'simulationCollateral (LEMX):',
    simulationData?.request?.value
      ? formatTokenAmount(simulationData.request.value, nativeTokenDecimals)
      : '0'
  )
  console.log('=== COLLATERAL COMPARISON ===')
  console.log('Our calculated collateral (wei):', requiredCollateralValue?.toString())
  console.log('Contract simulation collateral (wei):', simulationData?.request?.value?.toString())
  console.log('Our calculated (LEMX):', requiredCollateralValue ? formatTokenAmount(requiredCollateralValue, nativeTokenDecimals) : '0')
  console.log('Contract simulation (LEMX):', simulationData?.request?.value ? formatTokenAmount(simulationData.request.value, nativeTokenDecimals) : '0')
  console.log('===============================')

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
        console.log('=== Creating Loan Debug ===')
        console.log('simulationData.request:', simulationData.request)
        console.log('args:', simulationData.request.args)
        console.log(
          'value (collateral):',
          simulationData.request.value?.toString()
        )
        console.log('==========================')

        // Use the simulated transaction parameters including the required msg.value
        const txHash = await initiateLoan(simulationData.request)

        console.log('=== Transaction Submitted ===')
        console.log('tx hash:', txHash)
        console.log('=============================')

        // Wait for transaction to be confirmed on blockchain
        if (publicClient) {
          console.log('Waiting for transaction confirmation...')
          await publicClient.waitForTransactionReceipt({ hash: txHash })
          console.log('Loan creation confirmed on blockchain')
        }

        return txHash
      }, address)

      // If loan creation was successful, trigger data refresh
      if (result && onDataChange) {
        console.log('Loan creation successful, triggering data refresh...')
        await onDataChange()
        console.log('Data refresh complete')
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

      console.log('=== Token Approval ===')
      console.log('loanTokenAddress:', loanTokenAddress)
      console.log('loansContractAddress:', loansContractAddress)
      console.log('amount to approve:', amount.toString())

      const result = await executeCall(async () => {
        const txHash = await approveToken({
          address: loanTokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [loansContractAddress, amount]
        })

        console.log('Token approval tx sent:', txHash)
        
        // Wait for transaction to be mined
        if (publicClient) {
          console.log('Waiting for transaction confirmation...')
          await publicClient.waitForTransactionReceipt({ hash: txHash })
          console.log('Transaction confirmed on blockchain')
        }

        return txHash
      }, address)

      // After transaction is confirmed, refetch the allowance
      if (result) {
        console.log('Approval confirmed, refetching allowance...')
        await refetchAllowance()
        console.log('Allowance refetch complete')
      }

      return result
    },
    [address, loanTokenAddress, loansContractAddress, approveToken, executeCall, refetchAllowance, publicClient]
  )

  const payLoan = useCallback(
    async (loanId: `0x${string}`, amount: bigint) => {
      console.log('=== useLoanOperations payLoan Debug ===')
      console.log('address:', address)
      console.log('loanId:', loanId)
      console.log('amount:', amount.toString())
      console.log('userLoanTokenBalance:', userLoanTokenBalance?.toString())
      console.log('currentAllowance:', currentAllowance?.toString())
      console.log('loanTokenAddress:', loanTokenAddress)
      console.log('loansContractAddress:', loansContractAddress)

      if (!address) {
        console.error('Wallet not connected!')
        throw new Error('Wallet not connected')
      }

      if (!loanTokenAddress) {
        console.error('Loan token address not found!')
        throw new Error('Loan token address not found')
      }

      if (!loansContractAddress) {
        console.error('Loans contract address not found!')
        throw new Error('Loans contract address not found')
      }

      // Check if user has sufficient loan token balance
      if (userLoanTokenBalance && userLoanTokenBalance < amount) {
        const errorMsg = `Insufficient loan token balance. Have: ${userLoanTokenBalance.toString()}, Need: ${amount.toString()}`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }

      // Check if we need to approve tokens first
      if (!currentAllowance || currentAllowance < amount) {
        console.log('Insufficient allowance, need to approve tokens first')
        console.log(
          `Current allowance: ${currentAllowance?.toString() || '0'}, Need: ${amount.toString()}`
        )

        try {
          // First approve the tokens
          console.log('Calling approveTokenAllowance...')
          await approveTokenAllowance(amount)
          console.log(
            'Token approval completed, now proceeding with payment...'
          )
        } catch (error) {
          console.error('Token approval failed in payLoan:', error)
          // Re-throw the error to be handled by the calling component
          throw error
        }
      } else {
        console.log(
          'Sufficient allowance exists, proceeding with payment directly'
        )
      }

      console.log('Calling executeCall with makeLoanPayment...')
      const result = await executeCall(async () => {
        console.log('Inside executeCall - about to call makeLoanPayment')
        console.log('makeLoanPayment args:', [loanId, amount])

        try {
          const tx = await makeLoanPayment({
            args: [loanId, amount]
          })

          console.log('makeLoanPayment successful, tx:', tx)
          return tx
        } catch (error) {
          console.error('makeLoanPayment failed:', error)
          throw error
        }
      }, address)

      // If payment was successful, trigger data refresh
      if (result && onDataChange) {
        console.log('Payment successful, triggering data refresh...')
        await onDataChange()
        console.log('Data refresh complete')
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

  return {
    createLoan,
    payLoan,
    approveTokenAllowance,
    isTransacting:
      isCreatingLoan || isPayingLoan || isExecuting || isApprovingToken,
    isSimulating: isSimulating || decimalsLoading,
    requiredCollateral: simulationData?.request?.value,
    userLmlnBalance,
    userLoanTokenBalance,
    currentAllowance,
    loanTokenAddress,
    loanTokenSymbol,
    loanTokenDecimals,
    loansContractAddress,
    hasInsufficientLmln,
    error: executionError || simulationError || decimalsError
  }
}
