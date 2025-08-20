import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../components/ui/button'
import { useLoans } from '../../hooks/useLoans'
import type { UseLoansReturn } from '../../hooks/types'
import { formatUnits, parseUnits } from 'viem'
import { useContractTokenConfiguration } from '../../hooks/useContractTokenConfiguration'
import { useToast } from '../../hooks/use-toast'
import {
  parsePercentage,
  formatPercentage,
  formatTokenAmount,
  formatDurationRange
} from '../../utils/decimals'
import { LoanParameters } from '../calculator/LoanParameters'
import { LoanSummary } from '../calculator/LoanSummary'
import {
  handleContractError,
  isUserRejection,
  type ContractError
} from '../../utils/errorHandling'

const SECONDS_PER_DAY = 24 * 60 * 60

// Helper function to format contract calculation data
const formatContractCalculation = (
  calculationData: {
    interestApr?: bigint
    collateralAmount?: bigint
    originationFee?: bigint
    firstLoanPayment?: bigint
  },
  tokenConfig: any
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
            tokenConfig.nativeToken.decimals
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
      : 0
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
  durationDisplay: `${Math.floor(duration / 3600)} hours`,
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

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // UI loading states for transactions
  const [isApprovingLoanFee, setIsApprovingLoanFee] = useState(false)
  const [isCreatingLoan, setIsCreatingLoan] = useState(false)

  // Initialize with contract values when available
  const [loanAmount, setLoanAmount] = useState(0)
  const [duration, setDuration] = useState<number>(0)
  const [ltv, setLtv] = useState(0)

  // Get initial loan config and options - moved up to avoid initialization error
  const initialHookData: UseLoansReturn = useLoans()

  // Set initial values from contract config
  useEffect(() => {
    if (
      initialHookData.loanConfig &&
      initialHookData.loanConfig.minLoanAmount &&
      loanAmount === 0
    ) {
      setLoanAmount(
        Number(
          formatUnits(
            initialHookData.loanConfig.minLoanAmount,
            tokenConfig?.loanToken.decimals || 18
          )
        )
      )
    }
    if (initialHookData.ltvOptions.length > 0 && ltv === 0 && tokenConfig) {
      const ltvPercentage = Number(
        formatPercentage(
          initialHookData.ltvOptions[0].ltv,
          tokenConfig.ltvDecimals
        )
      )
      setLtv(ltvPercentage)
    }
    if (initialHookData.interestAprConfigs.length > 0 && duration === 0) {
      // Set initial duration to the midpoint of the first config
      const firstConfig = initialHookData.interestAprConfigs[0]
      setDuration(Number(firstConfig.minDuration))
    }
  }, [
    initialHookData.loanConfig,
    initialHookData.ltvOptions,
    initialHookData.interestAprConfigs,
    tokenConfig
  ])

  // Use the selected duration directly (already in seconds)
  const selectedDuration = useMemo(() => {
    return BigInt(Math.floor(duration))
  }, [duration])

  // Create loan request for simulation
  const loanRequest = useMemo(() => {
    if (
      !loanAmount ||
      !selectedDuration ||
      selectedDuration === 0n ||
      !ltv ||
      !tokenConfig
    )
      return undefined

    const request = {
      loanAmount: parseUnits(
        loanAmount.toString(),
        tokenConfig.loanToken.decimals
      ),
      duration: selectedDuration,
      ltv: parseUnits((ltv / 100).toString(), tokenConfig.ltvDecimals)
    }
    return request
  }, [loanAmount, selectedDuration, ltv, tokenConfig])

  // Get origination fee for selected LTV
  const selectedLtvOption = useMemo(() => {
    if (!tokenConfig) return undefined

    // Convert ltv percentage (50) to decimal (0.5) then to contract format
    const ltvDecimal = (ltv / 100).toString()
    const ltvInContractFormat = parseUnits(ltvDecimal, tokenConfig.ltvDecimals)

    const found = initialHookData.ltvOptions.find(
      (option) => option.ltv === ltvInContractFormat
    )

    return found
  }, [initialHookData.ltvOptions, ltv, tokenConfig])

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

  // Calculate loan details using contract calculation data
  const calculation = useMemo(() => {
    // Create base structure
    const base = createBaseCalculation(
      loanAmount,
      selectedDuration,
      duration,
      ltv
    )

    // Check if we're still loading contract configuration
    if (!tokenConfig || initialHookData.interestAprConfigs.length === 0) {
      return {
        ...base,
        priceError: 'Loading contract data...'
      }
    }

    // Check if we have calculation data from contract
    if (!loanOperations.calculationData) {
      return {
        ...base,
        priceError: loanOperations.isSimulating
          ? 'Calculating collateral...'
          : 'Contract calculation not available'
      }
    }

    // Format the contract calculation data
    const formatted = formatContractCalculation(
      loanOperations.calculationData,
      tokenConfig
    )

    if (!formatted) {
      return {
        ...base,
        priceError: 'Error formatting calculation data'
      }
    }

    // Build the final calculation with all values
    const isValid =
      !loanOperations.isSimulating &&
      !!loanOperations.calculationData &&
      !loanOperations.hasInsufficientLmln

    const priceError = buildPriceError(
      loanOperations.isSimulating,
      loanOperations.hasInsufficientLmln,
      formatted.originationFeeLmln,
      loanOperations.userLmlnBalance,
      tokenConfig
    )

    return {
      ...base,
      ...formatted,
      balloonPayment: loanAmount,
      isValid,
      priceError
    }
  }, [
    loanAmount,
    selectedDuration,
    duration,
    ltv,
    loanOperations.calculationData,
    loanOperations.isSimulating,
    tokenConfig,
    loanOperations.hasInsufficientLmln,
    initialHookData.interestAprConfigs,
    loanOperations.userLmlnBalance
  ])

  // Check if approval is needed for loan creation
  const needsApproval = useMemo(() => {
    if (!loanOperations.calculationData?.originationFee) {
      return false
    }
    // If allowance is not loaded yet, assume approval is needed
    if (loanOperations.currentLmlnAllowance === undefined) {
      return true
    }
    return (
      loanOperations.currentLmlnAllowance <
      loanOperations.calculationData.originationFee
    )
  }, [
    loanOperations.calculationData?.originationFee,
    loanOperations.currentLmlnAllowance
  ])

  // Handle loan fee approval
  const handleApproveLoanFee = async () => {
    setIsApprovingLoanFee(true)
    try {
      const result = await loanOperations.approveLoanFee()

      if (result) {
        toast({
          title: 'Approval Successful',
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
          title: 'Loan Created Successfully',
          description:
            'Your loan has been created and will appear in your active loans!'
        })
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
        interestAprConfigs={initialHookData.interestAprConfigs}
        ltvOptions={initialHookData.ltvOptions}
        durationRange={initialHookData.durationRange}
        configLoading={initialHookData.isLoading}
        isDashboard={isDashboard}
      />

      <LoanSummary
        calculation={calculation}
        tokenConfig={tokenConfig}
        hasInsufficientLmln={loanOperations.hasInsufficientLmln}
        userLmlnBalance={loanOperations.userLmlnBalance}
        operationError={operationError}
        isApprovingLoanFee={isApprovingLoanFee}
        isCreatingLoan={isCreatingLoan}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        handleCreateLoan={handleCreateLoan}
        handleApproveLoanFee={handleApproveLoanFee}
        needsApproval={needsApproval}
        isDashboard={isDashboard}
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
