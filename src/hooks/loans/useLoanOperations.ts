import { useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
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
  useReadLoansFeeBps,
  useReadLoansBpsDenominator,
  loansAddress,
  loansAbi,
  useWriteLoansWithdrawCollateral,
  useWriteLoansExtendLoan,
  readLoansLoanStatus
} from '@/src/generated'
import { useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { config } from '@/src/config/wagmi'
import { erc20Abi, formatEther } from 'viem'
import { grossPaymentAmount } from '@/src/utils/fees'
import { waitForReceiptOrPending } from '@/src/utils/errorHandling'
import { useBackgroundRefresh } from '@/src/hooks/query/useBackgroundRefresh'
import { useContractTokenConfiguration } from '../useContractTokenConfiguration'
import { useProtocolAddresses } from '../useProtocolAddresses'

export interface LoanRequest {
  collateralToken: `0x${string}` // ERC20 collateral token address
  loanAmount: bigint // wei (token decimals)
  duration: bigint // seconds
  ltv: bigint // percentage scaled by PRECISION (e.g., 50 * 1e8 = 50%)
}

export interface UseLoanOperationsOptions {
  loanRequest?: LoanRequest
  selectedLtvOption?: { ltv: bigint; fee: bigint }
  /** Address that will be charged the LMLN origination fee. Defaults to the
   *  connected wallet (borrower self-pays). Pass a delegate address to route
   *  LMLN balance/allowance reads to that wallet and to forward it as the
   *  `originationPayer` arg on initiateLoan/extendLoan. */
  originationPayer?: `0x${string}`
}

// LMLN token charges a transfer fee. Selector 0x9d11aaaa returns 10.
// The value is in basis points (BPS), denominator = 10000, so 10 BPS = 0.1%.
// approveLoanFee adds a 10% buffer on top of origFee so the transferFrom always
// succeeds even with minor LMLN price movement between approval and creation.
// Module constants (not component state) so they never belong in dep arrays.
const LMLN_FEE_DENOMINATOR = 10000n
const LMLN_FEE_RATE_FALLBACK = 10n // 10 BPS = 0.1%
const LMLN_FEE_RATE_SELECTOR = '0x9d11aaaa' as `0x${string}`

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
  hasInsufficientCollateral: boolean
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
  userCollateralBalance: bigint | undefined
  currentAllowance: bigint | undefined
  currentLmlnAllowance: bigint | undefined
  currentCollateralAllowance: bigint | undefined

  // Liquidity
  availableLiquidity: bigint | undefined
  hasInsufficientLiquidity: boolean

  // Protocol fees (read from chain)
  /** makeLoanPayment protocol fee rate in basis points (FEE_BPS) */
  paymentFeeBps: bigint
  /** Basis-point denominator (BPS_DENOMINATOR) */
  bpsDenominator: bigint
  /** Gross amount the contract pulls for a payment: amount + protocol fee */
  getGrossPaymentAmount: (amount: bigint) => bigint
  /** Native (gas-token) fee attached to initiateLoan, in wei. 0n when unset. */
  initiateNativeFee: bigint | undefined
  /** Native (gas-token) fee attached to makeLoanPayment, in wei. 0n when unset. */
  paymentNativeFee: bigint | undefined

  // Error state
  error: Error | null
}

// No longer needed - calculateLoanDetails provides this

