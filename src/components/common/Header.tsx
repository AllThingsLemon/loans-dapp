'use client'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from '@/src/components/ui/navigation-menu'
import { Button } from '@/src/components/ui/button'
import Link from 'next/link'
import { navigationMenuTriggerStyle } from '@/src/components/ui/navigation-menu'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Header() {
  const currentPath = usePathname()
  const demo = JSON.parse(process.env.NEXT_PUBLIC_DEMO || 'false')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { href: '/', label: 'Overview' },
    { href: 'https://docs.in8.com/overview', label: 'Docs', external: true }
  ]

  return (
    <>
      {demo && (
        <div
          style={{
            backgroundColor: 'yellow',
            padding: '10px',
            textAlign: 'center',
            color: 'black'
          }}
        >
          DEMO
        </div>
      )}
      <div className="flex items-center justify-center w-full">
        <header className="flex items-center justify-between p-4 bg-dark text-white min-w-full max-w-screen-xl">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="p-0 md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <NavigationMenu className="hidden md:block">
              <NavigationMenuList>
                {menuItems.map((item) => (
                  <NavigationMenuItem key={item.href}>
                    {item.external ? (
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                      </NavigationMenuLink>
                    ) : (
                      <Link href={item.href} legacyBehavior passHref>
                        <NavigationMenuLink
                          className={navigationMenuTriggerStyle({
                            active: currentPath === item.href
                          })}
                        >
                          {item.label}
                        </NavigationMenuLink>
                      </Link>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {/* <WalletConnectButton /> */}
          <ConnectButton />
        </header>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-dark text-white p-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${currentPath === item.href ? 'bg-accent' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
