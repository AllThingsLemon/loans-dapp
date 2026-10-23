/**
 * Pure derivations over indexed LiquidityPool events (see src/graphql). Kept
 * dependency-free so the arithmetic is unit-testable without pulling wallet
 * UI into the test env.
 */

import type {
  AccountCompoundRow,
  AccountDepositRow,
  AccountEarningsClaimRow,
  AccountTransferRow,
  AccountWithdrawalClaimRow,
  AccountWithdrawalRequestRow,
  EarningsPulledRow
} from '@/src/graphql/types'
import { compareEventIds } from '@/src/utils/loanHistory'
import { bigintRatioToPct } from '@/src/utils/returns'

export const DAY_S = 86_400

/**
 * One event's signed change to the pool's share totals: deposits and
 * compounded earnings add, withdrawals and expiring boosts subtract.
 * Liquidity shares track principal 1:1; interest shares are principal ×
 * lock multiplier.
 */
export interface ShareChange {
  /** The indexer event id, `${chainId}_${blockNumber}_${logIndex}`. */
  id: string
  /** Unix seconds. */
  timestamp: number
  liquidity: bigint
  interest: bigint
}

export interface ShareTotals {
  liquidity: bigint
  interest: bigint
}

/** Totals after every change — comparable with the pool's live totals. */
export function sumShareChanges(changes: readonly ShareChange[]): ShareTotals {
  return changes.reduce(
    (t, c) => ({
      liquidity: t.liquidity + c.liquidity,
      interest: t.interest + c.interest
    }),
    { liquidity: 0n, interest: 0n }
  )
}

/** Interest distributed to the pool at or after `since` (unix seconds). */
export function distributedSince(
  pulls: readonly Pick<EarningsPulledRow, 'blockTimestamp' | 'amount'>[],
  since: number
): bigint {
  return pulls.reduce(
    (sum, p) => (p.blockTimestamp >= since ? sum + BigInt(p.amount) : sum),
    0n
  )
}

/** Interest distributed to the pool over its whole history. */
export function totalDistributed(
  pulls: readonly Pick<EarningsPulledRow, 'amount'>[]
): bigint {
  return pulls.reduce((sum, p) => sum + BigInt(p.amount), 0n)
}

export interface Performance {
  /** Per deposited dollar, across the lock mix at each distribution. */
  avgPct: number
  /** Per interest share: the 1.00x rate. Tier m earned m × basePct. */
  basePct: number
}

/**
 * Time-weighted performance over a window: each pull at or after `since`
 * contributes its amount ÷ the pool's deposits just before it — what the
 * money in the pool earned from that distribution — and the contributions
 * add up. They are summed rather than compounded because earnings are paid
 * out, not reinvested. A deposit made in the same transaction as a pull
 * isn't counted in that pull: the pull runs first.
 *
 * The 1.00x rate divides each amount by the interest shares it was split
 * across instead (recorded on the pull itself).
 */
export function distributionPerformance(
  pulls: readonly Pick<
    EarningsPulledRow,
    'id' | 'blockTimestamp' | 'amount' | 'totalInterestShares'
  >[],
  changes: readonly ShareChange[],
  since: number
): Performance {
  const ordered = [...changes].sort((a, b) => compareEventIds(a.id, b.id))
  let next = 0
  let deposits = 0n
  let avgPct = 0
  let basePct = 0
  for (const pull of [...pulls].sort((a, b) => compareEventIds(a.id, b.id))) {
    while (
      next < ordered.length &&
      compareEventIds(ordered[next].id, pull.id) < 0
    ) {
      deposits += ordered[next++].liquidity
    }
    const amount = BigInt(pull.amount)
    const interestShares = BigInt(pull.totalInterestShares)
    if (pull.blockTimestamp < since || amount === 0n) continue
    if (deposits > 0n) avgPct += bigintRatioToPct(amount, deposits)
    if (interestShares > 0n) basePct += bigintRatioToPct(amount, interestShares)
  }
  return { avgPct, basePct }
}

/**
 * Ties a deposit to the lock entry it funded. The contract merges deposits
 * that share token, unlock time and lock duration into one entry; the
 * Deposited event calls the unlock time `expiresAt`, getUserDepositEntries
 * calls it `unlockTime`.
 */
export const depositEntryKey = (
  token: string,
  unlockTime: bigint | number | string,
  lockDuration: bigint | number | string
) => `${token.toLowerCase()}:${BigInt(unlockTime)}:${BigInt(lockDuration)}`

/**
 * What the depositor put into each lock entry: the deposits behind it,
 * summed, keyed by depositEntryKey. An entry's own stableTokenValue also
 * counts earnings compounded into it, and an entry created by compounding
 * alone has no deposits, so it has no key here.
 */
export function sumDepositsByEntry(
  deposits: readonly Pick<
    AccountDepositRow,
    'token' | 'stableTokenValue' | 'expiresAt' | 'lockDuration'
  >[]
): Map<string, bigint> {
  const values = new Map<string, bigint>()
  for (const d of deposits) {
    const key = depositEntryKey(d.token, d.expiresAt, d.lockDuration)
    values.set(key, (values.get(key) ?? 0n) + BigInt(d.stableTokenValue))
  }
  return values
}

