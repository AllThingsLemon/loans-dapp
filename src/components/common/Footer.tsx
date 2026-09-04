'use client'

export default function Footer() {
  return (
    <div className='flex items-center justify-center w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto'>
      <footer className='flex w-full max-w-screen-xl flex-col items-center gap-6 px-4 py-8 text-center sm:px-6'>
        {/* Copyright / operator line — format mirrors lemloans.io */}
        <p className='max-w-3xl text-xs leading-relaxed text-foreground sm:text-sm'>
          &copy; 2026{' '}
          <a
            href='https://lemloans.io'
            target='_blank'
            rel='noopener noreferrer'
            className='font-medium text-yellow-600 hover:underline dark:text-yellow-500'
          >
            LemLoans.io
          </a>{' '}
          &mdash; Interface to the LemLoans decentralized, non-custodial
          protocol. Operated by Lemon Marketing FZ-LLC, a UAE company led by
          H.H. Shaikh Khaled Ebrahim Hamad Ebrahim Alqassimi, a member of the
          Royal Family of Ras Al Khaimah, UAE.
        </p>

        <hr className='w-16 border-border/60' />

        {/* Protocol disclosure. Set small and muted: it has to be present on
            every page without competing with the page it sits under. */}
        <div className='max-w-4xl space-y-4 text-[10px] leading-relaxed text-muted-foreground sm:text-xs'>
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
            contracts. Lemon Marketing FZ-LLC provides and operates the{' '}
            <a
              href='https://lemloans.io'
              target='_blank'
              rel='noopener noreferrer'
              className='underline hover:text-foreground'
            >
              LemLoans.io
            </a>{' '}
            website and user interface but does not custody user assets, act as
            a lender or borrower, or control transactions executed through the
            Protocol. Users interact through their own self-custodied wallets
            and remain responsible for determining whether and how to use the
            Protocol.
          </p>
        </div>
      </footer>
    </div>
  )
}
