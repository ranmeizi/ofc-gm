import { EventTarget, type EventCapable } from '../../utils/Event.decorators'
import type { GameConnection } from '../Connection'

export type RoomClient = {
  id: string
  peer: GameConnection
}

export interface Room extends EventCapable {}

/**
 * 星型房间：持有各座位的 GameConnection（WebRTC 或 loopback）。
 */
@EventTarget
export class Room {
  private _clients = new Map<string, RoomClient>()

  get size() {
    return this._clients.size
  }

  has(clientId: string) {
    return this._clients.has(clientId)
  }

  clients(): string[] {
    return [...this._clients.keys()]
  }

  get(clientId: string) {
    return this._clients.get(clientId)
  }

  join(client: RoomClient) {
    if (this._clients.has(client.id)) {
      throw new Error(`client already in room: ${client.id}`)
    }
    this._clients.set(client.id, client)
    this.emit('join', client.id)
  }

  leave(clientId: string) {
    if (!this._clients.delete(clientId)) return
    this.emit('leave', clientId)
  }

  broadcast(data: string | ArrayBuffer) {
    for (const client of this._clients.values()) {
      if (!client.peer.connected) continue
      client.peer.send(data)
    }
  }

  send(clientId: string, data: string | ArrayBuffer) {
    const client = this._clients.get(clientId)
    if (!client) {
      throw new Error(`client not in room: ${clientId}`)
    }
    if (!client.peer.connected) {
      throw new Error(`client not connected: ${clientId}`)
    }
    client.peer.send(data)
  }
}

export default Room
