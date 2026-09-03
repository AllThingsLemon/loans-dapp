'use client'

export default function Footer() {
  return (
    <div className='flex items-center justify-center w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto'>
      <footer className='flex w-full max-w-screen-xl flex-col gap-4 px-4 py-6 text-muted-foreground sm:px-6'>
        {/* Protocol disclosure. Set small and muted: it has to be present on
            every page without competing with the page it sits under. */}
        <div className='mx-auto max-w-4xl space-y-3 text-left text-[10px] leading-relaxed sm:text-xs'>
          <p>
            LemLoans provides a user interface for accessing the decentralized,
            non-custodial LemLoans Protocol. The Protocol consists of
            open-source smart contracts deployed on permissionless public
            blockchain networks. Once deployed and made immutable, the Protocol
            operates according to the rules encoded in those smart contracts.
            Users may interact with the Protocol through this website, another
            compatible interface, or directly through the blockchain.
          </p>
          <p>
            The LemLoans Protocol operates autonomously through its smart
            contracts. The website and user interface are provided by Lemon
            Marketing LLC FZCO, led by H.H. Shaikh Khaled Ebrahim Hamed Ebrahim
            Al Qassimi. Lemon Marketing does not custody user assets, act as a
            lender or borrower, or control transactions executed through the
            Protocol. Users interact through their own self-custodied wallets
            and remain responsible for determining whether and how to use the
            Protocol.
          </p>
        </div>
      </footer>
    </div>
  )
}
