import { NextResponse } from 'next/server'
import { PROXIED_RPC_URLS, READ_METHODS } from '@/src/config/rpc'

export const runtime = 'edge'

/**
 * Same-origin relay to the BNB chain dataseeds, for browsers that can't reach
 * binance.org themselves — an office firewall, a filtering DNS service, a VPN
 * or an ad blocker. The app calls the dataseeds directly first and only falls
 * back to this route when they fail (see stickyFallback), so most visitors
 * never touch it.
 *
 * Read-only. Transactions are sent by the visitor's wallet over its own
 * connection, never through the app's transport, so nothing here needs to
 * send one; the method allowlist also keeps the route from being useful as a
 * general-purpose relay.
 */

/** Multicall batches stay well under this (wagmi batches 1 KB of calldata). */
const MAX_BODY_BYTES = 64 * 1024
const MAX_BATCH = 25
const UPSTREAM_TIMEOUT_MS = 8_000

const rpcError = (id: unknown, code: number, message: string, status = 200) =>
  NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error: { code, message } },
    { status, headers: { 'cache-control': 'no-store' } }
  )

/**
 * Browsers send Origin on every POST, so a mismatch means another site is
 * calling. No CORS headers are sent either, so such a caller couldn't read the
 * answer anyway; this just refuses it before it costs an upstream request.
 */
const isForeignOrigin = (request: Request) => {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== new URL(request.url).host
  } catch {
    return true
  }
}

export async function POST(
  request: Request,
  { params }: { params: { chainId: string } }
) {
  const upstreams = PROXIED_RPC_URLS[Number(params.chainId)]
  if (!upstreams) return rpcError(null, -32601, 'Unsupported chain', 404)
  if (isForeignOrigin(request)) {
    return rpcError(null, -32600, 'Cross-origin requests are not allowed', 403)
  }

  const body = await request.text()
  if (body.length > MAX_BODY_BYTES) {
    return rpcError(null, -32600, 'Request too large', 413)
  }
  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return rpcError(null, -32700, 'Parse error', 400)
  }
  const calls = (Array.isArray(payload) ? payload : [payload]) as {
    id?: unknown
    method?: unknown
  }[]
  if (calls.length === 0 || calls.length > MAX_BATCH) {
    return rpcError(null, -32600, 'Invalid request', 400)
  }
  for (const call of calls) {
    const method = call?.method
    if (typeof method !== 'string' || !READ_METHODS.has(method)) {
      return rpcError(call?.id, -32601, `Method not allowed: ${String(method)}`)
    }
  }

  // Start at a random dataseed so proxied traffic spreads across all of them.
  const start = Math.floor(Math.random() * upstreams.length)
  for (let k = 0; k < upstreams.length; k++) {
    const url = upstreams[(start + k) % upstreams.length]
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      })
      // Rate-limited or failing: the next dataseed may still answer.
      if (!response.ok) continue
      return new Response(await response.text(), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store'
        }
      })
    } catch {
      // Unreachable or timed out: try the next one.
    }
  }
  return rpcError(
    calls[0]?.id,
    -32603,
    'No upstream RPC endpoint answered',
    502
  )
}
