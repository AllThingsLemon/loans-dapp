import Link from 'next/link'
import * as React from 'react'
import { Progress } from '@/src/components/ui/progress'

export default function NotFound() {
  const progress = 55

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-dark p-8">
      <div className="max-w-2xl w-full text-center space-y-8 mt-24">
        <h2 className="text-6xl font-bold text-white">Coming Soon</h2>
        <p className="text-2xl text-white">
          The page you are looking for does not exist... yet!
        </p>

        {/* Progress bar indicating the completion status */}
        <div className="w-full pt-12">
          <Progress value={progress} className="w-full" />
          <p className="text-center text-white mt-2 text-xl">55% complete</p>
        </div>
      </div>
    </div>
  )
}
