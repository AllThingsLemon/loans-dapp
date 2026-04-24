'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/src/components/ui/dropdown-menu'
import { chains } from '@/src/config/wagmi'

/**
 * Network selector for the header. Shows the active chain when a wallet is
 * connected and lets the user switch between any of the chains configured in
 * NEXT_PUBLIC_SUPPORTED_CHAINS. Hidden entirely when only one chain is
 * configured — no UI noise on a single-network deployment.
 */
export function ChainSwitcher() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  if (chains.length < 2) return null

  const activeChain = chains.find((c) => c.id === chainId) ?? chains[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className='flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50'
      >
        <span>{activeChain.name}</span>
        <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[200px]'>
        {chains.map((chain) => {
          const isActive = chain.id === activeChain.id
          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => {
                if (!isActive && isConnected) switchChain({ chainId: chain.id })
              }}
              disabled={!isConnected || isActive}
              className='flex items-center justify-between'
            >
              <span>{chain.name}</span>
              {isActive && <Check className='h-3.5 w-3.5' />}
            </DropdownMenuItem>
          )
        })}
        {!isConnected && (
          <p className='px-2 py-1.5 text-xs text-muted-foreground'>
            Connect a wallet to switch networks
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
