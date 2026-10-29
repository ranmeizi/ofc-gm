'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, DocumentUpload, Text } from 'retro-react'
import {
  startHost,
  type ClientHandle,
  type ServerModule,
} from '@ofc-gm/framework'
import { ExampleShell } from '../example-shell'
import { useDemoSession } from '@/hooks/use-demo-session'
import { METHOD_LABELS } from '@/lib/demo-session'

type FileCard = {
  id: string
  from: string
  name: string
  size: number
  mime: string
  dataUrl: string
  at: number
}

const sunken: React.CSSProperties = {
  border: '2px solid',
  borderColor: '#808080 #fff #fff #808080',
  background: '#ffffe0',
}

async function fileToPayload(file: File) {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  const base64 = btoa(binary)
  return {
    type: 'file' as const,
    name: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
    base64,
  }
}

export default function FileTransferExamplePage() {
  const session = useDemoSession()
  const apiRef = useRef<ClientHandle | null>(null)
  const [files, setFiles] = useState<FileCard[]>([])
  const [picked, setPicked] = useState<File | null>(null)
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

    const onFile = (data: unknown) => {
      try {
        const msg = JSON.parse(String(data)) as {
          type: string
          from: string
          name: string
          size: number
          mime: string
          base64: string
          at: number
          id: string
        }
        if (msg.type !== 'file') return
        setFiles((prev) => [
          ...prev,
          {
            id: msg.id,
            from: msg.from,
            name: msg.name,
            size: msg.size,
            mime: msg.mime,
            dataUrl: `data:${msg.mime};base64,${msg.base64}`,
            at: msg.at,
          },
        ])
      } catch {
        // ignore
      }
    }

    const server: ServerModule = {
      onMessage(s, clientId, data) {
        try {
          const parsed = JSON.parse(String(data)) as { type?: string }
          if (parsed.type !== 'file') return
          s.broadcast(
            JSON.stringify({
              ...parsed,
              from: clientId,
              at: Date.now(),
              id: `${clientId}-${Date.now()}`,
            }),
          )
        } catch {
          // ignore
        }
      },
    }

    if (session.role === 'answer') {
      const runtime = startHost({
        connection,
        server,
        client: {
          onConnect(c) {
            apiRef.current = c
          },
          onMessage: onFile,
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

    const onMessage = (data: unknown) => onFile(data)
    connection.on('message', onMessage)
    apiRef.current = { send: (data) => connection.send(data) }
    setStatus('Guest 已挂上连接')
    return () => {
      connection.off('message', onMessage)
      apiRef.current = null
    }
  }, [connected, session.connection, session.role])

  async function send() {
    if (!apiRef.current || !picked) return
    const payload = await fileToPayload(picked)
    apiRef.current.send(JSON.stringify(payload))
    setPicked(null)
  }

  if (!connected) {
    return (
      <ExampleShell title="file-transfer.exe" width={420} height={200}>
        <Text variant="paragraph">还没建立连接。</Text>
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
    <ExampleShell title="file-transfer.exe" width={480} height={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        <Text variant="small">
          you=<strong>{you}</strong> · {session.method ? METHOD_LABELS[session.method] : '—'} ·{' '}
          {status}
        </Text>
        <DocumentUpload accept="*/*" onChange={(file) => setPicked(file)} sx={{ width: '100%' }} />
        <Button type="button" variant="primary" size="small" disabled={!picked} onClick={() => void send()}>
          发送文件
        </Button>
        <Text variant="small" sx={{ fontWeight: 700 }}>
          收到的文件
        </Text>
        <div style={{ flex: 1, minHeight: 120, overflow: 'auto', ...sunken, padding: 8 }}>
          {files.length === 0 ? (
            <Text variant="small" color="#808080">
              还没有文件
            </Text>
          ) : (
            files.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                <span>
                  <strong>{f.from}</strong>: {f.name} ({f.size} B)
                </span>
                <a href={f.dataUrl} download={f.name}>
                  下载
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </ExampleShell>
  )
}
