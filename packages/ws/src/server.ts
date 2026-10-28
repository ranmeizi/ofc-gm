import { createServer, type Server as HttpServer, type IncomingMessage } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'
import type { ClientMessage, ServerMessage } from './protocol.js'
import { RoomManager, type Peer } from './room.js'

export type SignalServerOptions = {
  /** 监听端口，默认 8787 */
  port?: number
  /** 绑定地址，默认 0.0.0.0 */
  host?: string
  /** 单房间人数上限，默认 2（双方约定房间名互通信令） */
  maxPeersPerRoom?: number
  /** 已有 HTTP server 时挂载到同一端口 */
  server?: HttpServer
  /** WebSocket path，默认 /signal */
  path?: string
}

/**
 * WebSocket 信令中继：只转发 SDP，不碰 WebRTC / ICE。
 *
 * 典型流程（两人房）：
 * 1. 双方约定 roomId，分别 `join`（默认满 2 人）
 * 2. offer 生成 SDP 后发 `signal`
 * 3. 服务端转给房内另一个人
 * 4. answer Accept → generateSDP → 再 `signal` 回传
 */
export class SignalServer {
  readonly rooms = new RoomManager()
  readonly maxPeersPerRoom: number
  readonly path: string

  private readonly host: string
  private readonly port: number
  private readonly ownedHttp: boolean
  private http: HttpServer
  private wss: WebSocketServer
  private peers = new Map<WebSocket, Peer>()
  private listening = false

  constructor(options: SignalServerOptions = {}) {
    this.port = options.port ?? 8787
    this.host = options.host ?? '0.0.0.0'
    this.maxPeersPerRoom = options.maxPeersPerRoom ?? 2
    this.path = options.path ?? '/signal'
    this.ownedHttp = !options.server
    this.http = options.server ?? createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true, rooms: this.roomsSize() }))
        return
      }
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('ofc-gm signaling ws — connect WebSocket to ' + this.path)
    })

    this.wss = new WebSocketServer({
      server: this.http,
      path: this.path,
    })
    this.wss.on('connection', (socket, req) => this.onConnection(socket, req))
  }

  private roomsSize() {
    let inRooms = 0
    for (const peer of this.peers.values()) {
      if (peer.roomId) inRooms += 1
    }
    return {
      rooms: this.rooms.size,
      peers: this.peers.size,
      inRooms,
      maxPeersPerRoom: this.maxPeersPerRoom,
    }
  }

  private send(peer: Peer, message: ServerMessage) {
    this.rooms.send(peer, message)
  }

  private onConnection(socket: WebSocket, _req: IncomingMessage) {
    const peer: Peer = {
      id: randomUUID(),
      socket,
    }
    this.peers.set(socket, peer)
    this.send(peer, { type: 'welcome', peerId: peer.id })

    socket.on('message', (raw) => {
      try {
        const text = typeof raw === 'string' ? raw : raw.toString('utf8')
        const msg = JSON.parse(text) as ClientMessage
        this.onMessage(peer, msg)
      } catch (e) {
        this.send(peer, {
          type: 'error',
          message: e instanceof Error ? e.message : String(e),
        })
      }
    })

    socket.on('close', () => this.onDisconnect(peer))
    socket.on('error', () => this.onDisconnect(peer))
  }

  private onMessage(peer: Peer, msg: ClientMessage) {
    switch (msg.type) {
      case 'ping':
        this.send(peer, { type: 'pong' })
        return
      case 'join':
        this.handleJoin(peer, msg.roomId, msg.role)
        return
      case 'signal':
        this.handleSignal(peer, msg.sdp, msg.to)
        return
      case 'leave':
        this.handleLeave(peer)
        return
      default:
        this.send(peer, { type: 'error', message: '未知消息类型' })
    }
  }

  private handleJoin(
    peer: Peer,
    roomId: string,
    role?: 'offer' | 'answer',
  ) {
    const id = roomId?.trim()
    if (!id) {
      this.send(peer, { type: 'error', message: 'roomId 不能为空' })
      return
    }

    try {
      const prevRoomId = peer.roomId
      if (prevRoomId && prevRoomId !== id) {
        this.handleLeave(peer)
      }

      peer.role = role
      const room = this.rooms.join(id, peer, this.maxPeersPerRoom)
      const others = [...room.peers.values()].filter((p) => p.id !== peer.id)

      this.send(peer, {
        type: 'joined',
        roomId: id,
        peerId: peer.id,
        role: peer.role,
        peers: others.map((p) => ({ peerId: p.id, role: p.role })),
      })

      this.rooms.broadcast(others, {
        type: 'peer-joined',
        peerId: peer.id,
        role: peer.role,
      })
    } catch (e) {
      this.send(peer, {
        type: 'error',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }

  private handleSignal(
    peer: Peer,
    sdp: import('./protocol.js').SignalPayload | string,
    to?: string,
  ) {
    if (!peer.roomId) {
      this.send(peer, { type: 'error', message: '请先 join 房间' })
      return
    }
    if (sdp == null || sdp === '') {
      this.send(peer, { type: 'error', message: 'sdp 不能为空' })
      return
    }

    const payload: ServerMessage = {
      type: 'signal',
      from: peer.id,
      sdp,
    }

    if (to) {
      const target = this.rooms.find(peer.roomId, to)
      if (!target) {
        this.send(peer, { type: 'error', message: `对端不存在: ${to}` })
        return
      }
      this.send(target, payload)
      return
    }

    const others = this.rooms.others(peer)
    if (others.length === 0) {
      this.send(peer, { type: 'error', message: '房间内暂无其他 peer' })
      return
    }
    this.rooms.broadcast(others, payload)
  }

  private handleLeave(peer: Peer) {
    const roomId = this.rooms.leave(peer)
    if (!roomId) return
    const room = this.rooms.get(roomId)
    if (!room) return
    this.rooms.broadcast([...room.peers.values()], {
      type: 'peer-left',
      peerId: peer.id,
    })
  }

  private onDisconnect(peer: Peer) {
    if (!this.peers.has(peer.socket)) return
    this.handleLeave(peer)
    this.peers.delete(peer.socket)
  }

  /** 启动监听；返回实际地址 */
  listen(): Promise<{ host: string; port: number; url: string }> {
    if (this.listening) {
      return Promise.resolve({
        host: this.host,
        port: this.port,
        url: `ws://${this.host === '0.0.0.0' ? '127.0.0.1' : this.host}:${this.port}${this.path}`,
      })
    }

    return new Promise((resolve, reject) => {
      const onError = (err: Error) => {
        this.http.off('error', onError)
        reject(err)
      }
      this.http.once('error', onError)
      this.http.listen(this.port, this.host, () => {
        this.http.off('error', onError)
        this.listening = true
        const addr = this.http.address()
        const port =
          addr && typeof addr === 'object' ? addr.port : this.port
        resolve({
          host: this.host,
          port,
          url: `ws://${this.host === '0.0.0.0' ? '127.0.0.1' : this.host}:${port}${this.path}`,
        })
      })
    })
  }

  async close(): Promise<void> {
    for (const peer of this.peers.values()) {
      try {
        peer.socket.close()
      } catch {
        // ignore
      }
    }
    this.peers.clear()

    await new Promise<void>((resolve) => {
      this.wss.close(() => resolve())
    })

    if (this.ownedHttp) {
      await new Promise<void>((resolve, reject) => {
        this.http.close((err) => (err ? reject(err) : resolve()))
      })
    }
    this.listening = false
  }
}

export function createSignalServer(options?: SignalServerOptions) {
  return new SignalServer(options)
}
