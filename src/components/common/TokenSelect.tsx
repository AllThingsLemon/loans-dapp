'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { erc20Abi } from 'viem'
import { useAccount, useReadContracts } from 'wagmi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/Select'
import { formatTokenAmount, formatSignificantValue } from '../../utils/decimals'

/**
 * Local icon per token symbol (public/images/tokens, plus the LemLoans logo
 * for LMLN). Unknown symbols fall back to a lettered circle — never a broken
 * image.
 */
const TOKEN_ICONS: Record<string, string> = {
  LEMX: '/images/tokens/lemx.png',
  WLEMX: '/images/tokens/lemx.png',
  LMLN: '/images/tokens/lmln.png',
  BTC: '/images/tokens/btc.png',
  BTCB: '/images/tokens/btc.png',
  ETH: '/images/tokens/eth.png',
  WETH: '/images/tokens/eth.png',
  BNB: '/images/tokens/bnb.png',
  WBNB: '/images/tokens/bnb.png',
  SOL: '/images/tokens/sol.png',
  XRP: '/images/tokens/xrp.png',
  USDT: '/images/tokens/usdt.png',
  ADA: '/images/tokens/ada.png',
  ATOM: '/images/tokens/atom.png',
  AVAX: '/images/tokens/avax.png',
  DOT: '/images/tokens/dot.png'
}

function TokenIcon({ symbol }: { symbol: string | undefined }) {
  const src = symbol ? TOKEN_ICONS[symbol.toUpperCase()] : undefined
  if (src) {
    return (
      <Image
        src={src}
        alt=''
        width={20}
        height={20}
        className='h-5 w-5 shrink-0 rounded-full'
      />
    )
  }
  return (
    <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground'>
      {symbol?.[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

export interface TokenSelectOption {
  address: `0x${string}`
  /** Known symbol/decimals skip the on-chain metadata read. */
  symbol?: string
  decimals?: number
}

interface TokenSelectProps {
  tokens: TokenSelectOption[]
  value: `0x${string}` | undefined
  onChange: (address: `0x${string}`) => void
  placeholder?: string
  disabled?: boolean
  /** Extra classes for the trigger (e.g. the landing page's dark styling). */
  triggerClassName?: string
}

/**
 * Dropdown token picker: icon on the left, symbol beside it, and — when a
 * wallet is connected — that wallet's balance right-aligned on each row.
 * Metadata (symbol/decimals) and balances are fetched in one multicall
 * batch each; rows render immediately and fill in as reads land.
 */
export function TokenSelect({
  tokens,
  value,
  onChange,
  placeholder = 'Select Token',
  disabled,
  triggerClassName
}: TokenSelectProps) {
  const { address: account } = useAccount()

  // Metadata for tokens the caller couldn't provide it for.
  const metaTargets = tokens.filter(
    (t) => t.symbol === undefined || t.decimals === undefined
  )
  const { data: metaRaw } = useReadContracts({
    contracts: metaTargets.flatMap((t) => [
      { address: t.address, abi: erc20Abi, functionName: 'symbol' as const },
      { address: t.address, abi: erc20Abi, functionName: 'decimals' as const }
    ]),
    query: { enabled: metaTargets.length > 0 }
  })

  const { data: balancesRaw } = useReadContracts({
    contracts: tokens.map((t) => ({
      address: t.address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [account!] as const
    })),
    query: { enabled: !!account && tokens.length > 0 }
  })

  const rows = useMemo(() => {
    const meta = new Map<string, { symbol?: string; decimals?: number }>()
    metaTargets.forEach((t, i) => {
      meta.set(t.address.toLowerCase(), {
        symbol: metaRaw?.[i * 2]?.result as string | undefined,
        decimals: metaRaw?.[i * 2 + 1]?.result as number | undefined
      })
    })
    return tokens.map((t, i) => {
      const m = meta.get(t.address.toLowerCase())
      const symbol = t.symbol ?? m?.symbol
      const decimals = t.decimals ?? m?.decimals
      const balanceRaw = balancesRaw?.[i]?.result as bigint | undefined
      const balance =
        balanceRaw !== undefined && decimals !== undefined
          ? formatSignificantValue(formatTokenAmount(balanceRaw, decimals))
          : undefined
      return { address: t.address, symbol, balance }
    })
  }, [tokens, metaTargets, metaRaw, balancesRaw])

  const selected = rows.find(
    (r) => r.address.toLowerCase() === value?.toLowerCase()
  )

  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => onChange(v as `0x${string}`)}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder}>
          {selected && (
            <span className='flex items-center gap-2'>
              <TokenIcon symbol={selected.symbol} />
              <span className='font-medium'>
                {selected.symbol ?? selected.address.slice(0, 6) + '…'}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {rows.map((row) => (
          <SelectItem key={row.address} value={row.address}>
            <span className='flex w-full min-w-48 items-center gap-2'>
              <TokenIcon symbol={row.symbol} />
              <span className='font-medium'>
                {row.symbol ?? row.address.slice(0, 6) + '…'}
              </span>
              {row.balance !== undefined && (
                <span className='ml-auto pl-6 text-xs tabular-nums text-muted-foreground'>
                  {row.balance}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
