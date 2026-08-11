'use client'
import { useAccount } from 'wagmi'
import { formatTokenAmount } from '@/src/utils/decimals'
import {
  REFERRAL_BLOCK_REMEDY,
  describeReferralBlock,
  truncateAddress
} from '@/src/utils/referral'
import type { ReferralState } from '@/src/hooks/referral/useReferralState'
import { AlertTriangle, Loader2, Users } from 'lucide-react'

interface ReferralBannerProps {
  referral: ReferralState
  /** Decimals of the pool's stable token — the unit `basis` is denominated in. */
  stableDecimals: number
}

function formatUsd(value: bigint, decimals: number): string {
  return parseFloat(formatTokenAmount(value, decimals)).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )
}

/**
 * Spans the full width of the liquidity dashboard, above both cards.
 *
 * On a chain with a router configured, deposits are referral-only, so this is
 * not decoration — when the gate blocks, this banner IS the explanation for why
 * the deposit button is unavailable, and it must always be visible in that
 * state.
 */
export function ReferralBanner({
  referral,
  stableDecimals
}: ReferralBannerProps) {
  const { chain } = useAccount()
  const { referrer, router, gate } = referral

  // No router on this chain: the referral system does not apply and the plain
  // deposit flow is in charge. Render nothing at all.
  if (gate.status === 'disabled') return null

  const explorerBase = chain?.blockExplorers?.default.url.replace(/\/$/, '')
  const explorerFor = (addr: string) =>
    explorerBase ? `${explorerBase}/address/${addr}` : undefined

  if (gate.status === 'checking') {
    return (
      <div className='rounded-lg border border-border bg-muted/30 p-4'>
        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Verifying your referral link…
        </p>
      </div>
    )
  }

  if (gate.status === 'blocked') {
    const { title, detail } = describeReferralBlock(gate.reason)
    return (
      <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2'>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4 text-destructive' />
          <span className='text-sm font-semibold text-destructive'>
            {title}
          </span>
        </div>
        <p className='text-sm text-muted-foreground'>{detail}</p>
        <p className='text-sm font-medium'>{REFERRAL_BLOCK_REMEDY}</p>
        {/* Show whatever was in the link so the referrer can be told exactly
            what their visitor received. */}
        {referrer && (
          <p className='text-xs text-muted-foreground'>
            Affiliate in your link:{' '}
            <span className='font-mono'>{truncateAddress(referrer)}</span>
          </p>
        )}
        {referral.commissions && (
          <p className='text-xs text-muted-foreground'>
            Commissions contract in your link:{' '}
            <span className='font-mono'>
              {truncateAddress(referral.commissions)}
            </span>
          </p>
        )}
      </div>
    )
  }

  // gate.status === 'ready'
  const commissionSymbol = router.commissionTokenSymbol ?? 'mLEMX'
  const ratePct =
    router.rateBps !== undefined ? Number(router.rateBps) / 100 : undefined
  const referrerUrl = explorerFor(gate.referrer)

  return (
    <div className='rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 space-y-2'>
      <div className='flex items-center gap-2'>
        <Users className='h-4 w-4 text-yellow-600' />
        <span className='text-sm font-semibold'>Referral link detected</span>
      </div>

      <p className='text-sm text-muted-foreground'>
        Referred by:{' '}
        {referrerUrl ? (
          <a
            href={referrerUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='font-mono font-medium text-foreground underline underline-offset-2'
          >
            {truncateAddress(gate.referrer)}
          </a>
        ) : (
          <span className='font-mono font-medium text-foreground'>
            {truncateAddress(gate.referrer)}
          </span>
        )}
      </p>

      {ratePct !== undefined && (
        <p className='text-sm text-muted-foreground'>
          Current commission tier:{' '}
          <span className='font-semibold text-foreground'>{ratePct}%</span>
          {router.cumulativeReferred !== undefined && (
            <>
              {' '}
              (on ${formatUsd(router.cumulativeReferred, stableDecimals)}{' '}
              referred to date)
            </>
          )}
        </p>
      )}

      {router.estimated.commission > 0n && (
        <p className='text-sm text-muted-foreground'>
          Estimated commission on this deposit: ~$
          <span className='font-semibold text-foreground'>
            {formatUsd(router.estimated.commission, stableDecimals)}
          </span>{' '}
          in {commissionSymbol}. This is indicative, not guaranteed — settlement
          can be skipped without affecting your deposit.
          {router.estimated.isCapped && (
            <>
              {' '}
              The commission is capped at the router&apos;s per-transaction
              limit, so it earns on $
              {formatUsd(router.estimated.basis, stableDecimals)} of this
              deposit.
            </>
          )}
        </p>
      )}

      {/* Payout is claim-based: commissions are allocated to a TokenClaim
          contract, not transferred to the referrer's wallet. */}
      <p className='text-xs text-muted-foreground'>
        Commissions are paid in {commissionSymbol} and must be{' '}
        <span className='font-medium'>claimed</span> by the referrer — they are
        not sent to their wallet automatically.
      </p>
    </div>
  )
}
