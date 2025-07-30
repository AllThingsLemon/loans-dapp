'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useCountdown } from '@/src/hooks/useCountdown'
import { Clock, AlertCircle } from 'lucide-react'

interface CountdownTimerProps {
  targetDate: Date
  onComplete?: () => void
  className?: string
  showIcon?: boolean
  compact?: boolean
  showSeconds?: boolean
  animate?: boolean
}

export function CountdownTimer({
  targetDate,
  onComplete,
  className,
  showIcon = true,
  compact = false,
  showSeconds = true,
  animate = true
}: CountdownTimerProps) {
  const { countdown, formatCountdown, getUrgencyStyles } = useCountdown({
    targetDate,
    onComplete
  })

  const urgencyStyles = getUrgencyStyles()

  const formatTime = () => {
    if (compact) {
      return formatCountdown({
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: showSeconds,
        compact: true
      })
    }

    // Full format with units
    const parts: string[] = []

    if (countdown.days > 0) {
      parts.push(`${countdown.days} day${countdown.days !== 1 ? 's' : ''}`)
    }

    if (countdown.hours > 0 || countdown.days > 0) {
      parts.push(`${countdown.hours} hour${countdown.hours !== 1 ? 's' : ''}`)
    }

    if (countdown.minutes > 0 || countdown.hours > 0 || countdown.days > 0) {
      parts.push(
        `${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''}`
      )
    }

    if (showSeconds && (countdown.seconds > 0 || parts.length === 0)) {
      parts.push(
        `${countdown.seconds} second${countdown.seconds !== 1 ? 's' : ''}`
      )
    }

    return parts.join(', ')
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <div className='flex-shrink-0'>
          {countdown.isOverdue ? (
            <AlertCircle className={cn('h-4 w-4', urgencyStyles.color)} />
          ) : (
            <Clock className={cn('h-4 w-4', urgencyStyles.color)} />
          )}
        </div>
      )}

      <div className='flex flex-col'>
        <span
          className={cn(
            'font-medium transition-colors duration-300',
            urgencyStyles.color
          )}
        >
          {countdown.isOverdue ? 'Overdue by ' : ''}
          {formatTime()}
        </span>

        {!compact &&
          countdown.urgencyLevel === 'critical' &&
          !countdown.isOverdue && (
            <span className='text-xs text-muted-foreground'>
              Payment due soon!
            </span>
          )}

        {!compact && countdown.isOverdue && (
          <span className='text-xs text-red-500'>Payment still possible</span>
        )}
      </div>
    </div>
  )
}

// Variant for inline display in cards/tables
export function InlineCountdownTimer({
  targetDate,
  onComplete,
  className
}: {
  targetDate: Date
  onComplete?: () => void
  className?: string
}) {
  const { countdown, getUrgencyStyles } = useCountdown({
    targetDate,
    onComplete
  })

  const urgencyStyles = getUrgencyStyles()

  // Simple inline format: "2d 4h 30m" or "30m 15s"
  const formatInline = () => {
    if (countdown.days > 0) {
      return `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
    } else if (countdown.hours > 0) {
      return `${countdown.hours}h ${countdown.minutes}m`
    } else if (countdown.minutes > 0) {
      return `${countdown.minutes}m ${countdown.seconds}s`
    } else {
      return `${countdown.seconds}s`
    }
  }

  return (
    <span
      className={cn(
        'font-medium transition-colors duration-300',
        urgencyStyles.color,
        className
      )}
    >
      {countdown.isOverdue ? '-' : ''}
      {formatInline()}
    </span>
  )
}

// Variant with progress indicator
export function CountdownWithProgress({
  targetDate,
  originalDuration,
  onComplete,
  className
}: {
  targetDate: Date
  originalDuration: number // total duration in seconds
  onComplete?: () => void
  className?: string
}) {
  const { countdown, getUrgencyStyles } = useCountdown({
    targetDate,
    onComplete
  })

  const urgencyStyles = getUrgencyStyles()

  // Calculate progress percentage
  const progressPercentage = countdown.isOverdue
    ? 100
    : Math.max(
        0,
        Math.min(
          100,
          ((originalDuration - countdown.totalSeconds) / originalDuration) * 100
        )
      )

  return (
    <div className={cn('space-y-2', className)}>
      <CountdownTimer
        targetDate={targetDate}
        onComplete={onComplete}
        compact
        showIcon={false}
      />

      <div className='w-full bg-gray-200 rounded-full h-1.5'>
        <div
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            countdown.urgencyLevel === 'critical'
              ? 'bg-red-500'
              : countdown.urgencyLevel === 'high'
                ? 'bg-orange-500'
                : countdown.urgencyLevel === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}
