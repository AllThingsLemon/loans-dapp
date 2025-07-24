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
      setState({ isLoading: true, error: null })

      try {
        const result = await contractCall()

        // Invalidate relevant queries after successful transaction
        if (options.invalidateQueries && account) {
          await queryClient.invalidateQueries({
            queryKey: loanKeys.byAccount(account)
          })
        }

        setState({ isLoading: false, error: null })
        options.onSuccess?.()

        return result
      } catch (error) {
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
