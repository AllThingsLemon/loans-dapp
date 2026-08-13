'use client'

export default function Footer() {
  return (
    <div className='flex items-center justify-center w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto'>
      <footer className='flex w-full max-w-screen-xl flex-col gap-4 px-4 py-6 text-muted-foreground sm:px-6'>
        {/* Protocol disclosure. Set small and muted: it has to be present on
            every page without competing with the page it sits under. */}
        <div className='mx-auto max-w-4xl space-y-3 text-left text-[10px] leading-relaxed sm:text-xs'>
          <p>
            LemLoans provides information and resources regarding the
            fundamentals and functionality of the decentralized, non-custodial
            liquidity protocol known as the LemLoans Protocol (the
            &ldquo;LemLoans Protocol&rdquo; or the &ldquo;Protocol&rdquo;). The
            Protocol consists of open-source, self-executing smart contracts
            deployed on permissionless public blockchain networks.
          </p>
          <p>
            The LemLoans Protocol operates autonomously through immutable smart
            contracts. No individual, company, foundation, developer, marketing
            organization, or other entity controls, operates, manages, modifies,
            or has discretionary authority over the Protocol or transactions
            executed through it. Users interact directly with the Protocol
            through their own self-custodied wallets and retain responsibility
            for determining whether and how to interact with the Protocol.
          </p>
        </div>
        <p className='text-center text-sm'>
          &copy; {new Date().getFullYear()} LemLoans. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
