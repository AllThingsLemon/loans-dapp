'use client'
import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Post-transaction refresh, WITHOUT blocking the caller.
 *
 * `invalidateQueries()` resolves only after every active refetch has settled,
 * so a single stalled or endlessly-retrying read makes an await on it hang
 * forever. That is what left the deposit confirm modal spinning on a
 * transaction that had already succeeded (e02ed34) — and the loan modals block
 * dismissal mid-tx, so a hang there traps the user outright. The UI re-renders
 * as each query settles regardless, so nothing is gained by waiting.
 * `liquidity-refresh.test.ts` pins the mechanism.
 *
 * One call is enough: react-query's unfiltered `invalidateQueries()` both
 * marks everything stale AND refetches the active queries, so no follow-up
 * `refetchQueries` is issued (one used to be, doubling every active read's
 * RPC after each transaction).
 */
export function useBackgroundRefresh() {
  const queryClient = useQueryClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries()
  }, [queryClient])

  /**
   * Let the node's state settle after the block, then refresh in the
   * background. Trailing-edge coalesced: operations that land within the
   * window share a single refresh instead of stacking one each.
   */
  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      invalidateAll()
    }, 3000)
  }, [invalidateAll])

  return { invalidateAll, scheduleRefresh }
}
