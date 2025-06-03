import React, { useState } from 'react'
import { Address, zeroAddress } from 'viem'

import { Card, CardContent, CardFooter } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { PaymentToken, usePaymentTokens } from '@/src/hooks/usePaymentTokens'
import { useSearchParams } from 'next/navigation'
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '@/src/components/ui/Select'
import { formatAtomicUnits } from '@/src/utils/format'
import { usePaymentProcess } from '@/src/hooks/usePaymentProcess'
// import { useTokenPrice } from '@/src/hooks/useTokenPrice'

export const Payments = () => {
  const searchParams = useSearchParams()

  const orderId = searchParams.get('orderId') || ''
  const usdAmount = searchParams.get('usdAmount') || ''
  const receiverId = searchParams.get('receiverId') || ''
  const callbackURL = searchParams.get('callbackURL') || ''

  const paramsLoaded =
    orderId !== '' &&
    usdAmount !== '' &&
    receiverId !== '' &&
    callbackURL !== ''

  const { paymentTokens, paymentToken, setPaymentToken } = usePaymentTokens()
  const necessaryTokenAmounts =
    BigInt(paymentToken?.price || '0') * BigInt(usdAmount || '0')

  const {
    isTokenApproved,
    isApproveLoading,
    approveTokens,
    isProcessLoading,
    processPayment
  } = usePaymentProcess(
    paramsLoaded,
    paymentToken,
    necessaryTokenAmounts,
    orderId,
    usdAmount,
    receiverId
  )

  return (
    <Card>
      {paramsLoaded ? (
        <>
          <CardContent className="mt-5">
            <div className="mt-5 space-y-2">
              <Label htmlFor="process-usd-amount">
                Select Payment PaymentToken
              </Label>
              <div className="flex space-x-2 items-center">
                {paymentToken && paymentToken.symbol && (
                  <Select
                    onValueChange={(value: string) => {
                      const selectedTokenIndex = paymentTokens.findIndex(
                        (t) => t.symbol === value
                      )
                      setPaymentToken(paymentTokens[selectedTokenIndex])
                    }}
                    defaultValue={paymentToken.symbol}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {paymentTokens.map((token: PaymentToken) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <Label htmlFor="process-usd-amount">$USD amount to process</Label>
              <div className="flex space-x-2 items-center">
                <Input
                  id="process-usd-amount"
                  type="number"
                  placeholder="Enter $USD amount to process"
                  value={usdAmount}
                  disabled
                />
              </div>
            </div>

            <div className="mt-5 space-y-2 mb-5">
              <Label htmlFor="process-order-id">Order ID</Label>
              <div>
                <Input
                  id="process-order-id"
                  type="number"
                  placeholder="Enter order ID"
                  value={orderId}
                  disabled
                />
              </div>
            </div>
            {paymentToken && paymentToken.symbol && (
              <div className="flex items-center justify-between">
                <div>
                  Your {paymentToken.symbol} Balance:{' '}
                  {formatAtomicUnits(
                    BigInt(paymentToken.balance),
                    BigInt(paymentToken.decimals),
                    paymentToken.symbol
                  )}
                </div>

                <div>
                  Consuming {paymentToken.symbol} Balance:{' '}
                  {formatAtomicUnits(
                    BigInt(paymentToken.balance),
                    BigInt(paymentToken.decimals),
                    paymentToken.symbol
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col">
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isTokenApproved || !paymentToken}
                onClick={approveTokens}
              >
                {isApproveLoading ? 'Approving' : 'Approve'}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={!isTokenApproved || !paymentToken}
                onClick={processPayment}
              >
                {isProcessLoading ? 'Confirming' : 'Confirm'}
              </Button>
            </div>
          </CardFooter>
        </>
      ) : (
        <p className="text-center p-5">Invalid Params</p>
      )}
    </Card>
  )
}

export default Payments
