import { useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { LOAN_STATUS } from '@/src/constants'
import {
  useWriteLoansInitiateLoan,
  useWriteLoansMakeLoanPayment,
  useReadLoansOriginationFeeToken,
  useReadLoansCalculateLoanDetails,
  useReadLoansGetLiquidityStatus,
  useReadLoansInitiateLoanFeeUsd,
  useReadLoansLoanPaymentFeeUsd,
  useReadLoansGetNativeFee,
  loansAddress,
  loansAbi,
  useWriteLoansWithdrawCollateral,
  useWriteLoansExtendLoan,
  readLoansLoanStatus,
  collateralManagerAddress
} from '@/src/generated'
import { useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { config } from '@/src/config/wagmi'
import { erc20Abi } from 'viem'
import { useContractTokenConfiguration } from '../useContractTokenConfiguration'
import { loanKeys } from '../query/loanQueries'

export interface LoanRequest {
  collateralToken: `0x${string}` // ERC20 collateral token address
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
  approveLoanFee: (feeAmount?: bigint) => Promise<`0x${string}` | undefined>
  approveCollateral: (collateralToken: `0x${string}`, collateralAmount: bigint) => Promise<`0x${string}` | undefined>
  payLoan: (
    loanId: `0x${string}`,
    amount: bigint
  ) => Promise<`0x${string}` | undefined>
  pullCollateral: (loanId: `0x${string}`) => Promise<`0x${string}` | undefined>
  approveTokenAllowance: (amount: bigint) => Promise<`0x${string}` | undefined>
  extendLoan: (
    loanId: `0x${string}`,
    extendTime: bigint
  ) => Promise<`0x${string}` | undefined>

  // Transaction states
  isTransacting: boolean
  isSimulating: boolean

  // Loan creation data
  requiredCollateral: bigint | undefined
  hasInsufficientLmln: boolean
  grossOriginationFee: bigint | undefined
  calculationData:
    | {
        interestAmount: bigint | undefined
        interestApr: bigint | undefined
        originationFee: bigint | undefined
        collateralAmount: bigint | undefined
        loanCycleDuration: bigint | undefined
        firstLoanPayment: bigint | undefined
      }
    | undefined

  // Contract addresses
  loansContractAddress: `0x${string}` | undefined

  // User balances
  userLmlnBalance: bigint | undefined
  userLoanTokenBalance: bigint | undefined
  currentAllowance: bigint | undefined
  currentLmlnAllowance: bigint | undefined
  currentCollateralAllowance: bigint | undefined

  // Liquidity
  availableLiquidity: bigint | undefined
  hasInsufficientLiquidity: boolean

  // Error state
  error: Error | null
}

// No longer needed - calculateLoanDetails provides this

export const useLoanOperations = (
  options?: UseLoanOperationsOptions
): UseLoanOperationsReturn => {
  const { loanRequest, selectedLtvOption } = options || {}
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // Get loans contract address for current chain
  const loansContractAddress =
    loansAddress[chainId as keyof typeof loansAddress]

  // Get collateral manager address for current chain
  const cmAddress =
    collateralManagerAddress[chainId as keyof typeof collateralManagerAddress]

  // Get contract token and decimal configuration
  const {
    tokenConfig,
    isLoading: decimalsLoading,
    error: decimalsError
  } = useContractTokenConfiguration()

  // Get the fee token address from contract
  const { data: feeTokenAddress } = useReadLoansOriginationFeeToken()

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
  const { data: userLoanTokenBalance, refetch: refetchBalance } =
    useReadContract({
      address: loanTokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      query: {
        enabled: !!loanTokenAddress && !!address
      }
    })

  // Get current token allowance for payments
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
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
    }
  )

  // Get current LMLN token allowance for origination fees
  const { data: currentLmlnAllowance, refetch: refetchLmlnAllowance } =
    useReadContract({
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

  // LMLN token charges a transfer fee. Selector 0x9d11aaaa returns 10.
  // The value is in basis points (BPS), denominator = 10000, so 10 BPS = 0.1%.
  // approveLoanFee adds a 10% buffer on top of origFee so the transferFrom always succeeds
  // even with minor LMLN price movement between approval and loan creation.
  const LMLN_FEE_DENOMINATOR = 10000n
  const LMLN_FEE_RATE_FALLBACK = 10n // 10 BPS = 0.1%
  const LMLN_FEE_RATE_SELECTOR = '0x9d11aaaa' as `0x${string}`

  // Get current collateral token allowance for CollateralManager
  const { data: currentCollateralAllowance, refetch: refetchCollateralAllowance } =
    useReadContract({
      address: loanRequest?.collateralToken,
      abi: erc20Abi,
      functionName: 'allowance',
      args: address && cmAddress ? [address, cmAddress] : undefined,
      query: {
        enabled: !!loanRequest?.collateralToken && !!address && !!cmAddress
      }
    })

  // Get available liquidity from the Loans contract
  const { data: liquidityStatusRaw } = useReadLoansGetLiquidityStatus()
  const availableLiquidity = liquidityStatusRaw
    ? (liquidityStatusRaw as readonly bigint[])[4] // principalAvailable is index 4
    : undefined

  // Check if requested loan amount exceeds available liquidity
  const hasInsufficientLiquidity =
    loanRequest && availableLiquidity !== undefined
      ? loanRequest.loanAmount > availableLiquidity
      : false

  // Contract write functions
  const { writeContractAsync: initiateLoan, isPending: isCreatingLoan } =
    useWriteLoansInitiateLoan({
      mutation: {
        retry: false // Disable retries to prevent double MetaMask popups
      }
    })
  const { writeContractAsync: makeLoanPayment, isPending: isPayingLoan } =
    useWriteLoansMakeLoanPayment({
      mutation: {
        retry: false // Disable retries to prevent double MetaMask popups
      }
    })
  const { writeContractAsync: approveToken, isPending: isApprovingToken } =
    useWriteContract({
      mutation: {
        retry: false // Disable retries to prevent double MetaMask popups
      }
    })
  const {
    writeContractAsync: withdrawCollateral,
    isPending: isWithdrawingCollateral
  } = useWriteLoansWithdrawCollateral({
    mutation: {
      retry: false // Disable retries to prevent double MetaMask popups
    }
  })
  const { writeContractAsync: extendLoanContract, isPending: isExtendingLoan } =
    useWriteLoansExtendLoan({
      mutation: {
        retry: false // Disable retries to prevent double MetaMask popups
      }
    })

  // Native fees for payable functions
  const { data: initiateLoanFeeUSD } = useReadLoansInitiateLoanFeeUsd()
  const { data: loanPaymentFeeUSD } = useReadLoansLoanPaymentFeeUsd()
  // @ts-ignore - wagmi deep type instantiation
  const { data: initiateNativeFee } = useReadLoansGetNativeFee({
    args: initiateLoanFeeUSD !== undefined ? [initiateLoanFeeUSD] : undefined,
    query: { enabled: initiateLoanFeeUSD !== undefined && initiateLoanFeeUSD > 0n, refetchInterval: 30000 },
  })
  // @ts-ignore - wagmi deep type instantiation
  const { data: paymentNativeFee } = useReadLoansGetNativeFee({
    args: loanPaymentFeeUSD !== undefined ? [loanPaymentFeeUSD] : undefined,
    query: { enabled: loanPaymentFeeUSD !== undefined && loanPaymentFeeUSD > 0n, refetchInterval: 30000 },
  })

  // Calculate loan details using the view function (no token interactions)
  const {
    data: calculationData,
    isLoading: isCalculating,
    error: calculationError,
    failureCount,
    failureReason,
    status
  } = useReadLoansCalculateLoanDetails({
    args: loanRequest
      ? [loanRequest.collateralToken, loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv]
      : undefined,
    query: {
      enabled: !!loanRequest && !!loanRequest.collateralToken,
      retry: 3,
      retryDelay: 1000
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

  // Gross origination fee = base fee + 0.1% transfer tax + 10% price buffer
  const grossOriginationFee = originationFee
    ? originationFee + originationFee * LMLN_FEE_RATE_FALLBACK / LMLN_FEE_DENOMINATOR + originationFee / 10n
    : undefined

  // Check if user has sufficient LMLN for origination fee (gross amount including transfer tax)
  const hasInsufficientLmln =
    grossOriginationFee && userLmlnBalance !== undefined
      ? userLmlnBalance < grossOriginationFee
      : selectedLtvOption && userLmlnBalance !== undefined
      ? userLmlnBalance < selectedLtvOption.fee
      : false

  // Function to approve LMLN tokens for loan creation or extension
  const approveLoanFee = useCallback(
    async (feeAmount?: bigint) => {
      if (!address) throw new Error('Wallet not connected')

      // Use provided fee amount (for extensions) or calculated origination fee (for new loans)
      const fee = feeAmount || originationFee

      if (!fee || fee === 0n) {
        throw new Error('Origination fee not calculated. Please try again.')
      }

      if (!feeTokenAddress || !loansContractAddress) {
        throw new Error('Contract configuration not loaded. Please refresh and try again.')
      }

      // Read the current LMLN transfer fee rate via raw selector (10 BPS = 0.1% default)
      let feeRate = LMLN_FEE_RATE_FALLBACK
      if (publicClient) {
        try {
          const result = await publicClient.call({ to: feeTokenAddress, data: LMLN_FEE_RATE_SELECTOR })
          if (result.data && result.data.length >= 66) {
            feeRate = BigInt(result.data)
          }
        } catch { /* use default */ }
      }
      // Add the transfer tax plus a 10% price-fluctuation buffer so the approval stays
      // valid even if the LMLN price moves between now and when initiateLoan executes.
      const tokenFee = fee * feeRate / LMLN_FEE_DENOMINATOR
      const grossFee = fee + tokenFee + fee / 10n // fee + 0.1% tax + 10% price buffer

      // Check if user has sufficient LMLN balance for the gross amount
      if (userLmlnBalance !== undefined && userLmlnBalance < grossFee) {
        const requiredFormatted = (Number(grossFee) / 1e18).toFixed(4)
        const availableFormatted = (Number(userLmlnBalance) / 1e18).toFixed(4)
        throw new Error(`Insufficient LMLN balance. You need ${requiredFormatted} LMLN but only have ${availableFormatted} LMLN.`)
      }

      // Approve the gross amount so the transferFrom (fee + tax) succeeds
      const approvalTxHash = await approveToken({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [loansContractAddress, grossFee]
      })

      // Wait for approval transaction to be confirmed
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approvalTxHash })
      }

      // Refetch allowance after approval
      await refetchLmlnAllowance()

      return approvalTxHash
    },
    [
      address,
      originationFee,
      feeTokenAddress,
      loansContractAddress,
      approveToken,
      publicClient,
      refetchLmlnAllowance
    ]
  )

  const approveCollateral = useCallback(
    async (collateralToken: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      if (!cmAddress) throw new Error('CollateralManager address not found')

      const txHash = await approveToken({
        address: collateralToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [cmAddress, amount]
      })

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      await refetchCollateralAllowance()

      return txHash
    },
    [address, cmAddress, approveToken, publicClient, refetchCollateralAllowance]
  )

  const waitAndInvalidate = useCallback(
    async (txHash: `0x${string}`) => {
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        if (receipt.status === 'reverted') {
          let revertError: unknown = null
          try {
            const tx = await publicClient.getTransaction({ hash: txHash })
            await publicClient.call({
              to: tx.to ?? undefined,
              data: tx.input,
              value: tx.value,
              account: tx.from,
              gas: tx.gas,
              blockNumber: receipt.blockNumber > 0n ? receipt.blockNumber - 1n : 0n,
            })
          } catch (simErr: unknown) {
            revertError = simErr
          }
          throw revertError ?? new Error('Transaction was reverted on-chain. The contract rejected the operation.')
        }
      }
      await queryClient.invalidateQueries()
    },
    [publicClient, queryClient]
  )

  const createLoan = useCallback(
    async (loanRequest: LoanRequest) => {
      if (!address) throw new Error('Wallet not connected')
      
      if (!collateralAmount || collateralAmount === 0n) {
        throw new Error('Unable to calculate collateral amount. Please try again.')
      }
      
      if (!originationFee || originationFee === 0n) {
        throw new Error('Unable to calculate origination fee. Please try again.')
      }

      // Check if requested loan amount exceeds available liquidity
      if (availableLiquidity !== undefined && loanRequest.loanAmount > availableLiquidity) {
        throw new Error('Insufficient pool liquidity for this loan amount. Please try a smaller amount.')
      }

      // Check if user has sufficient LMLN balance for the fee
      if (userLmlnBalance !== undefined && userLmlnBalance < originationFee) {
        const requiredFormatted = (Number(originationFee) / 1e18).toFixed(4)
        const availableFormatted = (Number(userLmlnBalance) / 1e18).toFixed(4)
        throw new Error(`Insufficient LMLN balance for origination fee. You need ${requiredFormatted} LMLN but only have ${availableFormatted} LMLN.`)
      }

      // Check if we have sufficient allowance (approval should be done before calling this)
      if (
        currentLmlnAllowance === undefined ||
        currentLmlnAllowance < originationFee
      ) {
        const requiredFormatted = (Number(originationFee) / 1e18).toFixed(4)
        const currentFormatted = currentLmlnAllowance ? (Number(currentLmlnAllowance) / 1e18).toFixed(4) : '0'
        throw new Error(`Insufficient LMLN allowance. You need to approve ${requiredFormatted} LMLN (current allowance: ${currentFormatted} LMLN).`)
      }

      const nativeFee = initiateNativeFee ?? 0n

      // Pre-simulate using eth_call (not eth_estimateGas) — viem decodes custom errors properly.
      // This surfaces the real revert reason before the wallet prompt appears.
      if (publicClient && loansContractAddress) {
        await publicClient.simulateContract({
          address: loansContractAddress,
          abi: loansAbi,
          functionName: 'initiateLoan',
          args: [loanRequest.collateralToken, loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv],
          value: nativeFee,
          account: address,
        })
      }

      // Execute the transaction — collateral is pre-approved to CollateralManager via ERC20
      const txHash = await initiateLoan({
        args: [loanRequest.collateralToken, loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv],
        value: nativeFee,
      })

      await waitAndInvalidate(txHash)

      return txHash
    },
    [
      address,
      initiateLoan,
      collateralAmount,
      originationFee,
      currentLmlnAllowance,
      availableLiquidity,
      loansContractAddress,
      publicClient,
      initiateNativeFee,
      waitAndInvalidate,
    ]
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
    [
      address,
      loanTokenAddress,
      loansContractAddress,
      approveToken,
      refetchAllowance,
      publicClient
    ]
  )

  const payLoan = useCallback(
    async (loanId: `0x${string}`, amount: bigint) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Fetch fresh loan status from blockchain to avoid stale data
      const currentStatus = await readLoansLoanStatus(config, {
        args: [loanId]
      })

      // Validate loan status before proceeding
      if (currentStatus !== LOAN_STATUS.ACTIVE) {
        const statusLabels: { [key: number]: string } = {
          [LOAN_STATUS.COMPLETED]: 'completed',
          [LOAN_STATUS.UNLOCKED]: 'unlocked',
          [LOAN_STATUS.DEFAULT]: 'defaulted'
        }
        const statusLabel = statusLabels[currentStatus] || 'unknown'
        throw new Error(
          `Cannot make payments on ${statusLabel} loans. Only active loans can receive payments.`
        )
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
        args: [loanId, amount],
        value: paymentNativeFee ?? 0n,
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
              return (
                Array.isArray(key) &&
                key.some(
                  (part) =>
                    typeof part === 'object' &&
                    part !== null &&
                    'args' in part &&
                    Array.isArray(part.args) &&
                    part.args[0] === address
                )
              )
            }
          }),
          queryClient.invalidateQueries({ queryKey: loanKeys.all }),
          queryClient.invalidateQueries({
            predicate: (query) =>
              Array.isArray(query.queryKey) && query.queryKey[0] === 'loan'
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
              return (
                Array.isArray(key) &&
                key.some(
                  (part) =>
                    typeof part === 'object' &&
                    part !== null &&
                    'args' in part &&
                    Array.isArray(part.args) &&
                    part.args[0] === address
                )
              )
            }
          }),
          queryClient.invalidateQueries({ queryKey: loanKeys.all }),
          queryClient.invalidateQueries({
            predicate: (query) =>
              Array.isArray(query.queryKey) && query.queryKey[0] === 'loan'
          }),
          queryClient.invalidateQueries()
        ])
      }

      return txHash
    },
    [address, withdrawCollateral, publicClient, queryClient]
  )

  // Function to extend a loan by max allowed extension
  const extendLoan = useCallback(
    async (loanId: `0x${string}`, extendTime: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await extendLoanContract({ args: [loanId, extendTime] })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [address, extendLoanContract, waitAndInvalidate]
  )

  return {
    // Operations
    createLoan,
    approveLoanFee,
    approveCollateral,
    payLoan,
    pullCollateral,
    approveTokenAllowance,
    extendLoan,

    // Transaction states
    isTransacting:
      isCreatingLoan ||
      isPayingLoan ||
      isWithdrawingCollateral ||
      isApprovingToken ||
      isExtendingLoan,
    isSimulating: isCalculating || decimalsLoading,

    // Loan creation data
    requiredCollateral: collateralAmount,
    hasInsufficientLmln,
    grossOriginationFee,
    calculationData: calculationData
      ? {
          interestAmount,
          interestApr,
          originationFee,
          collateralAmount,
          loanCycleDuration,
          firstLoanPayment
        }
      : undefined,

    // Contract addresses
    loansContractAddress,

    // User balances
    userLmlnBalance,
    userLoanTokenBalance,
    currentAllowance,
    currentLmlnAllowance,
    currentCollateralAllowance,

    // Liquidity
    availableLiquidity,
    hasInsufficientLiquidity,

    // Error state
    error: calculationError || decimalsError
  }
}
