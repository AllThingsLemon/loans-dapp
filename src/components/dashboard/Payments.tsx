import React, { useState } from 'react'
import { Bar, BarChart, Rectangle, XAxis, YAxis, Cell } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
// import {
//   Text,
//   Select
// } from '@chakra-ui/react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Select } from "@radix-ui/react-select";
import { Button } from '@/src/components/ui/button'

import { PaymentToken, usePaymentTokens } from '@/src/hooks/usePaymentTokens'

export const Payments = () => {
  const {
    paymentTokens,
    paymentToken,
    setPaymentToken
  } = usePaymentTokens()

  const countries = { france: "🇫🇷", "united-kingdom": "🇬🇧", spain: "🇪🇸" };
  const [usdAmount, setUSDAmount] = useState('')
  const [orderId, setOrderId] = useState('')

  return (
    <Card>
      {/* <CardHeader className="space-y-0 pb-0">
        <div className="flex">
          <CardDescription>Cloudx</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {Number(totalCloudxNFTMinted).toLocaleString()}
              100
            </CardTitle>
        </div>
      </CardHeader> */}

      <CardContent>
        <div  className='mt-2 space-y-2'>
          <Label htmlFor="process-usd-amount" >$USD amount to process</Label>
          <div className="flex space-x-2 items-center">
            <Input
              id="process-usd-amount"
              type="number"
              placeholder="Enter $USD amount to process"
              value={usdAmount}
              onChange={(e) => setUSDAmount(e.target.value)}
              min="1"
              max="100"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUSDAmount("100")
              }}
            >
              Max
            </Button>
          </div>
        </div>

        <div  className='mt-2 space-y-2'>
          <Label htmlFor="process-order-id">Order ID</Label>
          <div>
            <Input
              id="process-order-id"
              type="number"
              placeholder="Enter order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              min="1"
              max="100"
            />
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex-col">
        {/* <CardDescription>
          In the last day, there were{' '}
        </CardDescription> */}
        <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {}}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              disabled={
                false
              }
            >
              Approve
              {/* {props.isApproved
                ? props.isMinting
                  ? 'Minting...'
                  : 'Mint'
                : props.isApproving
                  ? 'Approving...'
                  : 'Approve'} */}
            </Button>
          </div>
      </CardFooter>
    </Card>
  )
}

export default Payments
