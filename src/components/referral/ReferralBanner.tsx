'use client'
import { useAccount } from 'wagmi'
import { formatTokenAmount } from '@/src/utils/decimals'
import { truncateAddress } from '@/src/utils/referral'
import type { UseReferralRouterReturn } from '@/src/hooks/referral/useReferralRouter'
import { AlertTriangle, Users } from 'lucide-react'

interface ReferralBannerProps {
  referrer: `0x${string}` | null
  isSelfReferral: boolean
  referral: UseReferralRouterReturn
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
 * Shown above the Add Liquidity card when a referrer has been captured from the
 * URL. Purely informational except for the self-referral case — a referrer who
 * is unregistered, or a rate that hasn't loaded, must never stop a deposit.
 */
export function ReferralBanner({
  referrer,
  isSelfReferral,
  referral,
  stableDecimals
}: ReferralBannerProps) {
  const { chain } = useAccount()

  // No router configured for this chain, or no referrer in the link: the
  // referral layer stays completely out of the way.
  if (!referral.enabled || !referrer) return null

  const explorerBase = chain?.blockExplorers?.default.url.replace(/\/$/, '')
  const explorerUrl = explorerBase
    ? `${explorerBase}/address/${referrer}`
    : undefined

  const commissionSymbol = referral.commissionTokenSymbol ?? 'mLEMX'
  const ratePct =
    referral.rateBps !== undefined ? Number(referral.rateBps) / 100 : undefined

  return (
    <div className='rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 space-y-2'>
      <div className='flex items-center gap-2'>
        <Users className='h-4 w-4 text-yellow-600' />
        <span className='text-sm font-semibold'>Referral link detected</span>
      </div>

      <p className='text-sm text-muted-foreground'>
        Referrer:{' '}
        {explorerUrl ? (
          <a
            href={explorerUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='font-mono font-medium text-foreground underline underline-offset-2'
          >
            {truncateAddress(referrer)}
          </a>
        ) : (
          <span className='font-mono font-medium text-foreground'>
            {truncateAddress(referrer)}
          </span>
        )}
      </p>

      {/* Self-referral reverts on-chain (SelfReferral), so it is caught here
          before the user pays gas. This is the one state that blocks. */}
      {isSelfReferral ? (
        <p className='text-sm font-medium text-destructive'>
          This referral link is your own wallet. Self-referral is rejected by
          the contract — remove the <code>?ref=</code> parameter from the URL to
          deposit normally.
        </p>
      ) : (
        <>
          {ratePct !== undefined && (
            <p className='text-sm text-muted-foreground'>
              Current commission tier:{' '}
              <span className='font-semibold text-foreground'>{ratePct}%</span>
              {referral.cumulativeReferred !== undefined && (
                <>
                  {' '}
                  (on ${formatUsd(
                    referral.cumulativeReferred,
                    stableDecimals
                  )}{' '}
                  referred to date)
                </>
              )}
            </p>
          )}

          {referral.estimated.commission > 0n && (
            <p className='text-sm text-muted-foreground'>
              Estimated commission on this deposit: ~$
              <span className='font-semibold text-foreground'>
                {formatUsd(referral.estimated.commission, stableDecimals)}
              </span>{' '}
              in {commissionSymbol}. This is indicative, not guaranteed —
              settlement can be skipped without affecting your deposit.
              {referral.estimated.isCapped && (
                <>
                  {' '}
                  The commission is capped at the router&apos;s per-transaction
                  limit, so it earns on $
                  {formatUsd(referral.estimated.basis, stableDecimals)} of this
                  deposit.
                </>
              )}
            </p>
          )}

          {/* Payout is claim-based: commissions are allocated to a TokenClaim
              contract, not transferred to the referrer's wallet. */}
          <p className='text-xs text-muted-foreground'>
            Commissions are paid in {commissionSymbol} and must be{' '}
            <span className='font-medium'>claimed</span> by the referrer — they
            are not sent to their wallet automatically.
          </p>

          {referral.isRegistered === false &&
            !referral.isRegistrationLoading && (
              <p className='text-sm text-yellow-700 dark:text-yellow-500'>
                This referrer is not registered with the commissions contract,
                so no commission will be earned. Your deposit will go through
                normally.
              </p>
            )}

          {referral.isPaused && (
            <p className='text-sm text-destructive'>
              The referral router is paused. Your deposit will go through on the
              standard path instead.
            </p>
          )}
        </>
      )}

      {/* Operator-facing guards. Both indicate a misconfiguration rather than
          anything the user did. */}
      {referral.hasPoolMismatch && (
        <p className='flex items-start gap-2 text-sm font-medium text-destructive'>
          <AlertTriangle className='h-4 w-4 mt-0.5 shrink-0' />
          The referral router points at a different liquidity pool than the one
          shown here. Referral deposits are disabled until this is resolved.
        </p>
      )}

      {!referral.isCommissionsAllowed && (
        <p className='flex items-start gap-2 text-sm font-medium text-destructive'>
          <AlertTriangle className='h-4 w-4 mt-0.5 shrink-0' />
          The configured commissions contract is no longer allowlisted by the
          router. Referral deposits are disabled until this is resolved.
        </p>
      )}

      {/* Testing aid only — never rendered in a production build. */}
      {referral.canOverrideCommissions &&
        referral.allowedCommissions.length > 0 && (
          <label className='block text-xs text-muted-foreground'>
            Commissions contract (non-production override)
            <select
              value={referral.commissionsAddress ?? ''}
              onChange={(e) =>
                referral.setCommissionsOverride(
                  (e.target.value || undefined) as `0x${string}` | undefined
                )
              }
              className='mt-1 block w-full rounded border border-border bg-background p-1 font-mono text-xs'
            >
              {referral.allowedCommissions.map((addr) => (
                <option key={addr} value={addr}>
                  {addr}
                </option>
              ))}
            </select>
          </label>
        )}
    </div>
  )
}
