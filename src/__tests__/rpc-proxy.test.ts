import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPublicClient } from 'viem'
import { bsc } from 'viem/chains'
import { POST } from '../app/api/rpc/[chainId]/route'
import { BSC_RPC_URLS, rpcProxyPath } from '../config/rpc'
import { RECHECK_MS } from '../config/stickyFallback'
import { buildTransport } from '../config/transport'

/**
 * The last-resort route for visitors whose network or browser blocks the
 * binance.org dataseeds: the /api/rpc proxy, and the production transport
 * (buildTransport → stickyFallback) that sends a blocked browser to it once
 * instead of on every request, and never sends it anything a dataseed
 * answered.
 */

const SITE = 'https://lending.lemloans.io'
const PROXY = `${SITE}${rpcProxyPath(56)}`

const rpcBody = (method: string, params: unknown[] = []) =>
  JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })

const answer = (body: unknown, result: unknown) =>
  new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: JSON.parse(String(body)).id,
      result
    }),
    { headers: { 'content-type': 'application/json' } }
  )

/** A JSON-RPC response body. */
const rpcJson = async (response: Response) =>
  (await response.json()) as { result?: unknown; error?: { code: number } }

/** A node's JSON-RPC error, in a normal HTTP 200 response. */
const rpcFailure = (body: unknown, code: number, message: string) =>
  new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: JSON.parse(String(body)).id,
      error: { code, message }
    }),
    { headers: { 'content-type': 'application/json' } }
  )

const blocked = () => Promise.reject(new TypeError('Failed to fetch'))

/** Stubs fetch with `impl` and returns the URLs it was called with. */
function stubFetch(
  impl: (url: string, init: RequestInit) => Promise<Response>
): string[] {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init: RequestInit = {}) => {
      const url = typeof input === 'string' ? input : String(input)
      calls.push(url)
      return impl(url, init)
    })
  )
  return calls
}

