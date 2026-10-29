'use client'

import Link from 'next/link'
import { Button, Window } from 'retro-react'

export function ExampleShell({
  title,
  width = 520,
  height = 420,
  children,
}: {
  title: string
  width?: number
  height?: number
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 12, padding: 8 }}>
      <Link href="/examples" style={{ width: 'fit-content' }}>
        <Button type="button" variant="flat">
          ← Examples
        </Button>
      </Link>

      <Window
        title={title}
        closable={false}
        resizable
        defaultPosition={{ x: 0, y: 0 }}
        defaultSize={{ width, height }}
        bounds={false}
        sx={{ position: 'relative' }}
      >
        <div style={{ padding: 10, height: '100%', boxSizing: 'border-box' }}>{children}</div>
      </Window>
    </div>
  )
}
