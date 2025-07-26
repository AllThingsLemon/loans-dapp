import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../components/ui/button'
import { useLoanConfig } from '../../hooks/loans/useLoanConfig'
import { useLoanOperations } from '../../hooks/loans/useLoanOperations'
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
import { handleContractError, isUserRejection, type ContractError } from '../../utils/errorHandling'

interface CalculatorSectionProps {
  isDashboard?: boolean
  onLoanCreated?: () => Promise<void>
}

const CalculatorSection = ({ isDashboard = false, onLoanCreated }: CalculatorSectionProps) => {
  const {
    loanConfig,
    ltvOptions,
    interestAprConfigs,
    isLoading: configLoading,
    error: configError
  } = useLoanConfig()

  // Get contract token configuration
  const { tokenConfig } = useContractTokenConfiguration()
  const { toast } = useToast()
  

  const [isDialogOpen, setIsDialogOpen] = useState(false)


  // Initialize with contract values when available
  const [loanAmount, setLoanAmount] = useState(0)
  const [selectedConfigIndex, setSelectedConfigIndex] = useState<number>(0)
  const [ltv, setLtv] = useState(0)

  // Set initial values from contract config
  useEffect(() => {
    if (loanConfig && loanConfig.minLoanAmount && loanAmount === 0) {
      setLoanAmount(Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)))
    }
    if (ltvOptions.length > 0 && ltv === 0 && tokenConfig) {
      const ltvPercentage = Number(
        formatPercentage(ltvOptions[0].ltv, tokenConfig.ltvDecimals)
      )
      setLtv(ltvPercentage)
    }
  }, [loanConfig, ltvOptions, interestAprConfigs, loanAmount, ltv])


  // Get selected interest config
  const selectedConfig = useMemo(() => {
    if (!interestAprConfigs || interestAprConfigs.length === 0) return null
    return interestAprConfigs[selectedConfigIndex] || interestAprConfigs[0]
  }, [interestAprConfigs, selectedConfigIndex])

  // Use the midpoint of the selected duration range for calculations
  const selectedDuration = useMemo(() => {
    if (!selectedConfig) return 0n
    return (selectedConfig.minDuration + selectedConfig.maxDuration) / 2n
  }, [selectedConfig])

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
      loanAmount: parseUnits(loanAmount.toString(), tokenConfig.loanToken.decimals),
      duration: selectedDuration,
      ltv: parsePercentage(ltv.toString(), tokenConfig.ltvDecimals)
    }
    return request
  }, [loanAmount, selectedDuration, ltv])

  // Get origination fee for selected LTV
  const selectedLtvOption = useMemo(() => {
    if (!tokenConfig) return undefined

    // Convert ltv percentage to contract format using dynamic LTV precision
    const ltvInContractFormat = parsePercentage(
      ltv.toString(),
      tokenConfig.ltvDecimals
    )

    const found = ltvOptions.find(
      (option) => option.ltv === ltvInContractFormat
    )

    return found
  }, [ltvOptions, ltv, tokenConfig])

  const {
    createLoan,
    isTransacting,
    isSimulating,
    requiredCollateral,
    userLmlnBalance,
    hasInsufficientLmln,
    calculationData,
    error: rawOperationError
  } = useLoanOperations({ 
    loanRequest, 
    selectedLtvOption,
    onDataChange: onLoanCreated
  })

  // Filter out user rejections from operation errors - don't show them in UI
  const operationError = rawOperationError && !isUserRejection(rawOperationError) 
    ? rawOperationError 
    : null

  // Calculate loan details using contract calculation data
  const calculation = useMemo(() => {
    if (!selectedConfig || !tokenConfig) {
      return {
        loanAmount,
        loanDuration: selectedDuration,
        durationDisplay: selectedConfig
          ? formatDurationRange(
              selectedConfig.minDuration,
              selectedConfig.maxDuration
            )
          : 'Select duration',
        ltv,
        lemonRequired: 0,
        apr: 0,
        originationFeeLmln: 0,
        monthlyPayment: 0,
        balloonPayment: 0,
        isValid: false,
        priceError: 'Loading contract data...'
      }
    }

    // Use contract calculation data if available
    if (!calculationData) {
      return {
        loanAmount,
        loanDuration: selectedDuration,
        durationDisplay: formatDurationRange(
          selectedConfig.minDuration,
          selectedConfig.maxDuration
        ),
        ltv,
        lemonRequired: 0,
        apr: 0,
        originationFeeLmln: 0,
        monthlyPayment: 0,
        balloonPayment: 0,
        isValid: false,
        priceError: isSimulating ? 'Calculating collateral...' : 'Contract calculation not available'
      }
    }

    // Use contract-calculated values
    const aprPercentage = calculationData.interestApr
      ? Number(formatPercentage(calculationData.interestApr, tokenConfig.interestRateDecimals))
      : 0

    const lemonRequired = calculationData.collateralAmount
      ? Number(formatTokenAmount(calculationData.collateralAmount, tokenConfig.nativeToken.decimals))
      : 0

    const originationFeeLmln = calculationData.originationFee
      ? Number(formatTokenAmount(calculationData.originationFee, tokenConfig.feeToken.decimals))
      : 0

    // Use contract's firstLoanPayment for monthly payment
    const monthlyPayment = calculationData.firstLoanPayment
      ? Number(formatTokenAmount(calculationData.firstLoanPayment, tokenConfig.loanToken.decimals))
      : 0

    // Balloon payment is the principal
    const balloonPayment = loanAmount

    const result = {
      loanAmount,
      loanDuration: selectedDuration,
      durationDisplay: formatDurationRange(
        selectedConfig.minDuration,
        selectedConfig.maxDuration
      ),
      ltv,
      lemonRequired,
      apr: aprPercentage,
      originationFeeLmln,
      monthlyPayment,
      balloonPayment,
      isValid: !isSimulating && !!calculationData && !hasInsufficientLmln,
      priceError: isSimulating
        ? 'Calculating collateral...'
        : hasInsufficientLmln
          ? `Insufficient ${tokenConfig?.feeToken.symbol || 'Token'} balance. Need ${originationFeeLmln.toFixed(2)} ${tokenConfig?.feeToken.symbol || 'Token'}, have ${userLmlnBalance ? Number(formatTokenAmount(userLmlnBalance, tokenConfig.feeToken.decimals)).toFixed(2) : '0'} ${tokenConfig?.feeToken.symbol || 'Token'}`
          : undefined
    }

    return result
  }, [
    loanAmount,
    selectedDuration,
    selectedConfig,
    ltv,
    calculationData,
    isSimulating,
    tokenConfig,
    hasInsufficientLmln,
    userLmlnBalance
  ])

  // Handle loan creation
  const handleCreateLoan = async () => {
    if (!calculation.isValid || !loanRequest) {
      return
    }

    try {
      const result = await createLoan(loanRequest)
      
      // Only show success if we actually get a successful result
      if (result) {
        setIsDialogOpen(false)
        toast({
          title: 'Loan Created Successfully',
          description: 'Your loan has been created and will appear in your active loans!'
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
    }
  }

  // Show loading state while fetching contract config
  if (configLoading) {
    return (
      <div className='text-center py-8'>
        <p>Loading loan configuration...</p>
      </div>
    )
  }

  if (configError || !loanConfig) {
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
        selectedConfigIndex={selectedConfigIndex}
        setSelectedConfigIndex={setSelectedConfigIndex}
        ltv={ltv}
        setLtv={setLtv}
        loanConfig={loanConfig}
        tokenConfig={tokenConfig}
        interestAprConfigs={interestAprConfigs}
        selectedConfig={selectedConfig}
        configLoading={configLoading}
        isDashboard={isDashboard}
      />
      
      <LoanSummary
        calculation={calculation}
        tokenConfig={tokenConfig}
        hasInsufficientLmln={hasInsufficientLmln}
        userLmlnBalance={userLmlnBalance}
        operationError={operationError}
        isTransacting={isTransacting}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        handleCreateLoan={handleCreateLoan}
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
