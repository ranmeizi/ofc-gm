'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, Text } from 'retro-react'
import { DOC_PAGES, docsHref } from '@/lib/docs'

export function DocsShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ''

  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-title">Docs</div>
        <nav className="docs-sidebar-nav">
          {DOC_PAGES.map((page) => {
            const href = docsHref(page.slug)
            const active = pathname === href
            return (
              <Link key={href} href={href} className="docs-nav-link">
                <Button
                  type="button"
                  variant={active ? 'primary' : 'flat'}
                  sx={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  {page.title}
                </Button>
              </Link>
            )
          })}
        </nav>
      </aside>

      <section className="docs-content">
        <header className="docs-content-bar">
          <Text variant="body1" sx={{ fontWeight: 700 }}>
            {title}
          </Text>
        </header>
        <article className="docs-content-body mdx-body">{children}</article>
      </section>
    </div>
  )
}
