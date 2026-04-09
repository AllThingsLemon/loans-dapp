'use client'

export default function Footer() {
  return (
    <div className='flex items-center justify-center w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto'>
      <footer className='flex items-center justify-center p-4 min-w-full max-w-screen-xl text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} LemLoans. All rights reserved.</p>
      </footer>
    </div>
  )
}
