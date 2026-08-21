'use client'

import { useEffect } from 'react'
import { useToast } from '@/src/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from '@/src/components/ui/toast'

/**
 * Floor on how long a toast stays up. Deposit results carry a couple of
 * sentences — the referral commission outcome among them — and Radix's 5s
 * default was closing them mid-read.
 */
const MIN_VISIBLE_MS = 5000

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Identity of the currently-open set, so the effect restarts when a new toast
  // replaces an old one (TOAST_LIMIT is 1, so that is the normal case).
  const openIds = toasts
    .filter((t) => t.open !== false)
    .map((t) => t.id)
    .join(',')

  useEffect(() => {
    if (!openIds) return

    // Dismiss at max(shown + 5s, first click) — a click before the floor still
    // waits it out, a click after it closes immediately, and with no click at
    // all the toast stays put rather than vanishing unread.
    const shownAt = Date.now()
    let dismissTimer: number | undefined

    const onPointerDown = () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      const remaining = MIN_VISIBLE_MS - (Date.now() - shownAt)
      dismissTimer = window.setTimeout(
        () => dismiss(),
        remaining > 0 ? remaining : 0
      )
    }

    // Attached on the next tick: the click that produced this toast (Confirm
    // Deposit, say) is still propagating, and would otherwise dismiss it
    // instantly.
    const attachTimer = window.setTimeout(
      () => document.addEventListener('pointerdown', onPointerDown, true),
      0
    )

    return () => {
      window.clearTimeout(attachTimer)
      if (dismissTimer !== undefined) window.clearTimeout(dismissTimer)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [openIds, dismiss])

  return (
    // Infinity is a documented Radix escape hatch (`duration || duration ===
    // Infinity`) that disables its auto-close, handing dismissal to the effect
    // above. The X button and swipe still work as before.
    <ToastProvider duration={Infinity}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className='grid gap-1'>
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
