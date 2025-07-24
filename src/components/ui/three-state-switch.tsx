'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type SwitchState = 'left' | 'middle' | 'right'

interface ThreeStateSwitchProps {
  state: SwitchState
  onChange: (state: SwitchState) => void
  className?: string
  disabled?: boolean
}

export const ThreeStateSwitch = React.forwardRef<
  HTMLButtonElement,
  ThreeStateSwitchProps
>(({ state, onChange, className, disabled = false, ...props }, ref) => {
  const handleClick = () => {
    if (disabled) return

    const nextState: Record<SwitchState, SwitchState> = {
      left: 'middle',
      middle: 'right',
      right: 'left'
    }

    onChange(nextState[state])
  }

  const positions = {
    left: '2px',
    middle: 'calc(50% - 8px)',
    right: 'calc(100% - 18px)'
  }

  return (
    <button
      type='button'
      role='switch'
      aria-checked={state === 'right'}
      data-state={state}
      disabled={disabled}
      className={cn(
        'inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 relative',
        className
      )}
      onClick={handleClick}
      ref={ref}
      {...props}
    >
      <span
        style={{
          position: 'absolute',
          left: positions[state],
          transition: 'left 0.2s ease'
        }}
        className='block h-4 w-4 rounded-full bg-background shadow-lg ring-0'
      />
    </button>
  )
})

ThreeStateSwitch.displayName = 'ThreeStateSwitch'
