import type { WebSocket } from 'ws'
import type { ServerMessage } from './protocol.js'

export type PeerRole = 'offer' | 'answer'

export type Peer = {
  id: string
  socket: WebSocket
  role?: PeerRole
  roomId?: string
}

export type Room = {
  id: string
  peers: Map<string, Peer>
}

export class RoomManager {
  private rooms = new Map<string, Room>()

  get size() {
    return this.rooms.size
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  join(roomId: string, peer: Peer, maxPeers: number): Room {
    let room = this.rooms.get(roomId)
    if (!room) {
      room = { id: roomId, peers: new Map() }
      this.rooms.set(roomId, room)
    }

    if (peer.roomId && peer.roomId !== roomId) {
      this.leave(peer)
    }

    if (room.peers.has(peer.id)) {
      return room
    }

    if (room.peers.size >= maxPeers) {
      throw new Error(`房间已满（最多 ${maxPeers} 人）`)
    }

    peer.roomId = roomId
    room.peers.set(peer.id, peer)
    return room
  }

  leave(peer: Peer): string | undefined {
    const roomId = peer.roomId
    if (!roomId) return undefined

    const room = this.rooms.get(roomId)
    peer.roomId = undefined
    if (!room) return roomId

    room.peers.delete(peer.id)
    if (room.peers.size === 0) {
      this.rooms.delete(roomId)
    }
    return roomId
  }

  others(peer: Peer): Peer[] {
    if (!peer.roomId) return []
    const room = this.rooms.get(peer.roomId)
    if (!room) return []
    return [...room.peers.values()].filter((p) => p.id !== peer.id)
  }

  find(roomId: string, peerId: string): Peer | undefined {
    return this.rooms.get(roomId)?.peers.get(peerId)
  }

  send(peer: Peer, message: ServerMessage) {
    if (peer.socket.readyState !== peer.socket.OPEN) return
    peer.socket.send(JSON.stringify(message))
  }

  broadcast(peers: Peer[], message: ServerMessage) {
    for (const peer of peers) {
      this.send(peer, message)
    }
  }
}
