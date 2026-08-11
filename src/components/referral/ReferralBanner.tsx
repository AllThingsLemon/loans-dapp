'use client'
import { useAccount } from 'wagmi'
import {
  REFERRAL_BLOCK_REMEDY,
  describeReferralBlock,
  truncateAddress
} from '@/src/utils/referral'
import type { ReferralState } from '@/src/hooks/referral/useReferralState'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface ReferralBannerProps {
  referral: ReferralState
}

/**
 * Spans the full width of the liquidity dashboard, above both cards.
 *
 * On a chain with a router configured, deposits are referral-only, so this is
 * not decoration — when the gate blocks, this banner IS the explanation for why
 * the deposit button is unavailable, and it must always be visible in that
 * state. When the link is good it says so in one line and gets out of the way.
 */
export function ReferralBanner({ referral }: ReferralBannerProps) {
  const { chain } = useAccount()
  const { referrer, gate } = referral

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
          <AlertTriangle className='h-4 w-4 shrink-0 text-destructive' />
          <span className='text-sm font-semibold text-destructive'>
            {title}
          </span>
        </div>
        <p className='text-sm text-muted-foreground'>{detail}</p>
        <p className='text-sm font-medium'>{REFERRAL_BLOCK_REMEDY}</p>
        {/* Echo back whatever the link contained, so the referrer can be told
            exactly what their visitor received. */}
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

  // gate.status === 'ready' — confirm and stop talking. The banner is full
  // width, so the address fits in full without truncation.
  const referrerUrl = explorerFor(gate.referrer)

  return (
    <div className='rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-600' />
        <span className='text-sm font-semibold'>Referred by</span>
        {referrerUrl ? (
          <a
            href={referrerUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='break-all font-mono text-sm text-foreground underline underline-offset-2'
          >
            {gate.referrer}
          </a>
        ) : (
          <span className='break-all font-mono text-sm text-foreground'>
            {gate.referrer}
          </span>
        )}
      </div>
    </div>
  )
}
