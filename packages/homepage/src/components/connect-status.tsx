'use client'

import Link from 'next/link'
import { Button } from 'retro-react'
import { useDemoSession } from '@/hooks/use-demo-session'
import { METHOD_LABELS, resetDemoSession } from '@/lib/demo-session'

const DOT: Record<string, string> = {
  idle: '#808080',
  configuring: '#808000',
  connecting: '#808000',
  connected: '#008000',
  error: '#800000',
}

export function ConnectStatus() {
  const session = useDemoSession()
  const methodLabel = session.method ? METHOD_LABELS[session.method] : '—'
  const roleLabel = session.role ?? '—'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginLeft: 'auto',
        flexShrink: 0,
        padding: '2px 6px',
        background: '#c0c0c0',
        border: '2px solid',
        borderColor: '#fff #808080 #808080 #fff',
        fontSize: 12,
        whiteSpace: 'nowrap',
        maxWidth: 'min(560px, 55vw)',
        overflow: 'hidden',
      }}
      title={session.error ?? session.detail}
    >
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          background: DOT[session.phase] ?? DOT.idle,
          border: '1px solid #000',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <strong style={{ fontSize: 12 }}>CONNECT</strong>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 12,
        }}
      >
        {methodLabel} · {roleLabel} · {session.detail}
      </span>
      <Link href="/examples" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <Button type="button" size="small" variant="flat">
          管理
        </Button>
      </Link>
      {session.phase !== 'idle' && (
        <Button type="button" size="small" variant="secondary" onClick={() => resetDemoSession()}>
          断开
        </Button>
      )}
    </div>
  )
}
