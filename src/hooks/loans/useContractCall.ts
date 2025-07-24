import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { loanKeys } from '../query/loanQueries'

interface UseContractCallOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  invalidateQueries?: boolean
}

interface ContractCallState {
  isLoading: boolean
  error: Error | null
}

export function useContractCall(options: UseContractCallOptions = {}) {
  const [state, setState] = useState<ContractCallState>({
    isLoading: false,
    error: null
  })

  const queryClient = useQueryClient()

  const executeCall = useCallback(
    async <T>(
      contractCall: () => Promise<T>,
      account?: string
    ): Promise<T | null> => {
      console.log('=== useContractCall executeCall Debug ===')
      console.log('Starting contract call...')
      console.log('account:', account)

      setState({ isLoading: true, error: null })

      try {
        console.log('About to execute contractCall function...')
        const result = await contractCall()
        console.log('Contract call successful, result:', result)

        // Invalidate relevant queries after successful transaction
        if (options.invalidateQueries && account) {
          console.log('Invalidating queries for account:', account)
          await queryClient.invalidateQueries({
            queryKey: loanKeys.byAccount(account)
          })
          console.log('Query invalidation complete')
        }

        setState({ isLoading: false, error: null })
        options.onSuccess?.()
        console.log('Contract call completed successfully')

        return result
      } catch (error) {
        console.error('=== Contract Call Error Details ===')
        console.error('Error occurred during contract call')
        console.error('Error type:', error?.constructor?.name)
        console.error('Error message:', error?.message)
        console.error('Error code:', error?.code)
        console.error('Error details:', error?.details)
        console.error('Error data:', error?.data)
        console.error('Error reason:', error?.reason)
        console.error('Error transaction:', error?.transaction)
        console.error('Raw error object:', error)
        console.error('Error stack:', error?.stack)

        // Check for specific error types
        if (error?.message?.includes('estimation error')) {
          console.error('ESTIMATION ERROR detected - this usually means:')
          console.error('1. Transaction would revert due to validation failure')
          console.error('2. Insufficient gas or token balance')
          console.error('3. Contract function requirements not met')
          console.error('4. Invalid parameters or state')
        }

        if (error?.message?.includes('insufficient funds')) {
          console.error('INSUFFICIENT FUNDS - check token balances and gas')
        }

        if (error?.message?.includes('reverted')) {
          console.error(
            'TRANSACTION REVERTED - check contract validation logic'
          )
        }

        console.error('================================')

        const contractError =
          error instanceof Error ? error : new Error('Unknown contract error')
        setState({ isLoading: false, error: contractError })
        options.onError?.(contractError)
        return null
      }
    },
    [queryClient, options]
  )

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null })
  }, [])

  return {
    executeCall,
    isLoading: state.isLoading,
    error: state.error,
    reset
  }
}
