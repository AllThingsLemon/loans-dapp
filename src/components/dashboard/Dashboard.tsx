'use client'

import { useState, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { useLoans } from '@/src/hooks/useLoans'
import { useContractTokenConfiguration } from '@/src/hooks/useContractTokenConfiguration'
import { formatAmountWithSymbol } from '@/src/utils/format'
import CalculatorSection from '@/src/components/common/Calculator'
import { ActiveLoans } from '@/src/components/dashboard/ActiveLoans'
import { LoanHistory } from '@/src/components/dashboard/LoanHistory'
import { Web3ErrorBoundary } from '@/src/components/error/Web3ErrorBoundary'
import { PriceDataBanner } from '@/src/components/dashboard/PriceDataBanner'
import { Plus, History, CreditCard, Calculator, DollarSign } from 'lucide-react'

export function Dashboard() {
  const { activeLoans, loanHistory, isLoading, refetch } = useLoans()
  const { tokenConfig } = useContractTokenConfiguration()
  const [activeTab, setActiveTab] = useState('overview')
  const tabsRef = useRef<HTMLDivElement>(null)

  const totalActiveLoans = activeLoans.length
  const totalBorrowed = activeLoans.reduce(
    (sum, loan) => sum + loan.loanAmount,
    0n
  )
  const totalRemaining = activeLoans.reduce(
    (sum, loan) => sum + loan.remainingBalance,
    0n
  )
  const totalPaid = activeLoans.reduce(
    (sum, loan) => sum + (loan?.paidAmount || 0n),
    0n
  )

  const handlePaymentNavigation = () => {
    setActiveTab('active')
    // Scroll to tabs after a brief delay to ensure tab change is processed
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Loan Dashboard</h1>
          <p className='text-gray-600'>
            Manage your loans and lending activities
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Loans</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalActiveLoans}</div>
            <p className='text-xs text-muted-foreground'>
              {totalActiveLoans === 1 ? 'Active loan' : 'Active loans'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Borrowed
            </CardTitle>
            <Badge variant='yellow'>
              {tokenConfig?.loanToken.symbol || 'Loading...'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatAmountWithSymbol(
                totalBorrowed,
                tokenConfig?.loanToken.symbol || 'Token'
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total amount borrowed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Remaining Balance
            </CardTitle>
            <Badge variant='yellow'>
              {tokenConfig?.loanToken.symbol || 'Loading...'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatAmountWithSymbol(
                totalRemaining,
                tokenConfig?.loanToken.symbol || 'Token'
              )}
            </div>
            <p className='text-xs text-muted-foreground'>Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Paid</CardTitle>
            <Badge variant='yellow'>
              {tokenConfig?.loanToken.symbol || 'Loading...'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatAmountWithSymbol(
                totalPaid,
                tokenConfig?.loanToken.symbol || 'Token'
              )}
            </div>
            <p className='text-xs text-muted-foreground'>Total amount repaid</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment & Price Data Banners */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {totalActiveLoans > 0 && (
          /* Payment Banner - Left side (2 columns) */
          <Card className='col-span-1 md:col-span-2'>
            <CardContent className='flex items-center justify-between p-4'>
              <div className='flex items-center gap-3'>
                <DollarSign className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                <div>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    Ready to make a payment?
                  </h3>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>
                    You have {totalActiveLoans} active{' '}
                    {totalActiveLoans === 1 ? 'loan' : 'loans'} to manage
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handlePaymentNavigation}
                className='bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold'
              >
                Make a loan payment today
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Price Data Banner - Dynamic width based on active loans */}
        <div className={totalActiveLoans > 0 ? 'col-span-1 md:col-span-2' : 'col-span-1 md:col-span-4'}>
          <Web3ErrorBoundary>
            <PriceDataBanner />
          </Web3ErrorBoundary>
        </div>
      </div>

      {/* Loan Calculator Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calculator className='h-5 w-5' />
            Loan Calculator
          </CardTitle>
          <CardDescription>
            Calculate loan terms and create new loans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Web3ErrorBoundary>
            <CalculatorSection isDashboard={true} />
          </Web3ErrorBoundary>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        ref={tabsRef}
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='active'>Active Loans</TabsTrigger>
          <TabsTrigger value='history'>Loan History</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CreditCard className='h-5 w-5' />
                  Active Loans
                </CardTitle>
                <CardDescription>
                  Your currently active loans and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Web3ErrorBoundary>
                  <ActiveLoans compact />
                </Web3ErrorBoundary>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <History className='h-5 w-5' />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent loan transactions and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoanHistory compact />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='active' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>
                Manage your currently active loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Web3ErrorBoundary>
                <ActiveLoans />
              </Web3ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Loan History</CardTitle>
              <CardDescription>
                View your completed and defaulted loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Web3ErrorBoundary>
                <LoanHistory />
              </Web3ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
