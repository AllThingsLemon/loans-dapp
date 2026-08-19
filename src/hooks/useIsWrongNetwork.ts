'use client'
import { useAccount } from 'wagmi'
import { loansAddress } from '@/src/generated'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/** True when this build has a real Loans address for the chain. */
export function hasLoansAddress(id: number): boolean {
  // Widened to string on purpose: the generated literal types make a
  // zero-address comparison a type error, but at runtime an unconfigured env
  // var really does yield the zero address.
  const addr = loansAddress[id as keyof typeof loansAddress] as
    | string
    | undefined
  return !!addr && addr !== ZERO_ADDRESS
}

/**
 * Whether the connected wallet is on a chain this build cannot serve.
 *
 * Deliberately reads `useAccount().chain` and NOT `useChainId()`. The latter
 * returns `config.state.chainId`, which wagmi clamps to a configured chain — so
 * it reports a supported chain even while the wallet sits on an unsupported
 * one. Detecting with it left the wrong-network banner silent and the failure
 * surfaced instead as a raw "priceDataFeed returned no data (0x)" error.
 *
 * Every read fails on the wrong network, so anything downstream that would show
 * an error is a symptom of this. Those surfaces consult this hook and stay
 * quiet, leaving one banner with one actionable CTA.
 */
export function useIsWrongNetwork(): boolean {
  const { isConnected, chain } = useAccount()
  return isConnected && (!chain || !hasLoansAddress(chain.id))
}
