import { useQuery } from '@tanstack/react-query'
import { formatUnits } from 'viem'
import { usePublicClient, useChainId } from 'wagmi'
import { loansAbi, loansAddress, liquidityPoolAbi } from '@/src/generated'
import erc20Abi from '@/src/abis/ERC20.json'
import { useEarningsPulled, usePoolShareChanges } from '@/src/graphql/hooks'
import {
  DAY_S,
  distributedSince,
  distributionPerformance,
  sumShareChanges,
  totalDistributed,
  type Performance
} from '@/src/utils/poolHistory'
import {
  poolReturns,
  UNMEASURED,
  type WindowReturns
} from '@/src/utils/returns'

/** Rolling window: the 30 × 24 hours up to now. */
const WINDOW_S = 30 * DAY_S

/**
 * How far indexed history may sit from the chain's live totals before it is
 * distrusted, in basis points. Covers rounding; anything larger means the
 * indexer is missing events (or still catching up on the latest), and the
 * figures would be wrong.
 */
const TOTALS_TOLERANCE_BPS = 10n

const withinTolerance = (indexed: bigint, live: bigint) => {
  const gap = indexed > live ? indexed - live : live - indexed
  return gap * 10_000n <= live * TOTALS_TOLERANCE_BPS
}

export interface ThirtyDayReturns {
  /** The last 30 days of distributions ÷ the pool as it is now. */
  currentYield: WindowReturns
  /** Each distribution ÷ the pool at that moment, summed (time-weighted). */
  performance: Performance | null
  /** Interest distributed to the pool in the window, in stablecoin units. */
  distributed: number | null
}

/**
 * Two 30-day figures for the Liquidity page, both counting interest only when
 * pullEarnings() distributes it (the moment depositors are credited).
 *
 * CURRENT YIELD — the interest distributed to the pool over the last 30 days
 * ÷ the capital that shares distributions today. A period's income over
 * current capital (how DeFi dashboards show a pool's fee APR), and it matches
 * how a deposit earns: every distribution is split across the interest
 * shares in the pool at that moment, so a deposit made now shares with
 * today's pool, not the pool of weeks ago.
 *
 * - avgPct: over current liquidity shares (deposits) — the headline
 * - basePct: over current interest shares — the 1.00x tier; tier m earns
 *   m × basePct, and the deposit-weighted average of the tiers is avgPct
 *
 * The pool's interest comes from borrowers, not from its own size: more
 * deposits split the same interest more ways, so the divisor is the pool as
 * it is now. Interest borrowers have paid that no pull has moved into the
 * pool yet (Loans.availableInterest) is not counted until it is distributed.
 *
 * PERFORMANCE — the time-weighted return, how funds report performance: each
 * distribution in the window ÷ the pool's deposits when it was paid, added
 * up (see distributionPerformance). It is what money held through every
 * distribution in the window earned, and new deposits don't move it until
 * the next distribution is split across them.
 *
 * The distributions come from the indexer and must first add up to
 * Loans.totalInterestDistributed(); Performance also needs the pool's share
 * history, which must add up to its live totals. If a check fails — or there
 * is no indexer for the chain, or it's unreachable — that figure is null
 * ("—") rather than a number that can't be vouched for.
 *
 * Works disconnected: reads go through the default-chain public client.
 */
export function useThirtyDayReturns() {
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const loans = loansAddress[chainId as keyof typeof loansAddress] as
    | `0x${string}`
    | undefined

  const snapshot = useQuery({
    queryKey: ['returnsSnapshot', chainId],
    enabled: !!publicClient && !!loans,
    // Refreshes in step with the indexer query, so the consistency check
    // below compares two readings of roughly the same moment.
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      if (!publicClient || !loans) throw new Error('client not ready')

      const [pool, loanToken, totalInterestDistributed] = (await Promise.all([
        publicClient.readContract({
          address: loans,
          abi: loansAbi,
          functionName: 'liquidityPool'
        }),
        publicClient.readContract({
          address: loans,
          abi: loansAbi,
          functionName: 'loanToken'
        }),
        publicClient.readContract({
          address: loans,
          abi: loansAbi,
          functionName: 'totalInterestDistributed'
        })
      ])) as [`0x${string}`, `0x${string}`, bigint]

      // Deliberately NOT totalInterestShares(): that getter returns 0 on the
      // upgraded deployments (verified on both BSC mainnet and testnet). The
      // real total is boostTotals() = (base shares, boosted extras, ...);
      // their sum cross-checks against getPoolStatus and against known
      // deposit positions on both chains.
      const [decimals, totalLiquidityShares, boostTotals] = (await Promise.all([
        publicClient.readContract({
          address: loanToken,
          abi: erc20Abi,
          functionName: 'decimals'
        }),
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
      ])) as [
        number | bigint,
        bigint,
        readonly [bigint, bigint, bigint, bigint, bigint]
      ]
      return {
        pool,
        decimals: Number(decimals),
        totalInterestDistributed,
        totalLiquidityShares,
        totalInterestShares: boostTotals[0] + boostTotals[1]
      }
    }
  })

  const pulls = useEarningsPulled(snapshot.data?.pool)
  const shares = usePoolShareChanges(snapshot.data?.pool)

  let data: ThirtyDayReturns | undefined
  if (snapshot.data) {
    const live = snapshot.data
    data = { currentYield: UNMEASURED, performance: null, distributed: null }
    if (
      pulls.data &&
      withinTolerance(
        totalDistributed(pulls.data),
        live.totalInterestDistributed
      )
    ) {
      const since = Math.floor(Date.now() / 1000) - WINDOW_S
      const distributed = distributedSince(pulls.data, since)
      data.currentYield = poolReturns(
        distributed,
        live.totalLiquidityShares,
        live.totalInterestShares
      )
      data.distributed = Number(formatUnits(distributed, live.decimals))

      const history = shares.data && sumShareChanges(shares.data)
      if (
        shares.data &&
        history &&
        withinTolerance(history.liquidity, live.totalLiquidityShares) &&
        withinTolerance(history.interest, live.totalInterestShares)
      ) {
        data.performance = distributionPerformance(
          pulls.data,
          shares.data,
          since
        )
      }
    }
  }

  return {
    data,
    isLoading: snapshot.isLoading || pulls.isLoading || shares.isLoading
  }
}
