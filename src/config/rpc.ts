/**
 * JSON-RPC endpoints for the BNB chains, shared by the browser transports
 * (src/config/wagmi.ts) and the /api/rpc proxy, which relays to the same list.
 *
 * Kept dependency-free: the proxy route bundles this module into a Cloudflare
 * worker.
 */

// Only the binance dataseeds remain — measured from real browser traffic
// (2026-09) they are the only endpoints that reliably answer browser
// clients. publicnode 403s browser requests from the production origin
// (while answering curl); the nodereal key answers 429 to everything.
// NOTE: nodereal was also the only archive node, so no endpoint here can
// serve state older than ~128 blocks.
export const BSC_RPC_URLS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed4.binance.org'
]

// Same rationale as mainnet above: rate-limited nodereal removed outright.
export const BSC_TESTNET_RPC_URLS = [
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://data-seed-prebsc-1-s2.binance.org:8545'
]

/**
 * The chains the /api/rpc proxy relays, and to where. Every endpoint here is
 * a binance.org dataseed, a domain some networks, DNS filters and browser
 * extensions block, so these chains get the proxy as a last resort.
 */
export const PROXIED_RPC_URLS: Record<number, readonly string[]> = {
  56: BSC_RPC_URLS,
  97: BSC_TESTNET_RPC_URLS
}

/**
 * The methods the proxy relays: everything viem's public actions use to read
 * chain state and receipts, and nothing that sends a transaction.
 */
export const READ_METHODS = new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_maxPriorityFeePerGas',
  'net_version'
])

export const rpcProxyPath = (chainId: number) => `/api/rpc/${chainId}`
