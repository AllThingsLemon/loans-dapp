import { ReturnsPanel } from '@/src/components/liquidity/ReturnsPanel'

export const metadata = {
  title: 'Protocol Performance - LemLoans'
}

/**
 * The disconnected Liquidity page's returns panel on its own, with every
 * yield figure stripped so only Performance is shown. Rendered the same
 * whether or not a wallet is connected — the figures are protocol-wide.
 */
export default function LendingPerformancePage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mx-auto max-w-4xl py-4'>
          <ReturnsPanel showCurrentYield={false} />
        </div>
      </div>
    </div>
  )
}
