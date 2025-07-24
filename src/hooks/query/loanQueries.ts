import { queryOptions } from '@tanstack/react-query'

// Query key factory for loans
export const loanKeys = {
  all: ['loans'] as const,
  byAccount: (account: string) =>
    [...loanKeys.all, 'account', account] as const,
  loanIds: (account: string) =>
    [...loanKeys.byAccount(account), 'ids'] as const,
  loanDetails: (loanId: string) =>
    [...loanKeys.all, 'details', loanId] as const,
  loanConfig: () => [...loanKeys.all, 'config'] as const
}

// Query options for loan IDs
export const loanIdsQueryOptions = (account: string | undefined) =>
  queryOptions({
    queryKey: loanKeys.loanIds(account || ''),
    enabled: !!account,
    staleTime: 60 * 1000 // 1 minute - loan IDs don't change often
  })

// Query options for loan details
export const loanDetailsQueryOptions = (loanId: string) =>
  queryOptions({
    queryKey: loanKeys.loanDetails(loanId),
    staleTime: 30 * 1000 // 30 seconds - loan details update with payments
  })

// Query options for loan config
export const loanConfigQueryOptions = () =>
  queryOptions({
    queryKey: loanKeys.loanConfig(),
    staleTime: 10 * 60 * 1000 // 10 minutes - config rarely changes
  })
