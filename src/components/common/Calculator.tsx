import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../components/ui/button'
import { useLoans } from '../../hooks/useLoans'
import type { UseLoansReturn } from '../../hooks/types'
import { formatUnits, parseUnits } from 'viem'
import { useContractTokenConfiguration } from '../../hooks/useContractTokenConfiguration'
import { useToast } from '../../hooks/use-toast'
import {
  formatPercentage,
  formatTokenAmount
} from '../../utils/decimals'
import { formatDuration } from '../../utils/format'
import { LoanParameters } from '../calculator/LoanParameters'
import { LoanSummary } from '../calculator/LoanSummary'
import {
  handleContractError,
  isUserRejection,
  type ContractError
} from '../../utils/errorHandling'
import { useCollateralManager } from '../../hooks/useCollateralManager'
import { useLoanConfig } from '../../hooks/loans/useLoanConfig'

const SECONDS_PER_DAY = 24 * 60 * 60

// Helper function to format contract calculation data
const formatContractCalculation = (
  calculationData: {
    interestApr?: bigint
    collateralAmount?: bigint
    originationFee?: bigint
    firstLoanPayment?: bigint
    loanCycleDuration?: bigint
  },
  tokenConfig: any,
  collateralDecimals: number
) => {
  if (!calculationData || !tokenConfig) return null

  return {
    apr: calculationData.interestApr
      ? Number(
          formatPercentage(calculationData.interestApr, tokenConfig.aprDecimals)
        )
      : 0,
    lemonRequired: calculationData.collateralAmount
      ? Number(
          formatTokenAmount(
            calculationData.collateralAmount,
            collateralDecimals
          )
        )
      : 0,
    originationFeeLmln: calculationData.originationFee
      ? Number(
          formatTokenAmount(
            calculationData.originationFee,
            tokenConfig.feeToken.decimals
          )
        )
      : 0,
    monthlyPayment: calculationData.firstLoanPayment
      ? Number(
          formatTokenAmount(
            calculationData.firstLoanPayment,
            tokenConfig.loanToken.decimals
          )
        )
      : 0,
    loanCycleDuration: calculationData.loanCycleDuration || 0n
  }
}

// Helper function to build price error messages
const buildPriceError = (
  isSimulating: boolean,
  hasInsufficientLmln: boolean,
  originationFeeLmln: number,
  userLmlnBalance: bigint | undefined,
  tokenConfig: any
): string | undefined => {
  if (isSimulating) {
    return 'Calculating collateral...'
  }

  if (hasInsufficientLmln) {
    return `Insufficient ${tokenConfig?.feeToken.symbol || 'LMLN'} balance`
  }

  return undefined
}

// Helper to create base calculation structure
const createBaseCalculation = (
  loanAmount: number,
  selectedDuration: bigint,
  duration: number,
  ltv: number
) => ({
  loanAmount,
  loanDuration: selectedDuration,
  durationDisplay: formatDuration(selectedDuration),
  loanCycles: 0, // Will be calculated when we have loanCycleDuration
  ltv,
  lemonRequired: 0,
  apr: 0,
  originationFeeLmln: 0,
  monthlyPayment: 0,
  balloonPayment: loanAmount,
  isValid: false
})

interface CalculatorSectionProps {
  isDashboard?: boolean
}

