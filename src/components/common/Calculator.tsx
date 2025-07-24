import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/Select'
import { useLoanConfig } from '../../hooks/loans/useLoanConfig'
import { useLoanOperations } from '../../hooks/loans/useLoanOperations'
import { formatUnits, parseUnits } from 'viem'
import { Plus, AlertTriangle } from 'lucide-react'
import { useContractTokenConfiguration } from '../../hooks/useContractTokenConfiguration'
import { useToast } from '../../hooks/use-toast'
import {
  parsePercentage,
  formatPercentage,
  formatTokenAmount,
  formatDurationRange
} from '../../utils/decimals'

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

  // Get current interest rate from selected config
  const contractApr = selectedConfig?.interestApr

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
    error: operationError
  } = useLoanOperations({ 
    loanRequest, 
    selectedLtvOption,
    onDataChange: onLoanCreated
  })

  // Calculate loan details using contract values
  const calculation = useMemo(() => {
    if (!contractApr || !selectedLtvOption || !selectedConfig || !tokenConfig) {
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

    // Convert contract APR from precision scaled to percentage
    const aprPercentage = Number(
      formatPercentage(contractApr, tokenConfig.interestRateDecimals)
    )

    // Get required collateral from simulation (in wei)
    const lemonRequired = requiredCollateral
      ? Number(formatTokenAmount(requiredCollateral, tokenConfig?.nativeToken.decimals || 18)) // Native token decimals
      : 0

    // Convert origination fee from wei to LMLN amount
    const originationFeeLmln = Number(
      formatTokenAmount(selectedLtvOption.fee, tokenConfig.feeToken.decimals)
    )

    // Calculate monthly interest payment
    const monthlyRate = aprPercentage / 100 / 12
    const monthlyPayment = loanAmount * monthlyRate

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
      isValid: !isSimulating && !!requiredCollateral && !hasInsufficientLmln,
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
    contractApr,
    selectedLtvOption,
    requiredCollateral,
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
      await createLoan(loanRequest)
      setIsDialogOpen(false)
      toast({
        title: 'Loan Created Successfully',
        description: 'Your loan has been created and will appear in your active loans!'
      })
    } catch (error) {
      // Error is handled by useLoanOperations
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
      <Card
        className={`${!isDashboard ? 'animate-slide-in-left bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-700 text-white' : ''}`}
      >
        <CardHeader>
          <CardTitle className={`${!isDashboard ? 'text-2xl text-white' : ''}`}>
            Loan Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div>
            <label
              className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
            >
              💰 How much do you need?
            </label>
            <div className='relative'>
              <span
                className={`absolute left-3 top-3 ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                $
              </span>
              <Input
                type='number'
                value={loanAmount === 0 ? '' : loanAmount}
                onChange={(e) => {
                  const value = e.target.value
                  // Handle empty input
                  if (value === '') {
                    setLoanAmount(0)
                    return
                  }

                  const numValue = Number(value)
                  const maxAmount = loanConfig?.minLoanAmount
                    ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)) * 100
                    : 100000 // Allow reasonable max
                  // Allow typing (don't enforce min while typing, only enforce max)
                  if (numValue <= maxAmount) {
                    setLoanAmount(numValue)
                  }
                }}
                onBlur={(e) => {
                  // Ensure we have a valid number when user leaves the field
                  const value = e.target.value
                  const minAmount = loanConfig?.minLoanAmount
                    ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18))
                    : 1000
                  if (value === '' || Number(value) < minAmount) {
                    setLoanAmount(minAmount) // Set to minimum if empty or below min
                  }
                }}
                min={
                  loanConfig?.minLoanAmount
                    ? formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)
                    : '1000'
                }
                max={
                  loanConfig?.minLoanAmount
                    ? Number(formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)) * 100
                    : 100000
                }
                className={`pl-8 text-lg ${!isDashboard ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400' : ''}`}
                placeholder='10000'
              />
            </div>
            <div
              className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
            >
              {tokenConfig?.loanToken.symbol || 'Token'} - $
              {loanConfig?.minLoanAmount
                ? formatUnits(loanConfig.minLoanAmount, tokenConfig?.loanToken.decimals || 18)
                : '1000'}{' '}
              minimum loan
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
            >
              📅 Loan Duration
            </label>
            <Select
              value={selectedConfigIndex.toString()}
              onValueChange={(value) => setSelectedConfigIndex(Number(value))}
            >
              <SelectTrigger
                className={`w-full ${!isDashboard ? 'bg-white/10 border-white/20 text-white' : ''}`}
              >
                <SelectValue placeholder='Select loan duration' />
              </SelectTrigger>
              <SelectContent>
                {interestAprConfigs.length === 0 ? (
                  <SelectItem value='loading' disabled>
                    {configLoading
                      ? 'Loading durations...'
                      : 'No durations available'}
                  </SelectItem>
                ) : (
                  interestAprConfigs.map((config, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {formatDurationRange(
                        config.minDuration,
                        config.maxDuration
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedConfig && (
              <div
                className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
              >
                APR:{' '}
                {Number(
                  formatPercentage(
                    selectedConfig.interestApr,
                    tokenConfig?.interestRateDecimals || 6
                  )
                ).toFixed(1)}
                %
              </div>
            )}
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}
            >
              ⚖️ Loan-to-Value Ratio: {ltv}%
            </label>
            <input
              type='range'
              min='20'
              max='60'
              step='10'
              value={ltv}
              onChange={(e) => setLtv(Number(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
            />
            <div
              className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}
            >
              <span>20% (Safer)</span>
              <span>60% (Max)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${!isDashboard ? 'animate-scale-in bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-700 text-white' : ''}`}
      >
        <CardHeader>
          <CardTitle className={`${!isDashboard ? 'text-2xl text-white' : ''}`}>
            Loan Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div
            className={`${!isDashboard ? 'bg-white/10 backdrop-blur-sm' : 'bg-muted'} rounded-lg p-4 border ${!isDashboard ? 'border-white/20' : ''}`}
          >
            <div className='flex justify-between items-center mb-4'>
              <span
                className={`text-lg font-semibold ${!isDashboard ? 'text-gray-300' : ''}`}
              >
                Loan Amount
              </span>
              <span
                className={`text-2xl font-bold ${!isDashboard ? 'text-white' : ''}`}
              >
                ${calculation.loanAmount.toLocaleString()} {tokenConfig?.loanToken.symbol || 'Token'}
              </span>
            </div>

            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  LEMON Required
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
                >
                  {calculation.lemonRequired > 0
                    ? `${calculation.lemonRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LEMON`
                    : calculation.priceError || 'Calculating...'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  Origination Fee - payable in {tokenConfig?.feeToken.symbol || 'Token'}
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''} ${hasInsufficientLmln ? 'text-red-500' : ''}`}
                >
                  {calculation.originationFeeLmln?.toFixed(2) || '0'} {tokenConfig?.feeToken.symbol || 'Token'}
                  {hasInsufficientLmln && ' ⚠️'}
                </span>
              </div>
              {hasInsufficientLmln && (
                <div className='text-red-500 text-xs mt-1'>
                  Balance:{' '}
                  {userLmlnBalance && tokenConfig
                    ? Number(
                        formatTokenAmount(
                          userLmlnBalance,
                          tokenConfig.feeToken.decimals
                        )
                      ).toFixed(2)
                    : '0'}{' '}
                  {tokenConfig?.feeToken.symbol || 'Token'}
                </div>
              )}
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  LTV Ratio
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-yellow-400' : 'text-yellow-600'}`}
                >
                  {calculation.ltv}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  Estimated APR
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-yellow-400' : 'text-yellow-600'}`}
                >
                  {calculation.apr.toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  Monthly Payment
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
                >
                  ${calculation.monthlyPayment.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  Balloon Payment
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
                >
                  $
                  {calculation.balloonPayment.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              <div className='flex justify-between'>
                <span
                  className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
                >
                  Loan Term
                </span>
                <span
                  className={`font-medium ${!isDashboard ? 'text-white' : ''}`}
                >
                  {calculation.durationDisplay}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`text-center text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}
          >
            ✓ No credit check required • ✓ Instant approval
          </div>

          {isDashboard && (
            <div className='text-center mt-6'>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold py-3 px-8 text-lg'
                    disabled={!calculation.isValid}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Create New Loan
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-yellow-600' />
                      Confirm Loan Creation
                    </DialogTitle>
                    <DialogDescription>
                      Please review your loan details before proceeding. This
                      transaction will require your approval.
                    </DialogDescription>
                  </DialogHeader>

                  <div className='space-y-4 py-4'>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='font-medium'>Loan Amount:</span>
                        <span>
                          ${calculation.loanAmount.toLocaleString()} {tokenConfig?.loanToken.symbol || 'Token'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='font-medium'>Loan Term:</span>
                        <span>{calculation.durationDisplay}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='font-medium'>LTV Ratio:</span>
                        <span>{calculation.ltv}%</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='font-medium'>Estimated APR:</span>
                        <span>{calculation.apr.toFixed(1)}%</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='font-medium'>
                          Collateral Required:
                        </span>
                        <span>
                          {calculation.lemonRequired.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          LEMON
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='font-medium'>Origination Fee:</span>
                        <span>
                          {calculation.originationFeeLmln?.toFixed(2) || '0'}{' '}
                          {tokenConfig?.feeToken.symbol || 'Token'}
                        </span>
                      </div>
                    </div>

                    {operationError && (
                      <div className='text-red-600 text-sm p-2 bg-red-50 rounded'>
                        {operationError.message}
                      </div>
                    )}
                  </div>

                  <DialogFooter className='flex gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isTransacting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateLoan}
                      disabled={isTransacting || !calculation.isValid}
                      className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black'
                    >
                      {isTransacting ? 'Creating Loan...' : 'Confirm & Create Loan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
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
