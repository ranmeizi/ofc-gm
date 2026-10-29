import PeerConnection, {
  type PeerNetwork,
  type PeerRole,
} from './components/Connection/PeerConnection'
import Connection from './components/Connection'

export type CreateHostSessionOptions = {
  /** 默认 lan */
  network?: PeerNetwork
  /**
   * 主机在信令上的角色。
   * 默认 answer：客人先发 offer，主机被动回 answer（与常见「建房方接人」一致）。
   */
  role?: PeerRole
  messageType?: 'text' | 'binary'
  /** 取消会话时 abort */
  signal?: AbortSignal
}

export type HostSession = {
  readonly peer: PeerConnection
  readonly role: PeerRole
  readonly network: PeerNetwork
  /** ready 之后才有 */
  readonly connection: Connection | undefined

  /** 生成本端 SDP JSON 文本，供复制 / WS 发送 */
  generateLocalSignal(): Promise<string>
  /** 接受对端 SDP JSON / 对象 */
  acceptRemoteSignal(raw: string | RTCSessionDescriptionInit): Promise<void>
  /**
   * 等到 DataChannel open，并包成已 connect 的 Connection。
   * 可被 cancel() / AbortSignal 打断。
   */
  whenReady(): Promise<Connection>
  /** 销毁 peer，并 reject 未完成的 whenReady */
  cancel(reason?: unknown): void
}

function signalJson(desc: RTCSessionDescription): string {
  return JSON.stringify({ type: desc.type, sdp: desc.sdp })
}

/**
 * 可选的主机连接会话（L2 糖衣）。
 * 只负责：建 PeerConnection → 暴露信令 API → channel open 后给出 Connection。
 * 不负责 UI；不强制使用——你也可自己 new PeerConnection。
 */
export function createHostSession(
  options: CreateHostSessionOptions = {},
): HostSession {
  const network = options.network ?? 'lan'
  const role = options.role ?? 'answer'
  const messageType = options.messageType ?? 'text'

  const peer = new PeerConnection()
  peer.setNetwork(network)
  peer.setRole(role)
  peer.createPeer()

  let connection: Connection | undefined
  let readyPromise: Promise<Connection> | undefined
  let resolveReady: ((conn: Connection) => void) | undefined
  let rejectReady: ((err: unknown) => void) | undefined
  let settled = false
  let cancelled = false

  const fail = (err: unknown) => {
    if (settled) return
    settled = true
    rejectReady?.(err)
    resolveReady = undefined
    rejectReady = undefined
  }

  const succeed = (conn: Connection) => {
    if (settled) return
    settled = true
    connection = conn
    resolveReady?.(conn)
    resolveReady = undefined
    rejectReady = undefined
  }

  const onAbort = () => {
    cancel(options.signal?.reason ?? new DOMException('Aborted', 'AbortError'))
  }

  if (options.signal) {
    if (options.signal.aborted) {
      cancelled = true
      peer.destroy()
    } else {
      options.signal.addEventListener('abort', onAbort, { once: true })
    }
  }

  function ensureChannelWaiter() {
    if (readyPromise) return readyPromise

    readyPromise = new Promise<Connection>((resolve, reject) => {
      resolveReady = resolve
      rejectReady = reject

      if (cancelled) {
        fail(new DOMException('Host session cancelled', 'AbortError'))
        return
      }

      const finishOpen = () => {
        try {
          const conn = new Connection(peer, messageType)
          conn.connect()
          succeed(conn)
        } catch (e) {
          fail(e)
        }
      }

      if (peer.channel?.readyState === 'open') {
        finishOpen()
        return
      }

      const prevOpen = peer.onChannelOpen
      peer.onChannelOpen = () => {
        prevOpen?.()
        finishOpen()
      }

      const prevClose = peer.onChannelClose
      peer.onChannelClose = () => {
        prevClose?.()
        if (!settled) {
          fail(new Error('DataChannel closed before ready'))
        }
      }
    })

    return readyPromise
  }

  function cancel(reason?: unknown) {
    if (cancelled) return
    cancelled = true
    options.signal?.removeEventListener('abort', onAbort)
    const err =
      reason ?? new DOMException('Host session cancelled', 'AbortError')
    fail(err)
    try {
      connection?.close()
    } catch {
      // ignore
    }
    connection = undefined
    peer.destroy()
  }

  const session: HostSession = {
    peer,
    role,
    network,
    get connection() {
      return connection
    },

    async generateLocalSignal() {
      if (cancelled) throw new DOMException('Host session cancelled', 'AbortError')
      const desc = await peer.generateSDP()
      return signalJson(desc)
    },

    async acceptRemoteSignal(raw) {
      if (cancelled) throw new DOMException('Host session cancelled', 'AbortError')
      await peer.acceptRemoteSDP(raw)
    },

    whenReady() {
      return ensureChannelWaiter()
    },

    cancel,
  }

  return session
}