export const useLoanOperations = (
  options?: UseLoanOperationsOptions
): UseLoanOperationsReturn => {
  const { loanRequest, originationPayer } = options || {}
  const { address } = useAccount()
  // The wallet that will pay the LMLN origination fee. Defaults to the
  // connected wallet (borrower self-pays). When the borrower picks a
  // delegate, balance/allowance reads and contract calls re-target this
  // address — keeping `hasInsufficientLmln` and the allowance check honest
  // regardless of who is paying.
  const effectivePayer = originationPayer ?? address
  // Narrowed to the deployed chain ids so it can be passed straight to the
  // generated write hooks' chainId parameter.
  const chainId = useChainId() as keyof typeof loansAddress
  const publicClient = usePublicClient()

  // Get loans contract address for current chain
  const loansContractAddress =
    loansAddress[chainId as keyof typeof loansAddress]

  // Collateral manager + liquidity pool addresses are resolved on-chain.
  // CollateralManager is the spender for collateral approvals; LiquidityPool
  // is only used for origination-fee approvals on initiateLoan. Loan-token
  // approvals for makeLoanPayment target the Loans contract itself, since
  // makeLoanPayment does `loanToken.safeTransferFrom(msg.sender, address(this), …)`.
  const { collateralManager: cmAddress } = useProtocolAddresses()

  // Get contract token and decimal configuration
  const {
    tokenConfig,
    isLoading: decimalsLoading,
    error: decimalsError
  } = useContractTokenConfiguration()

  // Get the fee token address from contract
  const { data: feeTokenAddress } = useReadLoansOriginationFeeToken()

  // LMLN balance for the fee payer (borrower self-pays by default; delegate
  // when the borrower has unlocked the field and picked someone else).
  const { data: userLmlnBalance } = useReadContract({
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: effectivePayer ? [effectivePayer] : undefined,
    query: {
      enabled: !!feeTokenAddress && !!effectivePayer
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

  // Loan-token allowance for payments — granted to the Loans contract,
  // which is the spender in makeLoanPayment's transferFrom.
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

  // LMLN allowance from the fee payer to the Loans contract.
  const { data: currentLmlnAllowance, refetch: refetchLmlnAllowance } =
    useReadContract({
      address: feeTokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args:
        effectivePayer && loansContractAddress
          ? [effectivePayer, loansContractAddress]
          : undefined,
      query: {
        enabled: !!feeTokenAddress && !!effectivePayer && !!loansContractAddress
      }
    })

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

  // Borrower's collateral-token balance. Always the connected wallet — the
  // borrower posts collateral regardless of who pays the origination fee.
  const { data: userCollateralBalance } = useReadContract({
    address: loanRequest?.collateralToken,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!loanRequest?.collateralToken && !!address
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

  // Protocol payment fee, read from chain so a governance change to FEE_BPS
  // can't silently desync the UI's balance/allowance math from the contract.
  const { data: feeBpsRaw } = useReadLoansFeeBps()
  const { data: bpsDenominatorRaw } = useReadLoansBpsDenominator()
  const paymentFeeBps = feeBpsRaw ?? 25n
  const bpsDenominator = bpsDenominatorRaw ?? 10000n

  // Gross amount the contract pulls on makeLoanPayment: amount + fee, with the
  // fee rounded up so approvals/balance checks always cover the on-chain pull.
  const getGrossPaymentAmount = useCallback(
    (amount: bigint) => grossPaymentAmount(amount, paymentFeeBps, bpsDenominator),
    [paymentFeeBps, bpsDenominator]
  )

  // Native currency symbol for user-facing fee messages (TLEMX / LEMX / BNB).
  const nativeSymbol =
    config.chains.find((c) => c.id === chainId)?.nativeCurrency.symbol ??
    'native token'

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

  // Check if user has sufficient LMLN for origination fee (gross amount
  // including transfer tax). Only meaningful once calculateLoanDetails has
  // resolved — the raw LTV-tier fee is a USD amount, not LMLN, so comparing
  // it against an LMLN wei balance would be nonsense.
  const hasInsufficientLmln =
    grossOriginationFee && userLmlnBalance !== undefined
      ? userLmlnBalance < grossOriginationFee
      : false

  // Check if borrower has enough collateral-token to back the loan. Without
  // this guard, initiateLoan reaches the on-chain transferFrom and reverts
  // with the (poorly-worded) WLEMX "amount < balance" message.
  const hasInsufficientCollateral =
    collateralAmount !== undefined && userCollateralBalance !== undefined
      ? userCollateralBalance < collateralAmount
      : false

  // Shared non-blocking refresh — see useBackgroundRefresh for the rationale
  // (the loan modals block dismissal mid-tx, so an awaited refresh here would
  // trap the user on a stalled read).
  const { invalidateAll, scheduleRefresh } = useBackgroundRefresh()

  // Wait for a tx to land and throw if it reverted on-chain — a reverted
  // approval must never surface as a success toast.
  const waitForSuccess = useCallback(
    async (txHash: `0x${string}`, label: string) => {
      if (!publicClient) return
      const receipt = await waitForReceiptOrPending(
        publicClient,
        txHash,
        scheduleRefresh
      )
      if (receipt.status === 'reverted') {
        throw new Error(
          `${label} transaction was reverted on-chain. No changes were made — please try again.`
        )
      }
    },
    [publicClient, scheduleRefresh]
  )

  // Payable loan operations attach a native fee as msg.value. Nothing else in
  // the UI checks the native balance, so without this guard a user with token
  // balances but no gas token hits a raw wallet-level "insufficient funds".
  const ensureNativeFeeBalance = useCallback(
    async (nativeFee: bigint, account: `0x${string}`) => {
      if (nativeFee === 0n || !publicClient) return
      const nativeBalance = await publicClient.getBalance({ address: account })
      if (nativeBalance < nativeFee) {
        throw new Error(
          `Insufficient ${nativeSymbol} for the network fee. This operation requires ` +
            `${formatEther(nativeFee)} ${nativeSymbol} plus gas, but your balance is ` +
            `${formatEther(nativeBalance)} ${nativeSymbol}.`
        )
      }
    },
    [publicClient, nativeSymbol]
  )

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

      // Approve the gross amount so the transferFrom (fee + tax) succeeds.
      // chainId pinned on every write — a wallet mid-network-switch must be
      // told to switch back, not sign against another chain's address slot.
      const approvalTxHash = await approveToken({
        chainId,
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [loansContractAddress, grossFee]
      })

      // Wait for approval to be confirmed and verify it didn't revert
      await waitForSuccess(approvalTxHash, 'LMLN approval')

      // Refetch allowance after approval
      await refetchLmlnAllowance()

      return approvalTxHash
    },
    [
      address,
      chainId,
      originationFee,
      feeTokenAddress,
      loansContractAddress,
      approveToken,
      publicClient,
      // The balance guard's error message must reflect the CURRENT balance,
      // not a stale closure value.
      userLmlnBalance,
      waitForSuccess,
      refetchLmlnAllowance
    ]
  )

  const approveCollateral = useCallback(
    async (collateralToken: `0x${string}`, amount: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      if (!cmAddress) throw new Error('CollateralManager address not found')

      const txHash = await approveToken({
        chainId,
        address: collateralToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [cmAddress, amount]
      })

      await waitForSuccess(txHash, 'Collateral approval')

      await refetchCollateralAllowance()

      return txHash
    },
    [chainId, address, cmAddress, approveToken, waitForSuccess, refetchCollateralAllowance]
  )

  const waitAndInvalidate = useCallback(
    async (txHash: `0x${string}`) => {
      if (publicClient) {
        const receipt = await waitForReceiptOrPending(
          publicClient,
          txHash,
          scheduleRefresh
        )
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
      scheduleRefresh()
    },
    [publicClient, scheduleRefresh]
  )

  const createLoan = useCallback(
    async (loanRequest: LoanRequest) => {
      if (!address) throw new Error('Wallet not connected')
      const payer = originationPayer ?? address

      if (!collateralAmount || collateralAmount === 0n) {
        throw new Error('Unable to calculate collateral amount. Please try again.')
      }
      
      // undefined means the calculation hasn't resolved; 0n is a legitimate
      // zero-fee LTV tier and must not block creation.
      if (originationFee === undefined) {
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
      await ensureNativeFeeBalance(nativeFee, address)

      // Pre-simulate using eth_call (not eth_estimateGas) — viem decodes custom errors properly.
      // This surfaces the real revert reason before the wallet prompt appears.
      if (publicClient && loansContractAddress) {
        await publicClient.simulateContract({
          address: loansContractAddress,
          abi: loansAbi,
          functionName: 'initiateLoan',
          args: [loanRequest.collateralToken, loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv, payer],
          value: nativeFee,
          account: address,
        })
      }

      // Execute the transaction — collateral is pre-approved to CollateralManager via ERC20
      const txHash = await initiateLoan({
        chainId,
        args: [loanRequest.collateralToken, loanRequest.duration, loanRequest.loanAmount, loanRequest.ltv, payer],
        value: nativeFee,
      })

      await waitAndInvalidate(txHash)

      return txHash
    },
    [
      address,
      chainId,
      originationPayer,
      initiateLoan,
      collateralAmount,
      originationFee,
      currentLmlnAllowance,
      availableLiquidity,
      loansContractAddress,
      publicClient,
      initiateNativeFee,
      ensureNativeFeeBalance,
      // Same stale-closure guard as approveLoanFee.
      userLmlnBalance,
      waitAndInvalidate,
    ]
  )

  // Approve loan-token spending for payments. Spender is the Loans contract,
  // which is what makeLoanPayment's transferFrom pulls through. The contract
  // pulls amount + protocol fee (FEE_BPS, read from chain), so the approval
  // must cover the gross — a "Pay Balance" with a bare-amount approval would
  // otherwise revert with insufficient allowance.
  const approveTokenAllowance = useCallback(
    async (amount: bigint) => {
      if (!address || !loanTokenAddress || !loansContractAddress) {
        throw new Error('Missing required data for token approval')
      }

      const grossAmount = getGrossPaymentAmount(amount)

      const txHash = await approveToken({
        chainId,
        address: loanTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [loansContractAddress, grossAmount]
      })

      // Wait for the approval to be mined and verify it didn't revert
      await waitForSuccess(txHash, 'Token approval')

      // After transaction is confirmed, refetch the allowance
      await refetchAllowance()

      return txHash
    },
    [
      chainId,
      address,
      loanTokenAddress,
      loansContractAddress,
      approveToken,
      getGrossPaymentAmount,
      waitForSuccess,
      refetchAllowance
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

      // Contract pulls amount + protocol fee (FEE_BPS, read from chain) on
      // makeLoanPayment, so balance and allowance must cover the gross.
      const grossAmount = getGrossPaymentAmount(amount)

      // Check if user has sufficient loan token balance
      if (userLoanTokenBalance !== undefined && userLoanTokenBalance < grossAmount) {
        throw new Error(`Insufficient loan token balance`)
      }

      // Check if we need to approve tokens first
      if (!currentAllowance || currentAllowance < grossAmount) {
        await approveTokenAllowance(amount)
      }

      const nativeFee = paymentNativeFee ?? 0n
      await ensureNativeFeeBalance(nativeFee, address)

      // Pre-simulate via eth_call so contract reverts (e.g. LoanNotActive when a
      // time-based default has occurred but loanStatus() hasn't been written yet)
      // surface as decoded custom errors instead of the wallet's gas-estimation
      // fallback, which on chains MetaMask doesn't natively know about gets
      // surfaced as the cryptic "tx fee exceeds the configured cap" error.
      if (publicClient && loansContractAddress) {
        await publicClient.simulateContract({
          address: loansContractAddress,
          abi: loansAbi,
          functionName: 'makeLoanPayment',
          args: [loanId, amount],
          value: nativeFee,
          account: address,
        })
      }

      const txHash = await makeLoanPayment({
        chainId,
        args: [loanId, amount],
        value: nativeFee,
      })

      // Wait for confirmation, throw the decoded revert reason if the tx
      // failed on-chain, and refresh all queries on success. A reverted
      // payment must never surface as a success toast.
      await waitAndInvalidate(txHash)

      return txHash
    },
    [
      chainId,
      address,
      makeLoanPayment,
      loanTokenAddress,
      loansContractAddress,
      userLoanTokenBalance,
      currentAllowance,
      approveTokenAllowance,
      getGrossPaymentAmount,
      paymentNativeFee,
      ensureNativeFeeBalance,
      publicClient,
      waitAndInvalidate
    ]
  )

  const pullCollateral = useCallback(
    async (loanId: `0x${string}`) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      const txHash = await withdrawCollateral({
        chainId,
        args: [loanId]
      })

      // Wait for confirmation, throw the decoded revert reason if the tx
      // failed on-chain, and refresh all queries on success.
      await waitAndInvalidate(txHash)

      return txHash
    },
    [chainId, address, withdrawCollateral, waitAndInvalidate]
  )

  // Function to extend a loan by max allowed extension
  const extendLoan = useCallback(
    async (loanId: `0x${string}`, extendTime: bigint) => {
      if (!address) throw new Error('Wallet not connected')
      const payer = originationPayer ?? address

      // Pre-simulate so contract reverts (fee changed, loan state changed,
      // delegate allowance short) surface as decoded errors before the wallet
      // prompt — extendLoan was the only write without this.
      if (publicClient && loansContractAddress) {
        await publicClient.simulateContract({
          address: loansContractAddress,
          abi: loansAbi,
          functionName: 'extendLoan',
          args: [loanId, extendTime, payer],
          account: address,
        })
      }

      const txHash = await extendLoanContract({
        chainId,
        args: [loanId, extendTime, payer]
      })
      await waitAndInvalidate(txHash)
      return txHash
    },
    [chainId, address, originationPayer, extendLoanContract, publicClient, loansContractAddress, waitAndInvalidate]
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
    hasInsufficientCollateral,
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
    userCollateralBalance,
    currentAllowance,
    currentLmlnAllowance,
    currentCollateralAllowance,

    // Liquidity
    availableLiquidity,
    hasInsufficientLiquidity,

    // Protocol fees
    paymentFeeBps,
    bpsDenominator,
    getGrossPaymentAmount,
    initiateNativeFee,
    paymentNativeFee,

    // Error state
    error: calculationError || decimalsError
  }
}
