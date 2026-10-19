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
/**
 * Each dataseed gets UPSTREAM_TIMEOUT_MS, and all of them together DEADLINE_MS:
 * inside the browser's own 10 s timeout for this request, so a hung dataseed
 * costs a few seconds rather than the whole request.
 */
const UPSTREAM_TIMEOUT_MS = 3_000
const DEADLINE_MS = 9_000

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

  // The declared size first, so an oversized upload is refused unread.
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) {
    return rpcError(null, -32600, 'Request too large', 413)
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
  const deadline = Date.now() + DEADLINE_MS
  for (let k = 0; k < upstreams.length; k++) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    const url = upstreams[(start + k) % upstreams.length]
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(Math.min(UPSTREAM_TIMEOUT_MS, remaining))
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
