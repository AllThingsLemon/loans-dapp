import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useChainId } from 'wagmi'
import { loansAbi, loansAddress, liquidityPoolAbi } from '@/src/generated'
import { bigintRatioToPct } from '@/src/utils/returns'

const THIRTY_DAYS_S = 30 * 24 * 3600
/** Header sample distance used to estimate the chain's average block time. */
const BLOCK_SAMPLE = 90_000n
/**
 * Hard ceiling on the historical (archive-node) read. Only the last-resort
 * archive endpoint can serve it, so when that endpoint is down the transport
 * fallback chain grinds through every retry — measured at 80+ seconds —
 * before the catch below ever runs. The interest-to-date fallback is
 * perfectly serviceable, so give up long before that.
 */
const HISTORY_TIMEOUT_MS = 12_000

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('history read timeout')), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })

export interface ThirtyDayReturns {
  /**
   * Pool-average return over the window as a percentage (0.42 = 0.42%):
   * window interest ÷ total liquidity shares. Every deposit holds liquidity
   * shares 1:1 with its principal, so this is what the average deposited
   * dollar earned. Null when the pool has no shares to measure against.
   */
  avgPct: number | null
  /**
   * The 1.00x-multiplier base return: window interest ÷ total interest
   * shares. A tier with multiplier m actually earned m × basePct, because
   * interest is distributed per interest share and a deposit's interest
   * shares are principal × multiplier. The share-weighted average of the
   * per-tier figures equals avgPct by construction.
   */
  basePct: number | null
}

/**
 * Actual pool returns over (up to) the last 30 days, measured on-chain:
 * interest paid by borrowers over the window, normalized per pool share.
 *
 * The numerator is the delta of `Loans.totalInterestEarned` between now and
 * the block ~30 days back (block found by estimating the chain's block time
 * from two headers — exact enough for a marketing figure). When the
 * historical read fails — contract younger than 30 days, or an RPC that has
 * pruned month-old state — the baseline falls back to zero, making the
 * figure interest-to-date, which for a young deployment is the same number.
 *
 * Works disconnected: reads go through the default-chain public client.
 */
export function useThirtyDayReturns() {
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const loans = loansAddress[chainId as keyof typeof loansAddress] as
    | `0x${string}`
    | undefined

  // Fast reads only — four eth_calls against current state, ~1s on a healthy
  // endpoint. This is what gates rendering, so the historical (archive-node)
  // read must never sit in this query: with no archive endpoint configured
  // it would run out its whole timeout on every page load.
  const snapshot = useQuery({
    queryKey: ['returnsSnapshot', chainId],
    enabled: !!publicClient && !!loans,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      if (!publicClient || !loans) throw new Error('client not ready')

      const [pool, interestNow] = await Promise.all([
        publicClient.readContract({
          address: loans,
          abi: loansAbi,
          functionName: 'liquidityPool'
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: loans,
          abi: loansAbi,
          functionName: 'totalInterestEarned'
        }) as Promise<bigint>
      ])

      // Deliberately NOT totalInterestShares(): that getter returns 0 on the
      // upgraded deployments (verified on both BSC mainnet and testnet). The
      // real total is boostTotals() = (base shares, boosted extras, ...);
      // their sum cross-checks against getPoolStatus and against known
      // deposit positions on both chains.
      const [totalLiquidityShares, boostTotals] = (await Promise.all([
        publicClient.readContract({
          address: pool,
          abi: liquidityPoolAbi,
          functionName: 'totalLiquidityShares'
        }),
        publicClient.readContract({
          address: pool,
          abi: liquidityPoolAbi,
          functionName: 'boostTotals'
        })
      ])) as [bigint, readonly [bigint, bigint, bigint, bigint, bigint]]
      return {
        interestNow,
        totalLiquidityShares,
        totalInterestShares: boostTotals[0] + boostTotals[1]
      }
    }
  })

  // The 30-day baseline, refined in the background. Needs an archive node;
  // with none configured it fails after HISTORY_TIMEOUT_MS and the figures
  // simply stay interest-to-date (identical for a young deployment). The
  // panel never waits on this query.
  const baseline = useQuery({
    queryKey: ['returnsBaseline', chainId],
    enabled: !!publicClient && !!loans,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<bigint> => {
      if (!publicClient || !loans) throw new Error('client not ready')
      // Estimate blocks-per-30-days from two headers, then read the
      // cumulative interest counter at that block.
      const latest = await withTimeout(
        publicClient.getBlock(),
        HISTORY_TIMEOUT_MS
      )
      const sampleNumber =
        latest.number > BLOCK_SAMPLE ? latest.number - BLOCK_SAMPLE : 0n
      const sample = await withTimeout(
        publicClient.getBlock({ blockNumber: sampleNumber }),
        HISTORY_TIMEOUT_MS
      )
      const secPerBlock =
        Number(latest.timestamp - sample.timestamp) /
        Math.max(1, Number(latest.number - sample.number))
      const blocksBack = BigInt(
        Math.floor(THIRTY_DAYS_S / Math.max(0.1, secPerBlock))
      )
      const fromBlock =
        latest.number > blocksBack ? latest.number - blocksBack : 0n
      return (await withTimeout(
        publicClient.readContract({
          address: loans,
          abi: loansAbi,
          functionName: 'totalInterestEarned',
          blockNumber: fromBlock
        }),
        HISTORY_TIMEOUT_MS
      )) as bigint
    }
  })

  // Baseline still pending or failed → 0n, i.e. interest-to-date.
  const interestThen = baseline.data ?? 0n

  let data: ThirtyDayReturns | undefined
  if (snapshot.data) {
    const { interestNow, totalLiquidityShares, totalInterestShares } =
      snapshot.data
    if (totalLiquidityShares === 0n) {
      data = { avgPct: null, basePct: null }
    } else {
      const delta = interestNow > interestThen ? interestNow - interestThen : 0n
      data = {
        avgPct: bigintRatioToPct(delta, totalLiquidityShares),
        basePct:
          totalInterestShares > 0n
            ? bigintRatioToPct(delta, totalInterestShares)
            : null
      }
    }
  }

  return { data, isLoading: snapshot.isLoading }
}
