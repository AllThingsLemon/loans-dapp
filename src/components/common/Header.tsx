'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Header() {
  const demo = JSON.parse(process.env.NEXT_PUBLIC_DEMO || 'false')

  return (
    <>
      {demo && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            padding: '10px',
            textAlign: 'center',
            color: '#92400e',
            borderBottom: '1px solid #fde68a'
          }}
        >
          DEMO
        </div>
      )}
      <div className="flex items-center justify-center w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <header className="flex items-center justify-between p-4 min-w-full max-w-screen-xl">
          <div className="flex items-center space-x-4">
            <img
              src="/images/lemon-header-logo.svg"
              alt="Lemon Payments"
              width={200}
              height={30}
              className="h-auto"
            />
          </div>
          <ConnectButton />
        </header>
      </div>
    </>
  )
}