const CalculatorSection = ({ isDashboard = false }: CalculatorSectionProps) => {
  // Get contract token configuration
  const { tokenConfig } = useContractTokenConfiguration()
  const { toast } = useToast()

  // Collateral manager — the user always picks explicitly via the selector in LoanParameters,
  // even when only one token is configured. No auto-selection.
  const {
    selectedCollateral,
    setSelectedCollateral,
    supportedCollateralTokens
  } = useCollateralManager()

  // Per-asset config (ltvOptions, interestAprConfigs depend on selected collateral)
  const perAssetConfig = useLoanConfig(selectedCollateral?.address)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // UI loading states for transactions
  const [isApprovingCollateral, setIsApprovingCollateral] = useState(false)
  const [isApprovingLoanFee, setIsApprovingLoanFee] = useState(false)
  const [isCreatingLoan, setIsCreatingLoan] = useState(false)

  // Initialize with contract values when available
  const [loanAmount, setLoanAmount] = useState(0)
  const [duration, setDuration] = useState<number>(0)
  const [ltv, setLtv] = useState(0)

  // Get initial loan config and options - moved up to avoid initialization error
  const initialHookData: UseLoansReturn = useLoans()

  // Set initial values from contract config (loanAmount stays at 0 so the
  // input shows the placeholder — the user has to type the desired amount).
  useEffect(() => {
    // Snap LTV to the first option for the selected collateral — on first load (ltv===0)
    // and when the user switches collateral tokens and the current LTV isn't in the new set.
    if (perAssetConfig.ltvOptions.length > 0 && tokenConfig) {
      const availableLtvs = perAssetConfig.ltvOptions.map((opt) =>
        Number(formatPercentage(opt.ltv, tokenConfig.ltvDecimals))
      )
      if (ltv === 0 || !availableLtvs.includes(ltv)) {
        setLtv(availableLtvs[0])
      }
    }
    if (initialHookData.durationRange.min > 0 && duration === 0) {
      setDuration(initialHookData.durationRange.min)
    }
  }, [
    initialHookData.loanConfig,
    perAssetConfig.ltvOptions,
    perAssetConfig.interestAprConfigs,
    initialHookData.durationRange,
    tokenConfig
  ])

  // Use the selected duration directly (already in seconds)
  const selectedDuration = useMemo(() => {
    return BigInt(Math.floor(duration))
  }, [duration])

  // Create loan request for simulation
  const loanRequest = useMemo(() => {
    if (
      !selectedCollateral ||
      !loanAmount ||
      !selectedDuration ||
      selectedDuration === 0n ||
      !ltv ||
      !tokenConfig
    )
      return undefined

    return {
      collateralToken: selectedCollateral.address,
      loanAmount: parseUnits(
        loanAmount.toString(),
        tokenConfig.loanToken.decimals
      ),
      duration: selectedDuration,
      ltv: parseUnits((ltv / 100).toString(), tokenConfig.ltvDecimals)
    }
  }, [selectedCollateral, loanAmount, selectedDuration, ltv, tokenConfig])

  // Get origination fee for selected LTV
  const selectedLtvOption = useMemo(() => {
    if (!tokenConfig) return undefined

    // Convert ltv percentage (50) to decimal (0.5) then to contract format
    const ltvDecimal = (ltv / 100).toString()
    const ltvInContractFormat = parseUnits(ltvDecimal, tokenConfig.ltvDecimals)

    return perAssetConfig.ltvOptions.find(
      (option) => option.ltv === ltvInContractFormat
    )
  }, [perAssetConfig.ltvOptions, ltv, tokenConfig])

  // Get the loan operations with the calculated request
  const loanOperations = useLoans({
    loanRequest,
    selectedLtvOption
  })

  // Filter out user rejections from operation errors - don't show them in UI
  const operationError =
    loanOperations.error && !isUserRejection(loanOperations.error)
      ? loanOperations.error
      : null

  // Pick the APR tier whose duration band covers the current slider position.
  // Decouples the displayed APR from the amount input — sliding LTV / Duration
  // updates the APR live even before the user has typed an amount.
  const aprFromDuration = useMemo(() => {
    if (!tokenConfig || perAssetConfig.interestAprConfigs.length === 0) return 0
    const tier = perAssetConfig.interestAprConfigs.find(
      (c) =>
        selectedDuration >= c.minDuration && selectedDuration <= c.maxDuration
    )
    if (!tier) return 0
    return Number(formatPercentage(tier.interestApr, tokenConfig.aprDecimals))
  }, [perAssetConfig.interestAprConfigs, selectedDuration, tokenConfig])

  // Calculate loan details using contract calculation data
  const calculation = useMemo(() => {
    // Create base structure
    const base = createBaseCalculation(
      loanAmount,
      selectedDuration,
      duration,
      ltv
    )

    // APR + LTV are derived from the slider positions and contract config, so
    // they should render even when the simulation hasn't run yet (no amount
    // typed, below-min, etc.).
    const baseWithDials = { ...base, apr: aprFromDuration }

    // Check if we're still loading contract configuration
    if (!tokenConfig || !selectedCollateral || perAssetConfig.interestAprConfigs.length === 0) {
      return {
        ...baseWithDials,
        priceError: 'Loading contract data...'
      }
    }

    // Check if we have calculation data from contract
    if (!loanOperations.calculationData) {
      // No data because the simulation can't run yet (no input or invalid input
      // like below-minimum). Either way, show a neutral "—" instead of an
      // alarming error string — the form surfaces actionable validation
      // (red border + min-amount hint) elsewhere.
      return {
        ...baseWithDials,
        priceError: loanOperations.isSimulating
          ? 'Calculating collateral...'
          : '—'
      }
    }

    // Format the contract calculation data
    const formatted = formatContractCalculation(
      loanOperations.calculationData,
      tokenConfig,
      selectedCollateral?.decimals ?? 18
    )

    if (!formatted) {
      return {
        ...baseWithDials,
        priceError: 'Error formatting calculation data'
      }
    }

    // Calculate loan cycles
    const loanCycles = formatted.loanCycleDuration && formatted.loanCycleDuration > 0n
      ? Math.ceil(Number(selectedDuration) / Number(formatted.loanCycleDuration))
      : 0

    // Build the final calculation with all values
    const isValid =
      !loanOperations.isSimulating &&
      !!loanOperations.calculationData &&
      !loanOperations.hasInsufficientLmln &&
      !loanOperations.hasInsufficientLiquidity

    const priceError = buildPriceError(
      loanOperations.isSimulating,
      loanOperations.hasInsufficientLmln,
      formatted.originationFeeLmln,
      loanOperations.userLmlnBalance,
      tokenConfig
    ) || (loanOperations.hasInsufficientLiquidity
      ? 'Insufficient pool liquidity for this loan amount'
      : undefined)

    return {
      ...baseWithDials,
      ...formatted,
      loanCycles,
      balloonPayment: loanAmount,
      isValid,
      priceError
    }
  }, [
    loanAmount,
    selectedDuration,
    duration,
    ltv,
    aprFromDuration,
    loanOperations.calculationData,
    loanOperations.isSimulating,
    tokenConfig,
    selectedCollateral,
    loanOperations.hasInsufficientLmln,
    loanOperations.hasInsufficientLiquidity,
    perAssetConfig.interestAprConfigs,
    loanOperations.userLmlnBalance
  ])

  // Check if collateral ERC20 approval is needed (WLEMX → CollateralManager)
  const needsCollateralApproval = useMemo(() => {
    const collateralAmount = loanOperations.calculationData?.collateralAmount
    if (!collateralAmount || collateralAmount === 0n) return false
    if (loanOperations.currentCollateralAllowance === undefined) return true
    return loanOperations.currentCollateralAllowance < collateralAmount
  }, [
    loanOperations.calculationData?.collateralAmount,
    loanOperations.currentCollateralAllowance
  ])

  // Check if LMLN fee approval is needed.
  // Compare against raw originationFee — the approval itself adds a buffer for the transfer tax.
  // Using the grossed-up amount as the threshold causes an infinite approval loop when the
  // LMLN price shifts, because the previously approved gross amount no longer meets the new gross threshold.
  const needsApproval = useMemo(() => {
    const originationFee = loanOperations.calculationData?.originationFee
    if (!originationFee) return false
    if (loanOperations.currentLmlnAllowance === undefined) return true
    return loanOperations.currentLmlnAllowance < originationFee
  }, [
    loanOperations.calculationData?.originationFee,
    loanOperations.currentLmlnAllowance
  ])

  // Handle collateral ERC20 approval (WLEMX → CollateralManager)
  const handleApproveCollateral = async () => {
    if (!selectedCollateral || !loanOperations.calculationData?.collateralAmount) return
    setIsApprovingCollateral(true)
    try {
      await loanOperations.approveCollateral(
        selectedCollateral.address,
        loanOperations.calculationData.collateralAmount
      )
      toast({
        title: '✅ Collateral Approved',
        description: `${selectedCollateral.symbol} approved. You can now approve the origination fee.`
      })
    } catch (error) {
      const contractError = error as ContractError
      if (isUserRejection(contractError)) {
        setIsDialogOpen(false)
      } else {
        handleContractError(contractError, toast, 'Collateral Approval Failed')
      }
    } finally {
      setIsApprovingCollateral(false)
    }
  }

  // Handle loan fee approval
  const handleApproveLoanFee = async () => {
    setIsApprovingLoanFee(true)
    try {
      const result = await loanOperations.approveLoanFee()

      if (result) {
        toast({
          title: '\u2705 Approval Successful',
          description:
            'LMLN tokens approved for loan fee. You can now create the loan!'
        })
      }
    } catch (error) {
      const contractError = error as ContractError

      // For user rejections, just close the modal - no error feedback needed
      if (isUserRejection(contractError)) {
        setIsDialogOpen(false)
      } else {
        // Use our shared error handling utility for actual errors
        handleContractError(contractError, toast, 'Approval Failed')
      }
    } finally {
      setIsApprovingLoanFee(false)
    }
  }

  // Handle loan creation
  const handleCreateLoan = async () => {
    if (!calculation.isValid || !loanRequest) {
      return
    }

    setIsCreatingLoan(true)
    try {
      const result = await loanOperations.createLoan(loanRequest)

      // Only show success if we actually get a successful result
      if (result) {
        setIsDialogOpen(false)
        toast({
          title: '\u2705 Loan Created Successfully',
          description:
            'Your loan has been created and will appear in your active loans!'
        })

        // Full reset \u2014 force the user to re-pick collateral and re-enter loan terms
        // if they want another loan. Loan amount and duration repopulate to
        // contract defaults via the init effect; LTV stays 0 until a collateral is picked.
        setSelectedCollateral(undefined)
        setLoanAmount(0)
        setDuration(0)
        setLtv(0)
      }
    } catch (error) {
      const contractError = error as ContractError

      // For user rejections, just close the modal - no error feedback needed
      if (isUserRejection(contractError)) {
        setIsDialogOpen(false)
      } else {
        // Use our shared error handling utility for actual errors
        handleContractError(contractError, toast, 'Loan Creation Failed')
      }
    } finally {
      setIsCreatingLoan(false)
    }
  }

  // Show loading state while fetching contract config
  if (initialHookData.isLoading && !initialHookData.loanConfig) {
    return (
      <div className='text-center py-8'>
        <p>Loading loan configuration...</p>
      </div>
    )
  }

  if (initialHookData.error || !initialHookData.loanConfig) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading loan configuration</p>
      </div>
    )
  }

  const calculatorContent = (
    <div className='grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto'>
      <LoanParameters
        loanAmount={loanAmount}
        setLoanAmount={setLoanAmount}
        duration={duration}
        setDuration={setDuration}
        ltv={ltv}
        setLtv={setLtv}
        loanConfig={initialHookData.loanConfig}
        tokenConfig={tokenConfig}
        interestAprConfigs={perAssetConfig.interestAprConfigs}
        ltvOptions={perAssetConfig.ltvOptions}
        durationRange={initialHookData.durationRange}
        configLoading={initialHookData.isLoading || perAssetConfig.isLoading}
        availableLiquidity={loanOperations.availableLiquidity}
        supportedCollateralTokens={supportedCollateralTokens}
        selectedCollateral={selectedCollateral}
        setSelectedCollateral={setSelectedCollateral}
        isDashboard={isDashboard}
      />

      <LoanSummary
        calculation={calculation}
        tokenConfig={tokenConfig}
        collateralSymbol={selectedCollateral?.symbol}
        hasInsufficientLmln={loanOperations.hasInsufficientLmln}
        hasInsufficientLiquidity={loanOperations.hasInsufficientLiquidity}
        userLmlnBalance={loanOperations.userLmlnBalance}
        operationError={operationError}
        isApprovingCollateral={isApprovingCollateral}
        isApprovingLoanFee={isApprovingLoanFee}
        isCreatingLoan={isCreatingLoan}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        handleCreateLoan={handleCreateLoan}
        handleApproveCollateral={handleApproveCollateral}
        handleApproveLoanFee={handleApproveLoanFee}
        needsCollateralApproval={needsCollateralApproval}
        needsApproval={needsApproval}
        isDashboard={isDashboard}
        selectedLtvOption={selectedLtvOption}
      />
    </div>
  )

  if (isDashboard) {
    return calculatorContent
  }

  return (
    <section id='calculator' className='py-20 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-16 animate-fade-in'>
          <h2 className='text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Simulate Your Loan
          </h2>
          <p className='text-xl text-gray-600'>
            Enter your loan parameters and then submit the form to get on the
            list
          </p>
        </div>

        {calculatorContent}

        {/* Centered Submit Button */}
        <div className='text-center mt-12'>
          <Button className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold py-3 px-8 text-lg'>
            <a href='https://airtable.com/appt6TylkeAGQeAgR/pagMi66nT96i6I3a2/form'>
              Submit For More Information
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default CalculatorSection
