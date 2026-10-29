'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Input, Text } from 'retro-react'
import {
  startHost,
  type ClientHandle,
  type ServerModule,
} from '@ofc-gm/framework'
import { ExampleShell } from '../example-shell'
import { useDemoSession } from '@/hooks/use-demo-session'
import { METHOD_LABELS } from '@/lib/demo-session'

type ChatMsg = {
  from: string
  text: string
  at: number
}

const sunken: React.CSSProperties = {
  border: '2px solid',
  borderColor: '#808080 #fff #fff #808080',
  background: '#ffffe0',
}

export default function ChatExamplePage() {
  const session = useDemoSession()
  const apiRef = useRef<ClientHandle | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('idle')

  const connected = session.phase === 'connected' && !!session.connection
  const you = session.role === 'offer' ? 'guest' : 'host'

  useEffect(() => {
    if (!connected || !session.connection) {
      apiRef.current = null
      setStatus('需要先在 Examples 建立连接')
      return
    }

    const connection = session.connection
    const server: ServerModule = {
      onMessage(s, clientId, data) {
        let text = ''
        try {
          const parsed = JSON.parse(String(data)) as { text?: string }
          text = parsed.text ?? String(data)
        } catch {
          text = String(data)
        }
        s.broadcast(
          JSON.stringify({
            type: 'chat',
            from: clientId,
            text,
            at: Date.now(),
          }),
        )
      },
    }

    const onMsg = (data: unknown) => {
      try {
        const msg = JSON.parse(String(data)) as ChatMsg & { type: string }
        if (msg.type === 'chat') {
          setMessages((prev) => [...prev, msg])
        }
      } catch {
        // ignore
      }
    }

    // Host(answer)：权威房间；Guest(offer)：只跑 client，把 connection 消息当广播结果
    if (session.role === 'answer') {
      const runtime = startHost({
        connection,
        server,
        client: {
          onConnect(c) {
            apiRef.current = c
          },
          onMessage: onMsg,
        },
        hostPlayerId: 'host',
        guestPlayerId: 'guest',
      })
      setStatus('Host 房间已开')
      return () => {
        runtime.stop()
        apiRef.current = null
      }
    }

    const onMessage = (data: unknown) => onMsg(data)
    connection.on('message', onMessage)
    apiRef.current = {
      send: (data) => connection.send(data),
    }
    setStatus('Guest 已挂上连接')
    return () => {
      connection.off('message', onMessage)
      apiRef.current = null
    }
  }, [connected, session.connection, session.role])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  function send() {
    const text = draft.trim()
    if (!apiRef.current || !text) return
    apiRef.current.send(JSON.stringify({ text }))
    setDraft('')
  }

  if (!connected) {
    return (
      <ExampleShell title="chat-room.exe" width={420} height={200}>
        <Text variant="paragraph">还没建立连接。</Text>
        <Text variant="small" color="#808080">
          顶栏 CONNECT 会显示状态。请先回 Examples 选信令方式。
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
    <ExampleShell title="chat-room.exe" width={480} height={360}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        <Text variant="small">
          you=<strong>{you}</strong> · {session.method ? METHOD_LABELS[session.method] : '—'} ·{' '}
          {status}
        </Text>
        <div
          ref={listRef}
          style={{
            flex: 1,
            minHeight: 160,
            overflow: 'auto',
            ...sunken,
            padding: 8,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          {messages.length === 0 ? (
            <Text variant="small" color="#808080">
              暂无消息 — 另开一端用互补角色连同一房间 / 交换信令
            </Text>
          ) : (
            messages.map((m) => (
              <div key={`${m.at}-${m.from}-${m.text}`}>
                <strong>{m.from}</strong>: {m.text}
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            placeholder="输入消息…"
            size="small"
            variant="classic"
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Button type="button" variant="primary" size="small" onClick={send}>
            发送
          </Button>
        </div>
      </div>
    </ExampleShell>
  )
}
