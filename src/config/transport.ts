import { http, type Transport } from 'viem'
import { stickyFallback } from './stickyFallback'

/**
 * How long each endpoint of a multi-endpoint chain gets to answer before the
 * next is tried. The dataseeds answer in well under a second; a firewall that
 * silently drops their packets would otherwise hold each request for viem's
 * default 10 s before a blocked visitor reached the proxy.
 */
export const ENDPOINT_TIMEOUT_MS = 4_000

/**
 * The transport for one chain, given its endpoints and, for the BNB chains in
 * a browser, the site's /api/rpc proxy:
 *
 * - One endpoint and no proxy (the LemonChain chains): that endpoint, retried.
 * - Otherwise stickyFallback over the endpoints, each tried once — with
 *   several mirrors, retrying one only delays reaching the next — and the
 *   proxy as the last resort, for visitors who can't reach any of them. The
 *   proxy isn't retried on its own either: it already tries every dataseed
 *   itself. The whole walk is retried when every endpoint failed.
 */
export function buildTransport(
  urls: readonly string[],
  proxyUrl?: string
): Transport {
  if (urls.length === 1 && !proxyUrl) {
    return http(urls[0], { retryCount: 5, retryDelay: 1000 })
  }
  return stickyFallback(
    urls.map((url) =>
      http(url, { retryCount: 0, timeout: ENDPOINT_TIMEOUT_MS })
    ),
    {
      lastResort: proxyUrl ? http(proxyUrl, { retryCount: 0 }) : undefined,
      retryCount: 3,
      retryDelay: 500
    }
  )
}
