/** WebRTC 信令载荷：与 PeerConnection.acceptRemoteSDP / generateSDP 对齐 */
export type SignalPayload = {
  type: 'offer' | 'answer'
  sdp: string
}

/** 客户端 → 服务端 */
export type ClientMessage =
  | {
      type: 'join'
      /** 房间号；双方约定同一个即可配对 */
      roomId: string
      /** 可选角色提示，便于对端识别 */
      role?: 'offer' | 'answer'
    }
  | {
      type: 'signal'
      /** SDP JSON（{ type, sdp }） */
      sdp: SignalPayload | string
      /** 指定转发给某 peer；省略则广播给房内其他人 */
      to?: string
    }
  | { type: 'leave' }
  | { type: 'ping' }

/** 服务端 → 客户端 */
export type ServerMessage =
  | { type: 'welcome'; peerId: string }
  | {
      type: 'joined'
      roomId: string
      peerId: string
      role?: 'offer' | 'answer'
      peers: Array<{ peerId: string; role?: 'offer' | 'answer' }>
    }
  | {
      type: 'peer-joined'
      peerId: string
      role?: 'offer' | 'answer'
    }
  | { type: 'peer-left'; peerId: string }
  | {
      type: 'signal'
      from: string
      sdp: SignalPayload | string
    }
  | { type: 'pong' }
  | { type: 'error'; message: string }
