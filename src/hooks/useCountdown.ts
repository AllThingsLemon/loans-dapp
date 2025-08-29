import { useState, useEffect, useCallback, useRef } from 'react'

export interface CountdownData {
  days: number
  hours: number
  minutes: number
  seconds: number
  isOverdue: boolean
  totalSeconds: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface UseCountdownOptions {
  targetDate: Date
  onComplete?: () => void
  updateInterval?: number // milliseconds, default 1000
}

// Helper function to calculate countdown data
const calculateCountdownData = (target: Date): CountdownData => {
  const now = new Date()
  const timeDifference = target.getTime() - now.getTime()

  // If overdue (negative time difference)
  if (timeDifference <= 0) {
    const overdueDuration = Math.abs(timeDifference)
    const days = Math.floor(overdueDuration / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (overdueDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )
    const minutes = Math.floor(
      (overdueDuration % (1000 * 60 * 60)) / (1000 * 60)
    )
    const seconds = Math.floor((overdueDuration % (1000 * 60)) / 1000)

    return {
      days,
      hours,
      minutes,
      seconds,
      isOverdue: true,
      totalSeconds: Math.floor(overdueDuration / 1000),
      urgencyLevel: 'critical'
    }
  }

  // Calculate remaining time components
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  )
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000)
  const totalSeconds = Math.floor(timeDifference / 1000)

  // Determine urgency level based on remaining time
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  if (totalSeconds <= 3600) {
    // 1 hour
    urgencyLevel = 'critical'
  } else if (totalSeconds <= 86400) {
    // 1 day
    urgencyLevel = 'high'
  } else if (totalSeconds <= 259200) {
    // 3 days
    urgencyLevel = 'medium'
  } else {
    urgencyLevel = 'low'
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isOverdue: false,
    totalSeconds,
    urgencyLevel
  }
}

export const useCountdown = ({
  targetDate,
  onComplete,
  updateInterval = 1000
}: UseCountdownOptions) => {
  const [countdown, setCountdown] = useState<CountdownData>(() =>
    calculateCountdownData(targetDate)
  )
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  // Update the onComplete callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const calculateCountdown = useCallback((target: Date): CountdownData => {
    return calculateCountdownData(target)
  }, [])

  const updateCountdown = useCallback(() => {
    const newCountdown = calculateCountdown(targetDate)
    setCountdown((prevCountdown) => {
      // Check if we just hit zero (transition from positive to zero/negative)
      if (
        !prevCountdown.isOverdue &&
        newCountdown.totalSeconds <= 0 &&
        onCompleteRef.current
      ) {
        onCompleteRef.current()
      }
      return newCountdown
    })
  }, [targetDate, calculateCountdown])

  // Start the countdown timer
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(updateCountdown, updateInterval)

    // Update immediately
    updateCountdown()

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [updateCountdown, updateInterval])

  // Format countdown for display
  const formatCountdown = useCallback(
    (options?: {
      showDays?: boolean
      showHours?: boolean
      showMinutes?: boolean
      showSeconds?: boolean
      compact?: boolean
    }): string => {
      const {
        showDays = true,
        showHours = true,
        showMinutes = true,
        showSeconds = true,
        compact = false
      } = options || {}

      const parts: string[] = []

      if (showDays && countdown.days > 0) {
        parts.push(
          `${countdown.days}${compact ? 'd' : ` day${countdown.days !== 1 ? 's' : ''}`}`
        )
      }

      if (showHours && (countdown.hours > 0 || parts.length > 0)) {
        parts.push(
          `${countdown.hours}${compact ? 'h' : ` hour${countdown.hours !== 1 ? 's' : ''}`}`
        )
      }

      if (showMinutes && (countdown.minutes > 0 || parts.length > 0)) {
        parts.push(
          `${countdown.minutes}${compact ? 'm' : ` minute${countdown.minutes !== 1 ? 's' : ''}`}`
        )
      }

      if (showSeconds && (countdown.seconds > 0 || parts.length === 0)) {
        parts.push(
          `${countdown.seconds}${compact ? 's' : ` second${countdown.seconds !== 1 ? 's' : ''}`}`
        )
      }

      return parts.join(compact ? ' ' : ', ')
    },
    [countdown]
  )

  // Get urgency-based styles
  const getUrgencyStyles = useCallback(() => {
    switch (countdown.urgencyLevel) {
      case 'critical':
        return {
          color: 'text-red-600 dark:text-red-400',
          background: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800'
        }
      case 'high':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          background: 'bg-orange-50 dark:bg-orange-950/20',
          border: 'border-orange-200 dark:border-orange-800'
        }
      case 'medium':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          background: 'bg-yellow-50 dark:bg-yellow-950/20',
          border: 'border-yellow-200 dark:border-yellow-800'
        }
      default:
        return {
          color: 'text-green-600 dark:text-green-400',
          background: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800'
        }
    }
  }, [countdown.urgencyLevel])

  return {
    countdown,
    formatCountdown,
    getUrgencyStyles,
    isActive: intervalRef.current !== null
  }
}
