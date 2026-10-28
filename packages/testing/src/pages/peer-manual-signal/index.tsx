import { useEffect, useMemo, useState } from 'react'
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
} from './peerApi'

type Phase = 'idle' | 'configured' | 'peer-ready' | 'local-ready' | 'accepted' | 'channel-open'
type MessageMode = 'text' | 'binary'

function sniffImageMime(buf: ArrayBuffer): string | null {
  const u8 = new Uint8Array(buf)
  if (u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    u8.length >= 8 &&
    u8[0] === 0x89 &&
    u8[1] === 0x50 &&
    u8[2] === 0x4e &&
    u8[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    u8.length >= 6 &&
    u8[0] === 0x47 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x38
  ) {
    return 'image/gif'
  }
  if (
    u8.length >= 12 &&
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

export function PeerManualSignalPage() {
  const [role, setRoleUi] = useState<PeerRole>('offer')
  const [network, setNetworkUi] = useState<PeerNetwork>('lan')
  const [localSignal, setLocalSignal] = useState('')
  const [remoteSignal, setRemoteSignal] = useState('')
  const [messageMode, setMessageMode] = useState<MessageMode>('text')
  const [msg, setMsg] = useState('hello')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [sendPreviewUrl, setSendPreviewUrl] = useState<string | null>(null)
  const [recvPreviewUrl, setRecvPreviewUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [logText, setLogText] = useState('ready\n')

  const status = useMemo(() => {
    if (phase === 'channel-open') return { label: 'DataChannel open', dot: 'ready' }
    if (phase === 'accepted') return { label: 'remote accepted', dot: 'pending' }
    if (phase === 'local-ready') return { label: 'local signal ready', dot: 'pending' }
    if (phase === 'peer-ready') return { label: 'peer created', dot: 'pending' }
    if (phase === 'configured') return { label: 'configured', dot: 'pending' }
    return { label: 'idle', dot: '' }
  }, [phase])

  function log(line: string) {
    const t = new Date().toLocaleTimeString()
    setLogText((prev) => `${prev}[${t}] ${line}\n`)
  }

  useEffect(() => {
    setPeerApiHooks({
      onChannelOpen: () => {
        setPhase('channel-open')
        log('DataChannel open ✓')
      },
      onChannelClose: () => {
        log('DataChannel close')
      },
      onChannelMessage: (data) => {
        if (typeof data === 'string') {
          log(`← recv text: ${data}`)
          return
        }
        if (data instanceof ArrayBuffer) {
          const mime = sniffImageMime(data)
          if (mime) {
            const url = URL.createObjectURL(new Blob([data], { type: mime }))
            setRecvPreviewUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev)
              return url
            })
            log(`← recv binary image (${mime}, ${data.byteLength} bytes)`)
          } else {
            log(`← recv binary (${data.byteLength} bytes, 非已知图片头)`)
          }
          return
        }
        log(`← recv: ${String(data)}`)
      },
      onChannelError: (event) => {
        log(`channel error: ${String(event)}`)
      },
    })
    return () => {
      setPeerApiHooks({})
      destroySession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (sendPreviewUrl) URL.revokeObjectURL(sendPreviewUrl)
      if (recvPreviewUrl) URL.revokeObjectURL(recvPreviewUrl)
    }
  }, [sendPreviewUrl, recvPreviewUrl])

  function onCreateSession() {
    createSession(network)
    setPhase('configured')
    setLocalSignal('')
    setRemoteSignal('')
    log(`session created · network=${network}`)
  }

  function onApplyRole() {
    if (!getSession()) createSession(network)
    setRole(role)
    log(`setRole(${role})`)
  }

  function onApplyNetwork() {
    if (!getSession()) createSession(network)
    setNetwork(network)
    log(`setNetwork(${network})`)
  }

  async function onCreatePeer() {
    try {
      if (!getSession()) createSession(network)
      setRole(role)
      setNetwork(network)
      await createPeer()
      setPhase('peer-ready')
      log(`createPeer · role=${role} · network=${network}`)
    } catch (e) {
      log(`createPeer failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function onGenerateLocal() {
    try {
      const text = await generateLocalSignal()
      setLocalSignal(text)
      setPhase('local-ready')
      log('generateLocalSignal → Local Signal 已更新')
    } catch (e) {
      log(`generateLocal failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function onCopyLocal() {
    try {
      await navigator.clipboard.writeText(localSignal)
      log('local signal copied')
    } catch {
      log('clipboard failed — 请手动复制')
    }
  }

  async function onAcceptRemote() {
    try {
      await acceptRemoteSignal(remoteSignal)
      setPhase((p) => (p === 'channel-open' ? p : 'accepted'))
      log(
        role === 'answer'
          ? 'accepted remote offer — 接着 Generate Local 生成 answer'
          : 'accepted remote answer — 等待 ICE / DataChannel',
      )
    } catch (e) {
      log(`accept failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function onPickImage(file: File | null) {
    setImageFile(file)
    setSendPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
    if (file) log(`picked image: ${file.name} (${file.type}, ${file.size} bytes)`)
  }

  function onSendText() {
    const channel = getSession()?.peer.channel
    if (!channel || channel.readyState !== 'open') {
      log('send failed: DataChannel not open')
      return
    }
    channel.send(msg)
    log(`→ send text: ${msg}`)
  }

  async function onSendImage() {
    const channel = getSession()?.peer.channel
    if (!channel || channel.readyState !== 'open') {
      log('send failed: DataChannel not open')
      return
    }
    if (!imageFile) {
      log('send failed: 未选择图片')
      return
    }
    try {
      const buf = await imageFile.arrayBuffer()
      channel.send(buf)
      log(`→ send binary image: ${imageFile.name} (${buf.byteLength} bytes)`)
    } catch (e) {
      log(`send image failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function onDestroy() {
    destroySession()
    setPhase('idle')
    setLocalSignal('')
    setRemoteSignal('')
    log('destroyed')
  }

  const channelReady = phase === 'channel-open'

  return (
    <>
      <section className="panel">
        <h2>1. 角色与网络</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="role">角色</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRoleUi(e.target.value as PeerRole)}
              disabled={phase !== 'idle' && phase !== 'configured'}
            >
              <option value="offer">offer（先出 SDP）</option>
              <option value="answer">answer（先收 offer）</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="network">网络</label>
            <select
              id="network"
              value={network}
              onChange={(e) => setNetworkUi(e.target.value as PeerNetwork)}
              disabled={phase !== 'idle' && phase !== 'configured'}
            >
              <option value="lan">局域网（无 STUN）</option>
              <option value="internet">万维网（STUN）</option>
            </select>
          </div>
          <button type="button" onClick={onCreateSession}>
            New Session
          </button>
          <button type="button" onClick={onApplyRole}>
            Apply Role
          </button>
          <button type="button" onClick={onApplyNetwork}>
            Apply Network
          </button>
          <span className="status-pill">
            <span className={`dot ${status.dot}`} />
            {status.label}
          </span>
        </div>
        <p className="hint">
          流程：New Session → Apply Role/Network → Create Peer →
          {role === 'offer'
            ? ' Generate Local → 复制给对方 → 粘贴 answer → Accept'
            : ' 粘贴 offer → Accept → Generate Local → 复制 answer 给对方'}
        </p>
      </section>

      <section className="panel">
        <h2>2. Peer 操作</h2>
        <div className="row">
          <button className="primary" type="button" onClick={() => void onCreatePeer()}>
            Create Peer
          </button>
          <button type="button" onClick={() => void onGenerateLocal()}>
            Generate Local Signal
          </button>
          <button className="danger" type="button" onClick={onDestroy}>
            Destroy
          </button>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2>3. Local Signal</h2>
          <textarea
            value={localSignal}
            readOnly
            placeholder="Generate 后出现本端 SDP / JSON…"
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button type="button" disabled={!localSignal} onClick={() => void onCopyLocal()}>
              复制
            </button>
          </div>
        </div>
        <div className="panel">
          <h2>4. Remote Signal</h2>
          <textarea
            value={remoteSignal}
            onChange={(e) => setRemoteSignal(e.target.value)}
            placeholder='粘贴对方 JSON，例如 {"type":"offer","sdp":"..."}'
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="primary"
              type="button"
              disabled={!remoteSignal.trim()}
              onClick={() => void onAcceptRemote()}
            >
              Accept Signal
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>5. 消息（DataChannel open 后）</h2>
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="field">
            <label htmlFor="msg-mode">类型</label>
            <select
              id="msg-mode"
              value={messageMode}
              onChange={(e) => setMessageMode(e.target.value as MessageMode)}
              disabled={!channelReady}
            >
              <option value="text">文本</option>
              <option value="binary">二进制（图片）</option>
            </select>
          </div>
        </div>

        {messageMode === 'text' ? (
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
              onClick={onSendText}
            >
              Send Text
            </button>
          </div>
        ) : (
          <div className="grid-2">
            <div>
              <div className="field">
                <label htmlFor="img-file">上传图片</label>
                <input
                  id="img-file"
                  type="file"
                  accept="image/*"
                  disabled={!channelReady}
                  onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className="primary"
                  type="button"
                  disabled={!channelReady || !imageFile}
                  onClick={() => void onSendImage()}
                >
                  Send Image
                </button>
              </div>
              {sendPreviewUrl ? (
                <img
                  src={sendPreviewUrl}
                  alt="send preview"
                  style={{
                    marginTop: 10,
                    maxWidth: '100%',
                    maxHeight: 180,
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                  }}
                />
              ) : null}
            </div>
            <div>
              <p className="hint" style={{ marginTop: 0 }}>
                收到的图片预览
              </p>
              {recvPreviewUrl ? (
                <img
                  src={recvPreviewUrl}
                  alt="recv preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 180,
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                  }}
                />
              ) : (
                <p className="hint">暂无</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Log</h2>
        <pre className="log">{logText}</pre>
      </section>
    </>
  )
}
