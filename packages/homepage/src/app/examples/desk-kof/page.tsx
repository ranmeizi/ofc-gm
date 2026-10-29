'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Text } from 'retro-react'
import { ExampleShell } from '../example-shell'
import { useDemoSession } from '@/hooks/use-demo-session'
import { METHOD_LABELS } from '@/lib/demo-session'

/** 1280×720 画面，按窗口宽度 letterbox */
const FRAME_W = 920
const FRAME_H = Math.round((FRAME_W * 9) / 16) // 518

/**
 * Fork: Magicherry/King-of-Fighters (MIT)
 * 静态页在 /examples/kof/；本页只做 OFC Connection ↔ iframe 按键桥。
 */
export default function DeskKofPage() {
  const session = useDemoSession()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [status, setStatus] = useState('idle')
  const [ready, setReady] = useState(false)
  const connected = session.phase === 'connected' && !!session.connection
  const isHost = session.role === 'answer'

  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const src = useMemo(() => {
    const role = isHost ? 'host' : 'guest'
    return `${base}/examples/kof/index.html?role=${role}&skin0=clerk&skin1=manager`
  }, [base, isHost])

  useEffect(() => {
    if (!connected || !session.connection) {
      setStatus('需要先建立连接')
      return
    }

    const connection = session.connection

    function onMessage(raw: unknown) {
      let msg: { event?: string; data?: unknown }
      try {
        msg = typeof raw === 'string' ? (JSON.parse(raw) as typeof msg) : (raw as typeof msg)
      } catch {
        return
      }
      if (msg.event !== 'keys' || !Array.isArray(msg.data)) return
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ofc-remote-keys', keys: msg.data },
        '*',
      )
    }

    function onWindowMessage(ev: MessageEvent) {
      const msg = ev.data
      if (!msg || typeof msg !== 'object') return
      if (msg.type === 'ofc-ready') {
        setReady(true)
        setStatus('引擎就绪，同步按键中')
        return
      }
      if (msg.type === 'ofc-local-keys' && Array.isArray(msg.keys)) {
        if (!connection.connected) return
        connection.send(JSON.stringify({ event: 'keys', data: msg.keys }))
      }
    }

    connection.on('message', onMessage)
    window.addEventListener('message', onWindowMessage)
    setStatus(isHost ? 'Host · 等待 iframe' : 'Guest · 等待 iframe')

    return () => {
      connection.off('message', onMessage)
      window.removeEventListener('message', onWindowMessage)
      setReady(false)
    }
  }, [connected, session.connection, isHost])

  if (!connected) {
    return (
      <ExampleShell title="desk-kof.exe" width={520} height={220}>
        <Text variant="paragraph">对战要先连上 Peer。</Text>
        <Text variant="small" color="#808080">
          Fork 自 Magicherry/King-of-Fighters（MIT）。两边都用 WASD/J/K，经 OFC 同步。
        </Text>
        <div style={{ marginTop: 12 }}>
          <Link href="/examples">
            <Button type="button" variant="primary" size="small">
              ← 去连接
            </Button>
          </Link>
        </div>
      </ExampleShell>
    )
  }

  return (
    <ExampleShell title="desk-kof.exe" width={FRAME_W + 40} height={FRAME_H + 100}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Text variant="small">
          {isHost ? 'Host' : 'Guest'} · {session.method ? METHOD_LABELS[session.method] : '—'} ·{' '}
          {status}
          {ready ? ' · bridge ok' : ''}
        </Text>
        <div
          style={{
            border: '2px solid',
            borderColor: '#808080 #fff #fff #808080',
            background: '#000',
            width: FRAME_W,
            height: FRAME_H,
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <iframe
            ref={iframeRef}
            title="kof-fork"
            src={src}
            width={FRAME_W}
            height={FRAME_H}
            style={{ width: FRAME_W, height: FRAME_H, border: 0, display: 'block' }}
            allow="gamepad"
          />
        </div>
        <Text variant="small" color="#808080">
          Fork Magicherry/King-of-Fighters · OfficeFighter · ofc-bridge
        </Text>
      </div>
    </ExampleShell>
  )
}
