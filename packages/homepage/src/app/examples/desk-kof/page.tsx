'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Text } from 'retro-react'
import { ExampleShell } from '../example-shell'
import { useDemoSession } from '@/hooks/use-demo-session'
import { METHOD_LABELS } from '@/lib/demo-session'

const FRAME_W = 960
const FRAME_H = 540
/** DataChannel 缓冲超过此值就丢帧，避免按键被大图堵住 */
const FRAME_BUFFER_LIMIT = 512 * 1024

function dataChannelBuffered(connection: {
  peerConnection?: { channel?: RTCDataChannel }
}): number {
  return connection.peerConnection?.channel?.bufferedAmount ?? 0
}

/**
 * Host(answer)=MAME 1P + 推画面；Guest(offer)=收画面 + 发 2P 键。
 * 模拟器：lrusso/MAME；Host 自动加载 kof97.zip（copy:mame 合并 neogeo BIOS）。
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
    return `${base}/examples/mame-kof/index.html?role=${role}`
  }, [base, isHost])

  useEffect(() => {
    if (!connected || !session.connection) {
      setStatus('需要先建立连接')
      return
    }

    const connection = session.connection

    function onPeerMessage(raw: unknown) {
      let msg: { type?: string; action?: string; down?: boolean; jpeg?: string }
      try {
        msg = typeof raw === 'string' ? (JSON.parse(raw) as typeof msg) : (raw as typeof msg)
      } catch {
        return
      }
      const win = iframeRef.current?.contentWindow
      if (!win) return

      // Guest→Host：2P 按键（优先投递）
      if (msg.type === 'p2-key' && isHost) {
        win.postMessage(
          { type: 'ofc-p2-key', action: msg.action, down: !!msg.down },
          '*',
        )
        return
      }
      // Host→Guest：画面帧
      if (msg.type === 'frame' && typeof msg.jpeg === 'string' && !isHost) {
        win.postMessage({ type: 'ofc-frame', jpeg: msg.jpeg }, '*')
      }
    }

    function onWindowMessage(ev: MessageEvent) {
      const msg = ev.data
      if (!msg || typeof msg !== 'object') return

      if (msg.type === 'ofc-ready') {
        setReady(true)
        setStatus(
          msg.role === 'host'
            ? msg.waitingRom
              ? 'Host 就绪 · 加载 KOF97…'
              : 'Host · KOF97 运行中（失焦不暂停）'
            : 'Guest 就绪 · 等待画面',
        )
        return
      }

      if (!connection.connected) return

      // iframe → OFC
      if (msg.type === 'ofc-p2-key' && !isHost) {
        connection.send(
          JSON.stringify({
            type: 'p2-key',
            action: msg.action,
            down: !!msg.down,
          }),
        )
        return
      }
      if (msg.type === 'ofc-frame' && isHost && typeof msg.jpeg === 'string') {
        const buffered = dataChannelBuffered(
          connection as unknown as { peerConnection?: { channel?: RTCDataChannel } },
        )
        if (buffered > FRAME_BUFFER_LIMIT) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'ofc-throttle', ms: 80 },
            '*',
          )
          return
        }
        connection.send(
          JSON.stringify({
            type: 'frame',
            jpeg: msg.jpeg,
            t: msg.t,
          }),
        )
      }
    }

    connection.on('message', onPeerMessage)
    window.addEventListener('message', onWindowMessage)
    setStatus(isHost ? 'Host(1P) · 挂载模拟器' : 'Guest(2P) · 挂载接收端')

    return () => {
      connection.off('message', onPeerMessage)
      window.removeEventListener('message', onWindowMessage)
      setReady(false)
    }
  }, [connected, session.connection, isHost])

  if (!connected) {
    return (
      <ExampleShell title="desk-kof.exe" width={520} height={240}>
        <Text variant="paragraph">先 CONNECT，再进拳皇 demo。</Text>
        <Text variant="small" color="#808080">
          Host(answer)=1P 自动加载 KOF97 并推流；Guest(offer)=2P 发键、收画面。需先
          `pnpm --filter homepage copy:mame`。
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
    <ExampleShell title="desk-kof.exe" width={FRAME_W + 40} height={FRAME_H + 110}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Text variant="small">
          {isHost ? 'Host · 1P' : 'Guest · 2P'} ·{' '}
          {session.method ? METHOD_LABELS[session.method] : '—'} · {status}
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
            title="mame-kof"
            src={src}
            width={FRAME_W}
            height={FRAME_H}
            style={{ width: FRAME_W, height: FRAME_H, border: 0, display: 'block' }}
            allow="autoplay; gamepad"
          />
        </div>
        <Text variant="small" color="#808080">
          {isHost
            ? 'WASD · J/K/U/I · Enter Start · 1 投币 · 失焦也会继续跑（给 2P 留输入）'
            : '同一套键：WASD · J/K/U/I · Enter Start · 1 投币 · 先点画面聚焦'}
        </Text>
      </div>
    </ExampleShell>
  )
}
