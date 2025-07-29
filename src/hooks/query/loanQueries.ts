import { queryOptions } from '@tanstack/react-query'

// Query key factory for loans - updated to match actual usage patterns
export const loanKeys = {
  all: ['loans'] as const,
  byAccount: (account: string) =>
    [...loanKeys.all, 'account', account] as const,
  loanIds: (account: string) =>
    [...loanKeys.byAccount(account), 'ids'] as const,
  // This matches the actual pattern used in useUserLoans: ['loan', loanId, 'fullData']
  loanDetails: (loanId: string) =>
    ['loan', loanId, 'fullData'] as const,
  loanConfig: () => [...loanKeys.all, 'config'] as const,
  // Helper to get all loan detail keys for an account
  allLoanDetails: (loanIds: string[]) =>
    loanIds.map(id => loanKeys.loanDetails(id))
}

// Query options for loan IDs
export const loanIdsQueryOptions = (account: string | undefined) =>
  queryOptions({
    queryKey: loanKeys.loanIds(account || ''),
    enabled: !!account,
    staleTime: 0 // Immediate updates after mutations
  })

// Query options for loan details
export const loanDetailsQueryOptions = (loanId: string) =>
  queryOptions({
    queryKey: loanKeys.loanDetails(loanId),
    staleTime: 0 // Immediate updates after mutations
  })

// Query options for loan config
export const loanConfigQueryOptions = () =>
  queryOptions({
    queryKey: loanKeys.loanConfig(),
    staleTime: 5 * 60 * 1000 // 5 minutes - config rarely changes but allow some caching
  })
