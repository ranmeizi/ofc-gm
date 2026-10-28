import { useEffect, useMemo, useRef, useState } from 'react'
import type { ServerMessage } from '@ofc-gm/ws/protocol'
import {
  acceptRemoteSignal,
  createPeer,
  createSession,
  destroySession,
  generateLocalSignal,
  getSession,
  setNetwork,
  setPeerApiHooks,
  setRole,
  type PeerNetwork,
  type PeerRole,
} from '../peer-manual-signal/peerApi'
import { SignalClient } from './signalClient'

type Phase =
  | 'idle'
  | 'peer-ready'
  | 'ws-connected'
  | 'joined'
  | 'signaling'
  | 'channel-open'

function defaultWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Vite 把 /signal 代理到 @ofc-gm/ws
  return `${proto}//${location.host}/signal`
}

function parseSignal(raw: unknown): string {
  if (typeof raw === 'string') return raw
  return JSON.stringify(raw)
}

export function PeerWsSignalPage() {
  const [role, setRoleUi] = useState<PeerRole>('offer')
  const [network, setNetworkUi] = useState<PeerNetwork>('lan')
  const [roomId, setRoomId] = useState('demo')
  const [wsUrl, setWsUrl] = useState(defaultWsUrl)
  const [msg, setMsg] = useState('hello via ws signal')
  const [phase, setPhase] = useState<Phase>('idle')
  const [peerId, setPeerId] = useState('')
  const [remotePeerId, setRemotePeerId] = useState('')
  const [logText, setLogText] = useState('ready — 先起 pnpm dev:ws，再开两个标签页同房间异角色\n')

  const clientRef = useRef(new SignalClient())
  const roleRef = useRef(role)
  const offerSentRef = useRef(false)
  const answerSentRef = useRef(false)

  roleRef.current = role

  const status = useMemo(() => {
    if (phase === 'channel-open') return { label: 'DataChannel open', dot: 'ready' }
    if (phase === 'signaling') return { label: 'signaling…', dot: 'pending' }
    if (phase === 'joined') return { label: 'joined room', dot: 'pending' }
    if (phase === 'ws-connected') return { label: 'ws connected', dot: 'pending' }
    if (phase === 'peer-ready') return { label: 'peer created', dot: 'pending' }
    return { label: 'idle', dot: '' }
  }, [phase])

  function log(line: string) {
    const t = new Date().toLocaleTimeString()
    setLogText((prev) => `${prev}[${t}] ${line}\n`)
  }

  async function sendOfferIfNeeded() {
    if (roleRef.current !== 'offer' || offerSentRef.current) return
    offerSentRef.current = true
    setPhase('signaling')
    try {
      const text = await generateLocalSignal()
      const sdp = JSON.parse(text) as { type: 'offer' | 'answer'; sdp: string }
      clientRef.current.signal(sdp)
      log('→ WS signal offer 已发送')
    } catch (e) {
      offerSentRef.current = false
      log(`send offer failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handleRemoteSignal(raw: unknown) {
    const text = parseSignal(raw)
    let parsed: { type?: string }
    try {
      parsed = JSON.parse(text) as { type?: string }
    } catch {
      log('收到无法解析的 signal')
      return
    }

    const currentRole = roleRef.current
    setPhase('signaling')

    try {
      if (currentRole === 'answer' && parsed.type === 'offer') {
        await acceptRemoteSignal(text)
        log('← 收到 offer，已 Accept')
        if (!answerSentRef.current) {
          answerSentRef.current = true
          const answerText = await generateLocalSignal()
          const sdp = JSON.parse(answerText) as {
            type: 'offer' | 'answer'
            sdp: string
          }
          clientRef.current.signal(sdp)
          log('→ WS signal answer 已发送')
        }
        return
      }

      if (currentRole === 'offer' && parsed.type === 'answer') {
        await acceptRemoteSignal(text)
        log('← 收到 answer，已 Accept — 等待 DataChannel')
        return
      }

      log(`忽略 signal type=${parsed.type}（当前角色 ${currentRole}）`)
    } catch (e) {
      log(`处理 signal 失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function onServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'welcome':
        setPeerId(msg.peerId)
        log(`welcome peerId=${msg.peerId}`)
        return
      case 'joined':
        setPhase('joined')
        setPeerId(msg.peerId)
        if (msg.peers[0]) {
          setRemotePeerId(msg.peers[0].peerId)
          log(
            `joined room=${msg.roomId} · 房内已有 ${msg.peers[0].peerId} (${msg.peers[0].role ?? '?'})`,
          )
          void sendOfferIfNeeded()
        } else {
          setRemotePeerId('')
          log(`joined room=${msg.roomId} · 等待对方进房`)
        }
        return
      case 'peer-joined':
        setRemotePeerId(msg.peerId)
        log(`peer-joined ${msg.peerId} role=${msg.role ?? '?'}`)
        void sendOfferIfNeeded()
        return
      case 'peer-left':
        if (remotePeerId === msg.peerId) setRemotePeerId('')
        log(`peer-left ${msg.peerId}`)
        return
      case 'signal':
        log(`← WS signal from ${msg.from}`)
        void handleRemoteSignal(msg.sdp)
        return
      case 'error':
        log(`server error: ${msg.message}`)
        return
      case 'pong':
        log('pong')
        return
      default:
        return
    }
  }

  useEffect(() => {
    setPeerApiHooks({
      onChannelOpen: () => {
        setPhase('channel-open')
        log('DataChannel open ✓')
      },
      onChannelClose: () => log('DataChannel close'),
      onChannelMessage: (data) => {
        log(`← recv: ${typeof data === 'string' ? data : String(data)}`)
      },
      onChannelError: (event) => log(`channel error: ${String(event)}`),
    })

    const client = clientRef.current
    client.setHandlers({
      onOpen: () => log('ws open'),
      onClose: () => log('ws close'),
      onError: (e) =>
        log(`ws error: ${e instanceof Error ? e.message : String(e)}`),
      onMessage: onServerMessage,
    })

    return () => {
      client.setHandlers({})
      client.close()
      setPeerApiHooks({})
      destroySession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onStart() {
    try {
      offerSentRef.current = false
      answerSentRef.current = false
      setRemotePeerId('')

      createSession(network)
      setRole(role)
      setNetwork(network)
      await createPeer()
      setPhase('peer-ready')
      log(`createPeer · role=${role} · network=${network}`)

      const client = clientRef.current
      client.setHandlers({
        onOpen: () => {
          setPhase('ws-connected')
          log('ws open')
        },
        onClose: () => log('ws close'),
        onError: (e) =>
          log(`ws error: ${e instanceof Error ? e.message : String(e)}`),
        onMessage: onServerMessage,
      })

      await client.connect(wsUrl.trim())
      client.join(roomId.trim(), role)
      log(`join room=${roomId.trim()} role=${role}`)
    } catch (e) {
      log(`start failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function onStop() {
    clientRef.current.leave()
    clientRef.current.close()
    destroySession()
    offerSentRef.current = false
    answerSentRef.current = false
    setPeerId('')
    setRemotePeerId('')
    setPhase('idle')
    log('stopped')
  }

  function onSend() {
    const channel = getSession()?.peer.channel
    if (!channel || channel.readyState !== 'open') {
      log('send failed: DataChannel not open')
      return
    }
    channel.send(msg)
    log(`→ send: ${msg}`)
  }

  const busy = phase !== 'idle' && phase !== 'channel-open'
  const canStart = phase === 'idle'
  const channelReady = phase === 'channel-open'

  return (
    <>
      <section className="panel">
        <h2>1. WS 房间与角色</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="room">房间名</label>
            <input
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={!canStart}
              placeholder="双方约定同一个"
            />
          </div>
          <div className="field">
            <label htmlFor="role">角色</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRoleUi(e.target.value as PeerRole)}
              disabled={!canStart}
            >
              <option value="offer">offer</option>
              <option value="answer">answer</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="network">网络</label>
            <select
              id="network"
              value={network}
              onChange={(e) => setNetworkUi(e.target.value as PeerNetwork)}
              disabled={!canStart}
            >
              <option value="lan">局域网</option>
              <option value="internet">万维网</option>
            </select>
          </div>
          <span className="status-pill">
            <span className={`dot ${status.dot}`} />
            {status.label}
          </span>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <div className="field" style={{ flex: 1, minWidth: 240 }}>
            <label htmlFor="ws-url">WebSocket URL</label>
            <input
              id="ws-url"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              disabled={!canStart}
            />
          </div>
        </div>
        <p className="hint">
          两边约定同一房间名：一边 offer、一边 answer → Start。进房后自动经 WS
          交换 SDP（无需复制粘贴）。需同时运行 <code>pnpm dev:ws</code>。
        </p>
        <div className="row" style={{ marginTop: 8 }}>
          <button
            className="primary"
            type="button"
            disabled={!canStart || !roomId.trim()}
            onClick={() => void onStart()}
          >
            Start（建 peer + 进房）
          </button>
          <button
            className="danger"
            type="button"
            disabled={phase === 'idle'}
            onClick={onStop}
          >
            Stop
          </button>
        </div>
        <p className="hint" style={{ marginBottom: 0 }}>
          self={peerId || '—'} · remote={remotePeerId || '—'}
          {busy ? ' · 自动信令中…' : ''}
        </p>
      </section>

      <section className="panel">
        <h2>2. 消息（DataChannel open 后）</h2>
        <div className="row">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            disabled={!channelReady}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button
            type="button"
            disabled={!channelReady || !msg}
            onClick={onSend}
          >
            Send
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Log</h2>
        <pre className="log">{logText}</pre>
      </section>
    </>
  )
}
