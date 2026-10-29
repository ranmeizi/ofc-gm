import { EventTarget, type EventCapable } from '../../utils/Event.decorators'
import type { GameConnection } from './index'

export interface LocalConnection extends EventCapable {}

/**
 * 同进程 loopback：主机玩家不走 WebRTC，但与远端共用 GameConnection 语义。
 */
@EventTarget
export class LocalConnection implements GameConnection {
  private _connected = false
  private other?: LocalConnection

  get connected() {
    return this._connected
  }

  /** 成对绑定；只应在 createLocalLoopback 里调用 */
  link(other: LocalConnection) {
    this.other = other
  }

  connect() {
    if (this._connected) return
    this._connected = true
    this.emit('connect')
  }

  send(data: string | ArrayBuffer) {
    if (!this._connected) {
      throw new Error('LocalConnection not connected — call connect() first')
    }
    if (!this.other) {
      throw new Error('LocalConnection not linked')
    }
    const target = this.other
    // 异步投递，避免与调用栈同步重入
    queueMicrotask(() => {
      if (target._connected) target.emit('message', data)
    })
  }

  close() {
    if (!this._connected) return
    this._connected = false
    this.emit('close')
    const peer = this.other
    this.other = undefined
    if (peer?._connected) {
      peer.other = undefined
      peer._connected = false
      peer.emit('close')
    }
  }
}

/** 一对 loopback：serverSide 进 Room，clientSide 给本机 Client 模块 */
export function createLocalLoopback(): {
  serverSide: LocalConnection
  clientSide: LocalConnection
} {
  const serverSide = new LocalConnection()
  const clientSide = new LocalConnection()
  serverSide.link(clientSide)
  clientSide.link(serverSide)
  return { serverSide, clientSide }
}
