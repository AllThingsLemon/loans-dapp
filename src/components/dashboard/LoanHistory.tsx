'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { useLoans } from '@/src/hooks/useLoans'
import { useContractTokenConfiguration } from '@/src/hooks/useContractTokenConfiguration'
import {
  formatAmountWithSymbol,
  formatDuration,
  formatTimestamp,
  getLoanStatusLabel,
  getLoanStatusVariant,
  truncateAddress
} from '@/src/utils/format'
import { formatPercentage } from '@/src/utils/decimals'
import {
  History,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Percent
} from 'lucide-react'

interface LoanHistoryProps {
  compact?: boolean
}

export function LoanHistory({ compact = false }: LoanHistoryProps) {
  const { loanHistory } = useLoans()
  const { tokenConfig } = useContractTokenConfiguration()

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: // paid
        return <CheckCircle className='h-4 w-4 text-green-600' />
      case 2: // defaulted
        return <XCircle className='h-4 w-4 text-red-600' />
      default:
        return <History className='h-4 w-4 text-muted-foreground' />
    }
  }

  const getStatusBadge = (status: number) => {
    return (
      <Badge variant={getLoanStatusVariant(status)}>
        {getLoanStatusLabel(status)}
      </Badge>
    )
  }

  if (loanHistory.length === 0) {
    return (
      <div className='text-center py-8'>
        <History className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
        <h3 className='text-lg font-medium text-muted-foreground mb-2'>
          No Loan History
        </h3>
        <p className='text-sm text-muted-foreground'>
          You don&apos;t have any completed loans yet.
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className='space-y-3'>
        {loanHistory
          .filter((loan) => loan)
          .slice(0, 3)
          .map((loan) => (
            <div
              key={loan.id}
              className='flex items-center justify-between p-3 bg-muted rounded-lg'
            >
              <div className='flex items-center gap-3'>
                {getStatusIcon(loan.status)}
                <div>
                  <p className='font-medium'>
                    {formatAmountWithSymbol(
                      loan.loanAmount,
                      tokenConfig?.loanToken.symbol || 'Token'
                    )}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {tokenConfig
                      ? formatPercentage(
                          loan.interestApr,
                          tokenConfig.aprDecimals
                        ) + '%'
                      : '...'}{' '}
                    • {formatDuration(loan.duration)}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='font-medium'>
                  {formatAmountWithSymbol(
                    loan.paidAmount,
                    tokenConfig?.nativeToken.symbol || 'Token'
                  )}
                </p>
                <p className='text-sm text-muted-foreground'>total paid</p>
              </div>
            </div>
          ))}
        {loanHistory.length > 3 && (
          <div className='text-center text-sm text-muted-foreground py-2'>
            ... and {loanHistory.length - 3} more completed loans
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {loanHistory
        .filter((loan) => loan)
        .map((loan) => (
          <Card key={loan.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  {getStatusIcon(loan.status)}
                  <div>
                    <CardTitle className='text-lg'>
                      Loan #{truncateAddress(loan.id)}
                    </CardTitle>
                    <CardDescription>
                      Protocol Loan • {getLoanStatusLabel(loan.status)}
                    </CardDescription>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {getStatusBadge(loan.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <DollarSign className='h-3 w-3' />
                    Original Amount
                  </p>
                  <p className='font-medium'>
                    {formatAmountWithSymbol(
                      loan.loanAmount,
                      tokenConfig?.loanToken.symbol || 'Token'
                    )}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Percent className='h-3 w-3' />
                    Interest Rate
                  </p>
                  <p className='font-medium'>
                    {tokenConfig
                      ? formatPercentage(
                          loan.interestApr,
                          tokenConfig.aprDecimals
                        ) + '%'
                      : '...'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    Start Date
                  </p>
                  <p className='font-medium'>
                    {formatTimestamp(loan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    Due Date
                  </p>
                  <p className='font-medium'>
                    {formatTimestamp(loan.dueTimestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className='mt-4 pt-4 border-t'>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Total Paid</p>
                    <p className='text-lg font-semibold text-green-600'>
                      {formatAmountWithSymbol(
                        loan.paidAmount,
                        tokenConfig?.nativeToken.symbol || 'Token'
                      )}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>
                      Remaining Balance
                    </p>
                    <p className='text-lg font-semibold'>
                      {formatAmountWithSymbol(
                        loan.remainingBalance,
                        tokenConfig?.loanToken.symbol || 'Token'
                      )}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>
                      Payment Completion
                    </p>
                    <p className='text-lg font-semibold'>
                      {loan.loanAmount + loan.interestAmount > 0n
                        ? Number(
                            ((loan.loanAmount +
                              loan.interestAmount -
                              loan.remainingBalance) *
                              100n) /
                              (loan.loanAmount + loan.interestAmount)
                          ).toFixed(1)
                        : '0'}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