/**
 * The addresses whose pool history belongs to `account`, each with the event
 * id its contribution stops before (undefined: no cutoff). transferAccount
 * moves an entire position — deposit entries, claimed total, pending
 * withdrawals — to an empty account, but the indexer keeps the earlier
 * events under the sender; so the recipient's history is its own plus the
 * sender's up to the transfer, and so on back through earlier transfers.
 */
export function accountLineage(
  transfers: readonly AccountTransferRow[],
  account: string
): Map<string, string | undefined> {
  const lineage = new Map<string, string | undefined>([
    [account.toLowerCase(), undefined]
  ])
  const queue = [account.toLowerCase()]
  while (queue.length > 0) {
    const to = queue.shift()!
    const cutoff = lineage.get(to)
    for (const t of transfers) {
      if (t.to.toLowerCase() !== to) continue
      if (cutoff !== undefined && compareEventIds(t.id, cutoff) >= 0) continue
      const from = t.from.toLowerCase()
      if (lineage.has(from)) continue
      lineage.set(from, t.id)
      queue.push(from)
    }
  }
  return lineage
}

/** The rows that belong to an account, given its accountLineage. */
export function inLineage<T extends { id: string; user: string }>(
  rows: readonly T[],
  lineage: ReadonlyMap<string, string | undefined>
): T[] {
  return rows.filter((row) => {
    const user = row.user.toLowerCase()
    if (!lineage.has(user)) return false
    const cutoff = lineage.get(user)
    return cutoff === undefined || compareEventIds(row.id, cutoff) < 0
  })
}

/** One account's pool history, already narrowed to its lineage. */
export interface AccountHistory {
  deposits: AccountDepositRow[]
  compounds: AccountCompoundRow[]
  earningsClaims: AccountEarningsClaimRow[]
  withdrawalRequests: AccountWithdrawalRequestRow[]
  withdrawalClaims: AccountWithdrawalClaimRow[]
}

/** Everything the account has deposited, at its USD value when deposited. */
export const totalDeposited = (history: AccountHistory) =>
  history.deposits.reduce((sum, d) => sum + BigInt(d.stableTokenValue), 0n)

/** Earnings the account has reinvested, after the earnings fee. */
export const totalCompounded = (history: AccountHistory) =>
  history.compounds.reduce((sum, c) => sum + BigInt(c.earningsAmount), 0n)

/** The transaction history's filter groups. */
export type TransactionType = 'deposit' | 'claim' | 'withdraw'

/**
 * One transaction the account made in the pool. Compounding counts as a
 * deposit: it reinvests earnings as a new locked entry. A withdrawal is two
 * transactions — the request (shares burned, queued) and the payout once
 * the queue has funded it.
 */
export type PoolTransaction = {
  id: string
  /** Unix seconds. */
  timestamp: number
  /** USD; claims and payouts before their fee. */
  amount: bigint
} & (
  | {
      kind: 'deposit'
      type: 'deposit'
      token: string
      tokenAmount: bigint
      lockDuration: bigint
      unlockTime: bigint
    }
  | { kind: 'compound'; type: 'deposit'; unlockTime: bigint }
  | { kind: 'claim'; type: 'claim'; fee: bigint }
  | {
      kind: 'withdrawalRequest'
      type: 'withdraw'
      /** When the payout was claimed; undefined while still queued. */
      paidAt?: number
    }
  | { kind: 'withdrawalPayout'; type: 'withdraw'; fee: bigint }
)

/** The account's deposits, compounds, claims and withdrawals, newest first. */
export function transactionHistory(history: AccountHistory): PoolTransaction[] {
  const paidAt = new Map(
    history.withdrawalClaims.map((c) => [BigInt(c.requestId), c.blockTimestamp])
  )
  const rows: PoolTransaction[] = [
    ...history.deposits.map(
      (d): PoolTransaction => ({
        kind: 'deposit',
        type: 'deposit',
        id: d.id,
        timestamp: d.blockTimestamp,
        amount: BigInt(d.stableTokenValue),
        token: d.token.toLowerCase(),
        tokenAmount: BigInt(d.tokenAmount),
        lockDuration: BigInt(d.lockDuration),
        unlockTime: BigInt(d.expiresAt)
      })
    ),
    ...history.compounds.map(
      (c): PoolTransaction => ({
        kind: 'compound',
        type: 'deposit',
        id: c.id,
        timestamp: c.blockTimestamp,
        amount: BigInt(c.earningsAmount),
        unlockTime: BigInt(c.unlockTime)
      })
    ),
    ...history.earningsClaims.map(
      (c): PoolTransaction => ({
        kind: 'claim',
        type: 'claim',
        id: c.id,
        timestamp: c.blockTimestamp,
        amount: BigInt(c.amount),
        fee: BigInt(c.fee)
      })
    ),
    ...history.withdrawalRequests.map(
      (w): PoolTransaction => ({
        kind: 'withdrawalRequest',
        type: 'withdraw',
        id: w.id,
        timestamp: w.blockTimestamp,
        amount: BigInt(w.amount),
        paidAt: paidAt.get(BigInt(w.requestId))
      })
    ),
    ...history.withdrawalClaims.map(
      (c): PoolTransaction => ({
        kind: 'withdrawalPayout',
        type: 'withdraw',
        id: c.id,
        timestamp: c.blockTimestamp,
        amount: BigInt(c.amount),
        fee: BigInt(c.fee)
      })
    )
  ]
  return rows.sort((a, b) => compareEventIds(b.id, a.id))
}
