import React, { useEffect } from 'react'
import { parseEther } from 'viem'
import { useRouter } from 'next/navigation'

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

  const parsedUSDAmount = parseEther(usdAmount)

  const {
    paymentId,
    paymentTokens,
    paymentToken,
    setPaymentToken,
    refetchQueriesAfterProcess,
    consumingTokenAmounts
  } = usePaymentTokens(parsedUSDAmount, BigInt(orderId))

  const {
    processTxHash,
    isTokenApproved,
    isApproveLoading,
    increaseAllowance,
    isProcessLoading,
    processButtonClicked,
    approveButtonClicked
  } = usePaymentProcess(
    paramsLoaded,
    paymentToken,
    consumingTokenAmounts,
    orderId,
    parsedUSDAmount,
    receiverId,
    refetchQueriesAfterProcess
  )

  const router = useRouter()
  const orderCompleted =
    paymentId !==
    '0x0000000000000000000000000000000000000000000000000000000000000000'

  useEffect(() => {
    if (paymentId && orderCompleted) {
      router.push(
        `${callbackURL}?paymentId=${paymentId}&txhash=${processTxHash}`
      )
    }
  }, [paymentId, processTxHash, callbackURL, router, orderCompleted])

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
                    BigInt(paymentToken?.tokenBalance),
                    BigInt(paymentToken?.tokenDecimals),
                    paymentToken.symbol
                  )}
                </div>

                <div>
                  Consuming {paymentToken.symbol} Balance:{' '}
                  {formatAtomicUnits(
                    BigInt(consumingTokenAmounts),
                    BigInt(paymentToken.tokenDecimals),
                    paymentToken.symbol
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col">
            {paymentToken && paymentToken.symbol && (
              <div className="flex space-x-4">
                {BigInt(paymentToken?.tokenBalance) >= consumingTokenAmounts ? (
                  <>
                    {!paymentToken.isNative && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={
                          isTokenApproved ||
                          !paymentToken ||
                          !increaseAllowance ||
                          orderCompleted
                        }
                        onClick={approveButtonClicked}
                      >
                        {isApproveLoading ? 'Approving' : 'Approve'}
                      </Button>
                    )}

                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={
                        !isTokenApproved || !paymentToken || orderCompleted
                      }
                      onClick={processButtonClicked}
                    >
                      {isProcessLoading ? 'Confirming' : 'Confirm'}
                    </Button>
                  </>
                ) : (
                  <p className="text-center p-5">
                    You have not enough token balance. <br />
                    Please prepare more tokens to process payment.
                  </p>
                )}
              </div>
            )}
          </CardFooter>
        </>
      ) : (
        <p className="text-center p-5">Invalid Params</p>
      )}
    </Card>
  )
}

export default Payments
