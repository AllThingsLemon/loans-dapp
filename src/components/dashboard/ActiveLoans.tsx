'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { useLoans } from '@/src/hooks/useLoans'
import { useToast } from '@/src/hooks/use-toast'
import { CreditCard, Calendar, DollarSign, Percent, Clock, AlertCircle } from 'lucide-react'

interface ActiveLoansProps {
  compact?: boolean
}

export function ActiveLoans({ compact = false }: ActiveLoansProps) {
  const { activeLoans, payLoan, isLoading } = useLoans()
  const { toast } = useToast()
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const handlePayment = async (loanId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      })
      return
    }

    try {
      await payLoan(loanId, parseFloat(paymentAmount))
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully!',
      })
      setPaymentAmount('')
      setSelectedLoan(null)
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPaymentProgress = (loan: any) => {
    const totalPaid = loan.totalPaid
    const totalAmount = loan.amount
    return (totalPaid / totalAmount) * 100
  }

  if (activeLoans.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Active Loans</h3>
        <p className="text-sm text-muted-foreground">
          You don't have any active loans at the moment.
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {activeLoans.slice(0, 3).map((loan) => (
          <div key={loan.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">{loan.amount.toFixed(2)} LEMX</p>
                <p className="text-sm text-muted-foreground">
                  {loan.interestRate}% • {loan.term} months
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{loan.remainingBalance.toFixed(2)} LEMX</p>
              <p className="text-sm text-muted-foreground">remaining</p>
            </div>
          </div>
        ))}
        {activeLoans.length > 3 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            ... and {activeLoans.length - 3} more active loans
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeLoans.map((loan) => {
        const daysUntilDue = getDaysUntilDue(loan.dueDate)
        const progress = getPaymentProgress(loan)
        const isOverdue = daysUntilDue < 0

        return (
          <Card key={loan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">Loan #{loan.id}</CardTitle>
                    <CardDescription>
                      {loan.lender ? `Lender: ${loan.lender}` : 'Direct loan'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isOverdue ? "destructive" : "default"}>
                    {isOverdue ? 'Overdue' : 'Active'}
                  </Badge>
                  {loan.collateral && (
                    <Badge variant={loan.collateral === 'LEMX' ? "yellow" : "outline"}>{loan.collateral}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Loan Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Original Amount
                  </p>
                  <p className="font-medium">{loan.amount.toFixed(2)} LEMX</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Interest Rate
                  </p>
                  <p className="font-medium">{loan.interestRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due Date
                  </p>
                  <p className="font-medium">{loan.dueDate.toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isOverdue ? 'Days Overdue' : 'Days Until Due'}
                  </p>
                  <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {Math.abs(daysUntilDue)} days
                  </p>
                </div>
              </div>

              {/* Payment Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Payment Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Paid: {loan.totalPaid.toFixed(2)} LEMX</span>
                  <span>Remaining: {loan.remainingBalance.toFixed(2)} LEMX</span>
                </div>
              </div>

              {/* Payment Action */}
              <div className="flex items-center gap-3 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedLoan(loan.id)}
                    >
                      Make Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make Payment</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to pay towards loan #{loan.id}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-amount">Payment Amount (LEMX)</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Remaining balance: {loan.remainingBalance.toFixed(2)} LEMX</p>
                        <p>Minimum payment: 0.01 LEMX</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handlePayment(loan.id)}
                          disabled={isLoading || !paymentAmount}
                          className="flex-1"
                        >
                          {isLoading ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setPaymentAmount('')
                            setSelectedLoan(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {isOverdue && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Payment overdue</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 