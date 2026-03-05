'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent } from '@/src/components/ui/card'
import { Droplets } from 'lucide-react'

export function DisconnectedLiquidity() {
  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='max-w-md w-full'>
        <CardContent className='flex flex-col items-center text-center p-8 space-y-6'>
          <Droplets className='h-16 w-16 text-yellow-500' />
          <div className='space-y-2'>
            <h2 className='text-2xl font-bold text-gray-900'>
              Become a LemLoans Liquidity Provider
            </h2>
            <p className='text-muted-foreground'>
              Connect your wallet to deposit liquidity, earn interest from borrower
              payments, and manage your position in the lending pool.
            </p>
          </div>
          <ConnectButton />
        </CardContent>
      </Card>
    </div>
  )
}
