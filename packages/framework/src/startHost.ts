import { createId } from './utils/createId'
import Room from './components/Room'
import type { GameConnection } from './components/Connection'
import { createLocalLoopback } from './components/Connection/LocalConnection'
import type { HostSession } from './createHostSession'
import type {
  ClientHandle,
  ClientModule,
  ServerHandle,
  ServerModule,
} from './types/modules'

export type StartHostOptions = {
  /** 已 ready 的远端（或任意）连接；与 session 二选一 */
  connection?: GameConnection
  /** createHostSession().whenReady() 之后也可直接传 session */
  session?: HostSession
  server: ServerModule
  client: ClientModule
  /** 本机玩家座位 id */
  hostPlayerId?: string
  /** 首位远端座位 id（仅当有一条 remote connection 时） */
  guestPlayerId?: string
}

export type HostRuntime = {
  readonly room: Room
  readonly server: ServerHandle
  readonly client: ClientHandle
  readonly hostPlayerId: string
  /** 再接入一名已 ready 的客人 */
  attachGuest(connection: GameConnection, clientId?: string): string
  /** 拆掉房间与本机 loopback（不强制 destroy 外部 WebRTC，除非它只被 room 持有） */
  stop(): void
}

function resolveRemoteConnection(options: StartHostOptions): GameConnection | undefined {
  if (options.connection) return options.connection
  if (options.session?.connection) return options.session.connection
  return undefined
}

/**
 * 连接已就绪后启动主机权威运行时：
 * - Room + 本机 loopback Client（与远端同一套模块语义）
 * - 可选挂上第一条远端 connection
 *
 * 不区分 createHost/createGuest 工厂：加入方只跑 Client 即可（后续可再补 startClient）。
 */
export function startHost(options: StartHostOptions): HostRuntime {
  const remote = resolveRemoteConnection(options)
  if (!remote && !options.session && !options.connection) {
    // 允许「先开房、稍后再 attachGuest」：可以没有 remote
  }
  if (options.session && !options.session.connection) {
    throw new Error('session 尚未 ready — 先 await session.whenReady()')
  }
  if (remote && !remote.connected) {
    throw new Error('connection 未 connect — 先 connection.connect() 或 await whenReady()')
  }

  const hostPlayerId = options.hostPlayerId ?? createId('host')
  const room = new Room()
  const { serverSide, clientSide } = createLocalLoopback()
  serverSide.connect()
  clientSide.connect()

  const serverHandle: ServerHandle = {
    broadcast: (data) => room.broadcast(data),
    send: (clientId, data) => room.send(clientId, data),
    clients: () => room.clients(),
  }

  const clientHandle: ClientHandle = {
    send: (data) => clientSide.send(data),
  }

  const unsubscribers: Array<() => void> = []

  function wireSeat(clientId: string, peer: GameConnection) {
    const onMessage = (data: unknown) => {
      options.server.onMessage?.(serverHandle, clientId, data)
    }
    const onClose = () => {
      if (!room.has(clientId)) return
      room.leave(clientId)
      options.server.onLeave?.(serverHandle, clientId)
    }
    peer.on('message', onMessage)
    peer.on('close', onClose)
    unsubscribers.push(() => {
      peer.off('message', onMessage)
      peer.off('close', onClose)
    })
  }

  function attachGuest(connection: GameConnection, clientId = createId('guest')) {
    if (!connection.connected) {
      throw new Error('guest connection 未 connect')
    }
    room.join({ id: clientId, peer: connection })
    wireSeat(clientId, connection)
    options.server.onJoin?.(serverHandle, clientId)
    return clientId
  }

  // 本机座位
  room.join({ id: hostPlayerId, peer: serverSide })
  wireSeat(hostPlayerId, serverSide)
  options.server.onJoin?.(serverHandle, hostPlayerId)

  // 本机 Client 模块
  const onClientMessage = (data: unknown) => {
    options.client.onMessage?.(data)
  }
  const onClientClose = () => {
    options.client.onClose?.()
  }
  clientSide.on('message', onClientMessage)
  clientSide.on('close', onClientClose)
  unsubscribers.push(() => {
    clientSide.off('message', onClientMessage)
    clientSide.off('close', onClientClose)
  })
  options.client.onConnect?.(clientHandle)

  if (remote) {
    attachGuest(remote, options.guestPlayerId ?? createId('guest'))
  }

  let stopped = false
  function stop() {
    if (stopped) return
    stopped = true
    for (const off of unsubscribers.splice(0)) off()
    for (const id of room.clients()) {
      room.leave(id)
    }
    try {
      clientSide.close()
    } catch {
      // ignore
    }
  }

  return {
    room,
    server: serverHandle,
    client: clientHandle,
    hostPlayerId,
    attachGuest,
    stop,
  }
}
