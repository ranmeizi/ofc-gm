'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Input } from 'retro-react'
import {
  createHostSession,
  PeerConnection,
  type PeerNetwork,
  type PeerRole,
} from '@ofc-gm/framework'
import {
  beginConnect,
  markConnected,
  registerHostSession,
  setConnectError,
  setConnectProgress,
} from '@/lib/demo-session'
import { SignalClient } from '../lib/signal-client'

const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'left',
  width: '100%',
}

const sunken: React.CSSProperties = {
  border: '2px solid',
  borderColor: '#808080 #fff #fff #808080',
  background: '#ffffe0',
  padding: 8,
  fontFamily: 'monospace',
  fontSize: 11,
  width: '100%',
  boxSizing: 'border-box',
}

function RolePicker({
  role,
  onChange,
  disabled,
}: {
  role: PeerRole
  onChange: (r: PeerRole) => void
  disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: '#ffffe0', fontSize: 13 }}>角色</span>
      <select
        value={role}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PeerRole)}
        style={{ fontSize: 13, padding: '2px 4px' }}
      >
        <option value="answer">Host (answer)</option>
        <option value="offer">Guest (offer)</option>
      </select>
    </div>
  )
}

/** 1. WebSocket 信令 */
export function WsPanel() {
  const [role, setRole] = useState<PeerRole>('answer')
  const [roomId, setRoomId] = useState('demo')
  const [wsUrl, setWsUrl] = useState('ws://127.0.0.1:8787/signal')
  const [log, setLog] = useState('需要另开终端跑 pnpm dev:ws\n')
  const [busy, setBusy] = useState(false)
  const clientRef = useRef(new SignalClient())
  const offerSent = useRef(false)
  const answerSent = useRef(false)
  const roleRef = useRef(role)
  roleRef.current = role

  useEffect(() => {
    return () => {
      clientRef.current.leave()
      clientRef.current.close()
    }
  }, [])

  function append(line: string) {
    const t = new Date().toLocaleTimeString()
    setLog((prev) => `${prev}[${t}] ${line}\n`)
  }

  async function start() {
    setBusy(true)
    offerSent.current = false
    answerSent.current = false
    beginConnect({ method: 'ws', role, network: 'lan', detail: '连接 WS…' })

    const session = createHostSession({ role, network: 'lan' })
    registerHostSession(session)
    session.whenReady().then(
      (conn) => {
        markConnected(conn, `WS · room ${roomId}`)
        append('DataChannel open ✓')
        setBusy(false)
      },
      (err) => {
        setConnectError(err instanceof Error ? err.message : String(err))
        setBusy(false)
      },
    )

    const client = clientRef.current
    client.setHandlers({
      onOpen: () => {
        setConnectProgress('WS 已连，加入房间…')
        append('WS open')
      },
      onClose: () => append('WS close'),
      onError: (e) => append(`WS error: ${e instanceof Error ? e.message : String(e)}`),
      onMessage: async (msg) => {
        if (msg.type === 'welcome') {
          append(`welcome peerId=${msg.peerId}`)
          return
        }
        if (msg.type === 'joined') {
          append(`joined room=${msg.roomId} peers=${msg.peers.length}`)
          setConnectProgress('已入房，交换信令…')
          if (roleRef.current === 'offer' && msg.peers.length >= 1) {
            await sendOffer(session, client)
          }
          return
        }
        if (msg.type === 'peer-joined') {
          append(`peer-joined ${msg.peerId}`)
          if (roleRef.current === 'offer') await sendOffer(session, client)
          return
        }
        if (msg.type === 'signal') {
          const raw =
            typeof msg.sdp === 'string' ? msg.sdp : JSON.stringify(msg.sdp)
          let parsed: { type?: string }
          try {
            parsed = JSON.parse(raw) as { type?: string }
          } catch {
            append('无法解析 signal')
            return
          }
          try {
            if (roleRef.current === 'answer' && parsed.type === 'offer') {
              await session.acceptRemoteSignal(raw)
              append('← offer accepted')
              if (!answerSent.current) {
                answerSent.current = true
                const answer = await session.generateLocalSignal()
                client.signal(JSON.parse(answer))
                append('→ answer sent')
              }
            } else if (roleRef.current === 'offer' && parsed.type === 'answer') {
              await session.acceptRemoteSignal(raw)
              append('← answer accepted')
            }
          } catch (e) {
            append(`signal 失败: ${e instanceof Error ? e.message : String(e)}`)
            setConnectError(e instanceof Error ? e.message : String(e))
          }
        }
        if (msg.type === 'error') {
          append(`server error: ${msg.message}`)
          setConnectError(msg.message)
        }
      },
    })

    try {
      await client.connect(wsUrl)
      client.join(roomId, role)
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      append(m)
      setConnectError(m)
      setBusy(false)
    }
  }

  async function sendOffer(
    session: ReturnType<typeof createHostSession>,
    client: SignalClient,
  ) {
    if (offerSent.current) return
    offerSent.current = true
    try {
      const offer = await session.generateLocalSignal()
      client.signal(JSON.parse(offer))
      append('→ offer sent')
    } catch (e) {
      offerSent.current = false
      append(`offer 失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div style={{ ...field, gap: 10, maxWidth: 420 }}>
      <RolePicker role={role} onChange={setRole} disabled={busy} />
      <label style={{ color: '#ffffe0', fontSize: 13 }}>
        WS URL
        <Input
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          size="small"
          variant="terminal"
          disabled={busy}
          sx={{ width: '100%', marginTop: '4px' }}
        />
      </label>
      <label style={{ color: '#ffffe0', fontSize: 13 }}>
        Room
        <Input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          size="small"
          variant="terminal"
          disabled={busy}
          sx={{ width: '100%', marginTop: '4px' }}
        />
      </label>
      <Button type="button" variant="primary" size="medium" disabled={busy} onClick={() => void start()}>
        连接并交换信令
      </Button>
      <pre style={{ ...sunken, maxHeight: 140, overflow: 'auto', margin: 0 }}>{log}</pre>
    </div>
  )
}

/** 2. 手动交换信令 */
export function ManualPanel({ network = 'lan' as PeerNetwork }: { network?: PeerNetwork }) {
  const [role, setRole] = useState<PeerRole>('answer')
  const [localSignal, setLocalSignal] = useState('')
  const [remoteSignal, setRemoteSignal] = useState('')
  const [busy, setBusy] = useState(false)
  const sessionRef = useRef<ReturnType<typeof createHostSession> | null>(null)

  function boot() {
    beginConnect({
      method: network === 'internet' ? 'stun' : 'manual',
      role,
      network,
      detail: '已建 Peer，等待信令…',
    })
    const session = createHostSession({ role, network })
    sessionRef.current = session
    registerHostSession(session)
    session.whenReady().then(
      (conn) => {
        markConnected(conn, network === 'internet' ? 'STUN · 已连接' : '手动信令 · 已连接')
        setBusy(false)
      },
      (err) => {
        setConnectError(err instanceof Error ? err.message : String(err))
        setBusy(false)
      },
    )
    setLocalSignal('')
    setRemoteSignal('')
  }

  async function genLocal() {
    if (!sessionRef.current) boot()
    const session = sessionRef.current!
    setBusy(true)
    setConnectProgress('生成本地 SDP…')
    try {
      if (role === 'offer') {
        const text = await session.generateLocalSignal()
        setLocalSignal(text)
      } else {
        // answer 需先有 remote；若已有则生成
        if (!remoteSignal.trim()) {
          setConnectError('Host(answer) 请先粘贴对方的 offer，再生成 answer')
          setBusy(false)
          return
        }
        await session.acceptRemoteSignal(remoteSignal)
        const text = await session.generateLocalSignal()
        setLocalSignal(text)
      }
      setConnectProgress('等待通道 / 交换信令…')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function acceptRemote() {
    if (!sessionRef.current) boot()
    const session = sessionRef.current!
    setBusy(true)
    setConnectProgress('接受对端 SDP…')
    try {
      await session.acceptRemoteSignal(remoteSignal)
      if (role === 'answer') {
        const text = await session.generateLocalSignal()
        setLocalSignal(text)
      }
      setConnectProgress('信令已交换，等待 DataChannel…')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ ...field, gap: 10, maxWidth: 480 }}>
      <RolePicker
        role={role}
        onChange={(r) => {
          setRole(r)
          sessionRef.current = null
        }}
        disabled={busy}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="button" variant="primary" size="small" disabled={busy} onClick={boot}>
          新建会话
        </Button>
        <Button type="button" variant="secondary" size="small" disabled={busy} onClick={() => void genLocal()}>
          生成本地信令
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={busy || !remoteSignal.trim()}
          onClick={() => void acceptRemote()}
        >
          接受对端信令
        </Button>
      </div>
      <label style={{ color: '#ffffe0', fontSize: 13 }}>
        本地 SDP（复制给对方）
        <textarea
          value={localSignal}
          readOnly
          rows={4}
          style={{ ...sunken, marginTop: 4, resize: 'vertical' }}
        />
      </label>
      <label style={{ color: '#ffffe0', fontSize: 13 }}>
        对端 SDP（粘贴）
        <textarea
          value={remoteSignal}
          onChange={(e) => setRemoteSignal(e.target.value)}
          rows={4}
          style={{ ...sunken, marginTop: 4, resize: 'vertical' }}
        />
      </label>
    </div>
  )
}

/** 3. STUN 探测：先 gather ICE，再走手动信令（network=internet） */
export function StunPanel() {
  const [log, setLog] = useState('点击「开始探测」检查 STUN / srflx…\n')
  const [probed, setProbed] = useState(false)
  const [busy, setBusy] = useState(false)

  async function probe() {
    setBusy(true)
    beginConnect({
      method: 'stun',
      role: 'answer',
      network: 'internet',
      detail: 'STUN 探测中…',
    })
    setLog('creating PeerConnection (internet ICE)…\n')

    const peer = new PeerConnection()
    peer.setNetwork('internet')
    peer.setRole('offer')
    peer.createPeer()

    const pc = peer.peer
    if (!pc) {
      setConnectError('PeerConnection 创建失败')
      setBusy(false)
      return
    }

    const counts = { host: 0, srflx: 0, relay: 0, prflx: 0 }
    pc.onicecandidate = (ev) => {
      const c = ev.candidate
      if (!c?.candidate) return
      const m = / typ (host|srflx|relay|prflx) /.exec(c.candidate)
      const typ = (m?.[1] ?? 'host') as keyof typeof counts
      counts[typ] += 1
      setLog((prev) => `${prev}${typ} ${c.candidate}\n`)
    }

    try {
      // 触发 ICE gather
      pc.createDataChannel('probe')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve()
          return
        }
        const onChange = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', onChange)
            resolve()
          }
        }
        pc.addEventListener('icegatheringstatechange', onChange)
        setTimeout(() => resolve(), 4000)
      })

      const ok = counts.srflx > 0 || counts.host > 0
      setLog(
        (prev) =>
          `${prev}\n合计 host=${counts.host} srflx=${counts.srflx} relay=${counts.relay}\n` +
          (counts.srflx > 0
            ? '✓ 拿到 srflx，公网 STUN 可用\n'
            : counts.host > 0
              ? '△ 仅有 host（可能在对称 NAT / STUN 被拦）\n'
              : '✗ 无候选\n'),
      )
      peer.destroy()
      if (ok) {
        setProbed(true)
        setConnectProgress(
          counts.srflx > 0 ? 'STUN 探测成功，请继续交换信令' : '探测完成（无 srflx），可继续手动信令',
          'configuring',
        )
      } else {
        setConnectError('ICE 探测失败')
      }
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e))
      try {
        peer.destroy()
      } catch {
        // ignore
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ ...field, gap: 10, maxWidth: 480 }}>
      <Button type="button" variant="primary" size="medium" disabled={busy} onClick={() => void probe()}>
        开始 STUN 探测
      </Button>
      <pre style={{ ...sunken, maxHeight: 120, overflow: 'auto', margin: 0 }}>{log}</pre>
      {probed && (
        <>
          <p style={{ color: '#ffffe0', fontSize: 13, margin: 0 }}>
            探测完成。下面用公网 ICE 完成手动信令交换：
          </p>
          <ManualPanel network="internet" />
        </>
      )}
    </div>
  )
}

/** 4. Tab postMessage — TODO */
export function PostMessagePanel() {
  return (
    <div style={{ ...field, maxWidth: 420 }}>
      <p style={{ color: '#ffffe0', fontSize: 13, margin: 0 }}>
        Tab <code>postMessage</code> / <code>BroadcastChannel</code> 信令还在规划里，纯 example
        用途。选这个不会真正建连。
      </p>
      <Button
        type="button"
        variant="primary"
        size="medium"
        disabled
        onClick={() => {
          beginConnect({
            method: 'postmessage',
            role: 'answer',
            detail: 'TODO',
          })
          setConnectError('Tab postMessage 尚未实现')
        }}
      >
        TODO
      </Button>
    </div>
  )
}
