import { GraphQLClient } from 'graphql-request'

/**
 * Hasura endpoints for the shared allthingslemon Envio indexer (the same one
 * royal-citadel-dapp reads). Public, unauthenticated, CORS-enabled for the
 * production origin.
 *
 * The literal `process.env.X` reads are deliberate: Next only inlines
 * statically-analysable member expressions into the browser bundle.
 */
const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  'https://data.allthingslemon.io/v1/graphql'
const GRAPHQL_TESTNET_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_TESTNET_URL ||
  'https://testnet.data.allthingslemon.io/v1/graphql'

/**
 * Which endpoint indexes which chain. A chain missing here has no indexer
 * and every indexer hook stays disabled on it.
 *
 * The queries target the v2 schema (`blockTimestamp`), which only the
 * mainnet endpoint serves. The testnet endpoint is still v1 and indexes
 * Citron (1005) alone, so BSC testnet (97) is left out until the indexer
 * reindexes it on v2 — then map it to GRAPHQL_TESTNET_URL.
 */
const ENDPOINT_BY_CHAIN: Record<number, string> = {
  56: GRAPHQL_URL,
  1006: GRAPHQL_URL
}

export function getGraphQLEndpoint(chainId: number): string | undefined {
  return ENDPOINT_BY_CHAIN[chainId]
}

const clients = new Map<string, GraphQLClient>()

export function getGraphQLClient(chainId: number): GraphQLClient {
  const endpoint = getGraphQLEndpoint(chainId)
  if (!endpoint) throw new Error(`No indexer endpoint for chain ${chainId}`)
  let client = clients.get(endpoint)
  if (!client) {
    client = new GraphQLClient(endpoint, {
      headers: { 'Content-Type': 'application/json' }
    })
    clients.set(endpoint, client)
  }
  return client
}

/** Rows per page for paginated reads. Hasura imposes no cap today. */
export const PAGE_SIZE = 1000

/**
 * Reads every row of a list query, a page at a time. The query must take
 * `$limit` and `$offset` and order by a stable key (the event `id`), and
 * `pick` extracts the row array from the response.
 */
export async function requestAll<TRow, TResponse>(
  chainId: number,
  document: string,
  variables: Record<string, unknown>,
  pick: (response: TResponse) => TRow[]
): Promise<TRow[]> {
  const client = getGraphQLClient(chainId)
  const rows: TRow[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = pick(
      await client.request<TResponse>(document, {
        ...variables,
        limit: PAGE_SIZE,
        offset
      })
    )
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

export { GRAPHQL_URL, GRAPHQL_TESTNET_URL }
