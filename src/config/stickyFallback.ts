import {
  createTransport,
  shouldThrow,
  type EIP1193RequestFn,
  type Transport
} from 'viem'

/** How long a later transport keeps the lead before the first is retried. */
export const RECHECK_MS = 5 * 60_000

/**
 * viem's fallback(), except each request starts at the transport that last
 * answered instead of always at the first.
 *
 * fallback() walks its list from the top on every request, so when the first
 * endpoints are unreachable — a firewall, DNS filter or ad blocker blocking
 * binance.org — every request pays for those failed attempts again before
 * reaching one that answers. Here a blocked visitor walks the list once, then
 * goes straight to the endpoint that worked. After RECHECK_MS the first is
 * tried again, since whatever stopped it (a VPN, an outage) may have cleared.
 *
 * Not fallback()'s `rank` option: ranking pings every transport on every
 * polling interval, so every visitor would also be calling the last-resort
 * proxy all the time.
 *
 * Errors that would fail the same everywhere (a revert, a rejected request)
 * are thrown at once, as fallback() does.
 */
export function stickyFallback(
  transports: readonly Transport[],
  config: { retryCount?: number; retryDelay?: number } = {}
): Transport {
  let preferred = 0
  let preferredSince = 0

  return ({ chain, timeout, ...rest }) =>
    createTransport({
      key: 'stickyFallback',
      name: 'Sticky Fallback',
      type: 'fallback',
      retryCount: config.retryCount,
      retryDelay: config.retryDelay,
      request: (async ({ method, params }) => {
        if (preferred !== 0 && Date.now() - preferredSince > RECHECK_MS) {
          preferred = 0
        }
        const first = preferred
        let lastError: unknown
        for (let k = 0; k < transports.length; k++) {
          const i = (first + k) % transports.length
          // As in fallback(): retries come from each transport's own config.
          const transport = transports[i]({
            ...rest,
            chain,
            retryCount: 0,
            timeout
          })
          try {
            const response = await transport.request({ method, params })
            if (i !== preferred) {
              preferred = i
              preferredSince = Date.now()
            }
            return response
          } catch (err) {
            if (shouldThrow(err as Error)) throw err
            lastError = err
          }
        }
        throw lastError
      }) as EIP1193RequestFn
    })
}
