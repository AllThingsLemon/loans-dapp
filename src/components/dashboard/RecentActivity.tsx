'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarPlus,
  CheckCircle,
  History,
  Unlock,
  XCircle
} from 'lucide-react'
import { useLoans } from '@/src/hooks/useLoans'
import { useContractTokenConfiguration } from '@/src/hooks/useContractTokenConfiguration'
import { useCollateralManager } from '@/src/hooks/useCollateralManager'
import { useBorrowerActivity } from '@/src/graphql/hooks'
import {
  recentLoanActivity,
  type LoanActivity,
  type LoanActivityKind
} from '@/src/utils/loanHistory'
import {
  COLLATERAL_SIG_DIGITS,
  formatAmountWithSymbol,
  formatDuration,
  formatTimestamp
} from '@/src/utils/format'

/** How many events the card shows. */
const LIMIT = 5

const KIND: Record<LoanActivityKind, { title: string; icon: JSX.Element }> = {
  opened: {
    title: 'Loan opened',
    icon: <ArrowDownLeft className='h-4 w-4 text-blue-600' />
  },
  payment: {
    title: 'Payment made',
    icon: <ArrowUpRight className='h-4 w-4 text-green-600' />
  },
  extended: {
    title: 'Loan extended',
    icon: <CalendarPlus className='h-4 w-4 text-blue-600' />
  },
  repaid: {
    title: 'Loan repaid',
    icon: <CheckCircle className='h-4 w-4 text-green-600' />
  },
  collateralWithdrawn: {
    title: 'Collateral withdrawn',
    icon: <Unlock className='h-4 w-4 text-green-600' />
  },
  defaulted: {
    title: 'Loan defaulted',
    icon: <XCircle className='h-4 w-4 text-red-600' />
  }
}

const formatDay = (timestamp: number) =>
  formatTimestamp(BigInt(timestamp)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

/**
 * The borrower's latest loan events across all their loans, newest first:
 * openings (from the chain) and payments, extensions, repayments, collateral
 * withdrawals and defaults (from the indexer). Without an indexer for the
 * chain, it shows openings only.
 */
export function RecentActivity() {
  const { address } = useAccount()
  const { activeLoans, loanHistory, isLoading } = useLoans()
  const { tokenConfig } = useContractTokenConfiguration()
  const { getCollateralByAddress } = useCollateralManager()

  const loans = useMemo(
    () => [...activeLoans, ...loanHistory].filter(Boolean),
    [activeLoans, loanHistory]
  )
  const loanIds = useMemo(() => loans.map((loan) => loan.id), [loans])
  const loansById = useMemo(
    () => new Map(loans.map((loan) => [loan.id.toLowerCase(), loan])),
    [loans]
  )
  const { data: indexed, isLoading: indexedLoading } = useBorrowerActivity(
    address,
    loanIds,
    LIMIT
  )
  const activity = useMemo(
    () => recentLoanActivity(loans, indexed, LIMIT),
    [loans, indexed]
  )

  const loanSymbol = tokenConfig?.loanToken.symbol || 'Token'
  const loanDecimals = tokenConfig?.loanToken.decimals

  if (activity.length === 0) {
    return (
      <div className='text-center py-8'>
        <History
          className={`h-12 w-12 mx-auto mb-4 text-muted-foreground ${
            isLoading || indexedLoading ? 'animate-pulse' : ''
          }`}
        />
        <p className='text-sm text-muted-foreground'>
          {isLoading || indexedLoading
            ? 'Loading activity…'
            : 'No loan activity yet.'}
        </p>
      </div>
    )
  }

  const amountOf = (event: LoanActivity) => {
    if (event.kind === 'extended' && event.extensionDuration !== undefined) {
      return `+${formatDuration(event.extensionDuration)}`
    }
    if (event.amount === undefined) return null
    if (event.kind === 'collateralWithdrawn') {
      const collateral = getCollateralByAddress(
        loansById.get(event.loanId)?.collateralToken ?? ''
      )
      return collateral
        ? formatAmountWithSymbol(
            event.amount,
            collateral.symbol,
            collateral.decimals,
            COLLATERAL_SIG_DIGITS
          )
        : null
    }
    return formatAmountWithSymbol(event.amount, loanSymbol, loanDecimals)
  }

  return (
    <div className='space-y-3'>
      {activity.map((event) => {
        const loan = loansById.get(event.loanId)
        const amount = amountOf(event)
        return (
          <div
            key={event.id}
            className='flex items-center justify-between p-3 bg-muted rounded-lg'
          >
            <div className='flex items-center gap-3'>
              {KIND[event.kind].icon}
              <div>
                <p className='font-medium'>{KIND[event.kind].title}</p>
                <p className='text-sm text-muted-foreground'>
                  {formatDay(event.timestamp)}
                  {loan && event.kind !== 'opened' && (
                    <>
                      {' '}
                      •{' '}
                      {formatAmountWithSymbol(
                        loan.loanAmount,
                        loanSymbol,
                        loanDecimals
                      )}{' '}
                      loan
                    </>
                  )}
                </p>
              </div>
            </div>
            {amount && <p className='font-medium text-right'>{amount}</p>}
          </div>
        )
      })}
    </div>
  )
}
