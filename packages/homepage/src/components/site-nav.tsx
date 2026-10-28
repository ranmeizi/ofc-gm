'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavItem, Navbar } from 'retro-react'

const ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
  { href: '/examples', label: 'Examples' },
]

export function SiteNav() {
  const pathname = usePathname() ?? ''

  return (
    <Navbar variant="menu-bar" style={{ width: '100%' }}>
      {ITEMS.map((item) => {
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <NavItem key={item.href}>
            <Link
              href={item.href}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: active ? 700 : 400,
              }}
            >
              {item.label}
            </Link>
          </NavItem>
        )
      })}
    </Navbar>
  )
}