const proxy = (
  body: string,
  { origin = SITE, chainId = '56' }: { origin?: string; chainId?: string } = {}
) =>
  POST(
    new Request(`${SITE}/api/rpc/${chainId}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(origin ? { origin } : {})
      },
      body
    }),
    { params: { chainId } }
  )

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('/api/rpc proxy', () => {
  it('relays a read to a dataseed and returns its answer', async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x10'))
    const response = await proxy(rpcBody('eth_blockNumber'))
    expect(response.status).toBe(200)
    expect((await rpcJson(response)).result).toBe('0x10')
    expect(calls).toHaveLength(1)
    expect(BSC_RPC_URLS).toContain(calls[0])
  })

  it('moves past dataseeds that fail or rate-limit', async () => {
    let n = 0
    const calls = stubFetch(async (_url, init) => {
      n += 1
      if (n === 1) return blocked()
      if (n === 2) return new Response('slow down', { status: 429 })
      return answer(init.body, '0x10')
    })
    const response = await proxy(rpcBody('eth_blockNumber'))
    expect((await rpcJson(response)).result).toBe('0x10')
    expect(new Set(calls).size).toBe(3)
  })

  it('answers 502 when no dataseed does', async () => {
    const calls = stubFetch(blocked)
    const response = await proxy(rpcBody('eth_blockNumber'))
    expect(response.status).toBe(502)
    expect((await rpcJson(response)).error?.code).toBe(-32603)
    expect(calls).toHaveLength(BSC_RPC_URLS.length)
  })

  it('refuses methods that send transactions', async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x1'))
    const single = await proxy(rpcBody('eth_sendRawTransaction', ['0xdead']))
    expect((await rpcJson(single)).error?.code).toBe(-32601)
    const batch = await proxy(
      JSON.stringify([
        JSON.parse(rpcBody('eth_blockNumber')),
        JSON.parse(rpcBody('eth_sendTransaction', [{}]))
      ])
    )
    expect((await rpcJson(batch)).error?.code).toBe(-32601)
    expect(calls).toHaveLength(0)
  })

  it("refuses other sites' pages but not same-origin or Origin-less calls", async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x10'))
    const foreign = await proxy(rpcBody('eth_blockNumber'), {
      origin: 'https://other.example'
    })
    expect(foreign.status).toBe(403)
    expect(calls).toHaveLength(0)
    expect(
      (await proxy(rpcBody('eth_blockNumber'), { origin: '' })).status
    ).toBe(200)
    expect(calls).toHaveLength(1)
  })

  it('only relays the BNB chains', async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x1'))
    const response = await proxy(rpcBody('eth_blockNumber'), { chainId: '1' })
    expect(response.status).toBe(404)
    expect(calls).toHaveLength(0)
  })

  it('refuses oversized and malformed bodies', async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x1'))
    const huge = rpcBody('eth_call', [{ data: '0x' + 'ab'.repeat(40_000) }])
    expect((await proxy(huge)).status).toBe(413)
    expect((await proxy('{not json')).status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('refuses a body declared too large without reading it', async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x1'))
    const response = await POST(
      new Request(`${SITE}/api/rpc/56`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '1000000'
        },
        body: rpcBody('eth_blockNumber')
      }),
      { params: { chainId: '56' } }
    )
    expect(response.status).toBe(413)
    expect(calls).toHaveLength(0)
  })
})

describe('buildTransport (the BNB chains in a browser)', () => {
  /** Exactly what wagmi.ts builds for chain 56: the dataseeds, then the proxy. */
  const client = () =>
    createPublicClient({
      chain: bsc,
      transport: buildTransport(BSC_RPC_URLS, PROXY)
    })
  const blockNumber = (c: ReturnType<typeof client>) =>
    c.request({ method: 'eth_blockNumber' })
  /** Waits for the whole walk's retries (500 + 1000 + 2000 ms) to run out. */
  const SLOW = { timeout: 15_000 }

  it('stays on the first dataseed while it answers', async () => {
    const calls = stubFetch(async (_url, init) => answer(init.body, '0x10'))
    const c = client()
    await blockNumber(c)
    await blockNumber(c)
    expect(calls).toEqual([BSC_RPC_URLS[0], BSC_RPC_URLS[0]])
  })

  it('sends a blocked browser to the proxy once, then straight there', async () => {
    const calls = stubFetch(async (url, init) =>
      url === PROXY ? answer(init.body, '0x10') : blocked()
    )
    const c = client()
    expect(await blockNumber(c)).toBe('0x10')
    expect(calls).toEqual([...BSC_RPC_URLS, PROXY])

    calls.length = 0
    expect(await blockNumber(c)).toBe('0x10')
    expect(calls).toEqual([PROXY])
  })

  it('tries the dataseeds again after RECHECK_MS', async () => {
    let dataseedsUp = false
    const calls = stubFetch(async (url, init) =>
      url === PROXY || dataseedsUp ? answer(init.body, '0x10') : blocked()
    )
    const c = client()
    await blockNumber(c)
    expect(calls.at(-1)).toBe(PROXY)

    dataseedsUp = true
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + RECHECK_MS + 1)
    calls.length = 0
    await blockNumber(c)
    await blockNumber(c)
    expect(calls).toEqual([BSC_RPC_URLS[0], BSC_RPC_URLS[0]])
  })

  it('throws a revert at once instead of trying the next endpoint', async () => {
    const calls = stubFetch(async (_url, init) =>
      rpcFailure(init.body, 3, 'execution reverted')
    )
    await expect(
      client().request({
        method: 'eth_call',
        params: [{ data: '0x' }, 'latest']
      })
    ).rejects.toThrow(/execution reverted/)
    expect(calls).toHaveLength(1)
  })

  it('keeps errors the dataseeds answer off the proxy', SLOW, async () => {
    // What every dataseed says to a getLogs from block 0 (no archive node).
    const calls = stubFetch(async (_url, init) =>
      rpcFailure(init.body, -32005, 'limit exceeded')
    )
    await expect(
      client().request({
        method: 'eth_getLogs',
        params: [{ fromBlock: '0x0', toBlock: 'latest' }]
      })
    ).rejects.toThrow(/limit/)
    expect(calls.length).toBeGreaterThan(0)
    expect(calls).not.toContain(PROXY)
    expect(new Set(calls)).toEqual(new Set(BSC_RPC_URLS))
  })

  it(
    "gives a blocked browser the proxy's relayed error without walking the dataseeds",
    SLOW,
    async () => {
      let relayError = false
      const calls = stubFetch(async (url, init) => {
        if (url !== PROXY) return blocked()
        return relayError
          ? rpcFailure(init.body, -32005, 'limit exceeded')
          : answer(init.body, '0x10')
      })
      const c = client()
      await blockNumber(c)
      relayError = true
      calls.length = 0
      await expect(
        c.request({
          method: 'eth_getLogs',
          params: [{ fromBlock: '0x0', toBlock: 'latest' }]
        })
      ).rejects.toThrow(/limit/)
      expect(new Set(calls)).toEqual(new Set([PROXY]))
    }
  )

  it(
    'goes back to the dataseeds when the proxy itself fails',
    SLOW,
    async () => {
      let proxyDown = false
      const calls = stubFetch(async (url, init) => {
        if (url === PROXY) {
          return proxyDown
            ? new Response('unavailable', { status: 503 })
            : answer(init.body, '0x10')
        }
        return proxyDown ? answer(init.body, '0x11') : blocked()
      })
      const c = client()
      await blockNumber(c)
      proxyDown = true
      calls.length = 0
      expect(await blockNumber(c)).toBe('0x11')
      expect(calls.at(-1)).toBe(BSC_RPC_URLS[0])
    }
  )

  it(
    'fails with the last error once every endpoint has failed',
    SLOW,
    async () => {
      const calls = stubFetch(blocked)
      await expect(blockNumber(client())).rejects.toThrow(/HTTP request failed/)
      expect(new Set(calls)).toEqual(new Set([...BSC_RPC_URLS, PROXY]))
    }
  )

  it("supports viem's watch actions", async () => {
    stubFetch(async (_url, init) => answer(init.body, '0x10'))
    const c = createPublicClient({
      chain: bsc,
      transport: buildTransport(BSC_RPC_URLS, PROXY),
      pollingInterval: 50
    })
    const seen = await new Promise<bigint>((resolve, reject) => {
      const unwatch = c.watchBlockNumber({
        onBlockNumber: (n) => {
          unwatch()
          resolve(n)
        },
        onError: reject
      })
    })
    expect(seen).toBe(16n)
  })

  it('keeps a single endpoint without a proxy on a plain retried http transport', () => {
    expect(buildTransport(['https://rpc.lemonchain.io'])({}).config.type).toBe(
      'http'
    )
    expect(buildTransport(BSC_RPC_URLS, PROXY)({}).config.type).toBe('fallback')
  })
})
