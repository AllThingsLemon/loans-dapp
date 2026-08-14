import { describe, it, expect } from 'vitest'
import { QueryClient, QueryObserver } from '@tanstack/react-query'

/**
 * Regression guard for the production hang where the deposit confirm modal span
 * forever on a transaction that had already succeeded.
 *
 * Root cause: the post-transaction refresh was awaited. Both
 * `invalidateQueries()` and `refetchQueries({ type: 'active' })` resolve only
 * once EVERY active refetch has settled, so a single stalled read — a slow RPC,
 * an endlessly-retrying contract call — keeps the promise pending. The deposit
 * had confirmed and the caller was still waiting, `isProcessing` never cleared,
 * and the dialog blocks dismissal while processing.
 *
 * These tests pin the mechanism, so nobody re-introduces the await.
 */

/** Resolves to 'first' or 'timeout' depending on which wins. */
function raceAgainstTimer<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise.then(() => 'settled' as const),
    new Promise<'pending'>((resolve) => setTimeout(() => resolve('pending'), ms))
  ])
}

/** A query client holding one active query whose fetch never resolves. */
function clientWithStalledQuery() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } }
  })
  const observer = new QueryObserver(client, {
    queryKey: ['stalled'],
    queryFn: () => new Promise(() => {}) // never settles, like a hung RPC read
  })
  // Subscribing is what makes the query "active" — the state a mounted
  // useReadContract is in.
  const unsubscribe = observer.subscribe(() => {})
  return { client, unsubscribe }
}

describe('post-transaction refresh must not block the caller', () => {
  it('awaiting invalidateQueries() hangs when one active query never settles', async () => {
    const { client, unsubscribe } = clientWithStalledQuery()
    try {
      // This is the shape of the old code. It does not settle.
      const result = await raceAgainstTimer(client.invalidateQueries(), 300)
      expect(result).toBe('pending')
    } finally {
      unsubscribe()
      client.clear()
    }
  }, 10000)

  it('awaiting refetchQueries({ type: "active" }) hangs for the same reason', async () => {
    const { client, unsubscribe } = clientWithStalledQuery()
    try {
      const result = await raceAgainstTimer(
        client.refetchQueries({ type: 'active' }),
        300
      )
      expect(result).toBe('pending')
    } finally {
      unsubscribe()
      client.clear()
    }
  }, 10000)

  it('firing them without awaiting returns immediately, even with a stalled query', async () => {
    const { client, unsubscribe } = clientWithStalledQuery()
    try {
      // This is the shape of the fix: invalidateAll() returns synchronously.
      const invalidateAll = () => {
        void client.invalidateQueries()
        void client.refetchQueries({ type: 'active' })
      }
      const started = Date.now()
      invalidateAll()
      // The caller carries straight on, which is what lets the modal close.
      expect(Date.now() - started).toBeLessThan(100)
    } finally {
      unsubscribe()
      client.clear()
    }
  }, 10000)

  it('a healthy query still refetches when invalidated without awaiting', async () => {
    // The fix must not cost us the refresh itself — only the waiting.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } }
    })
    let fetches = 0
    const observer = new QueryObserver(client, {
      queryKey: ['healthy'],
      queryFn: async () => {
        fetches += 1
        return fetches
      },
      staleTime: 0
    })
    const unsubscribe = observer.subscribe(() => {})
    try {
      await client.refetchQueries({ type: 'active' })
      const before = fetches
      void client.invalidateQueries()
      await new Promise((r) => setTimeout(r, 150))
      expect(fetches).toBeGreaterThan(before)
    } finally {
      unsubscribe()
      client.clear()
    }
  }, 10000)
})
