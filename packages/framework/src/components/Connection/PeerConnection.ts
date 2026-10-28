type PeerRole = 'offer' | 'answer'

/** 局域网：无 STUN；万维网：开公网 STUN */
type PeerNetwork = 'lan' | 'internet'

interface PeerConnectionOptions {
  role?: PeerRole
  network?: PeerNetwork
  iceServers?: RTCIceServer[]
}

const INTERNET_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

function parseSignal(input: string | RTCSessionDescriptionInit): RTCSessionDescriptionInit {
  if (typeof input !== 'string') return input
  const value = input.trim()
  if (!value.startsWith('{')) {
    throw new Error('信令需要 JSON，包含 type 和 sdp')
  }
  const parsed = JSON.parse(value) as RTCSessionDescriptionInit
  if (!parsed?.type || !parsed?.sdp) {
    throw new Error('JSON 里需要 type 和 sdp')
  }
  return parsed
}

class PeerConnection {
  role?: PeerRole

  network: PeerNetwork = 'lan'

  peer?: RTCPeerConnection

  channel?: RTCDataChannel

  /** 测试 / 上层可挂的回调 */
  onChannelOpen?: () => void
  onChannelClose?: () => void
  onChannelMessage?: (data: unknown) => void
  onChannelError?: (event: Event) => void

  /**
   * 双方各自的 SDP
   */
  private _mySDP?: RTCSessionDescription
  private _theirSDP?: RTCSessionDescription

  /**
   * ICE 服务器列表
   * - lan：默认空（只走 host）
   * - internet：默认 Google STUN
   * - 构造时显式传入 iceServers 时优先生效
   */
  iceServers: RTCIceServer[] = []

  constructor({ iceServers }: PeerConnectionOptions = {}) {
    this.iceServers = iceServers ?? INTERNET_ICE_SERVERS
  }

  get mySDP() {
    return this._mySDP
  }

  get theirSDP() {
    return this._theirSDP
  }

  // 绑定channel
  private _bindChannel(channel: RTCDataChannel) {
    this.channel = channel
    channel.binaryType = 'arraybuffer'

    channel.onmessage = (event) => {
      this.onChannelMessage?.(event.data)
    }

    channel.onopen = () => {
      this.onChannelOpen?.()
    }

    channel.onclose = () => {
      this.onChannelClose?.()
    }

    channel.onerror = (event) => {
      this.onChannelError?.(event)
    }
  }

  private waitForIceGatheringComplete(): Promise<void> {
    const peer = this.peer
    if (!peer) return Promise.resolve()
    if (peer.iceGatheringState === 'complete') return Promise.resolve()

    return new Promise((resolve) => {
      const onChange = () => {
        if (peer.iceGatheringState === 'complete') {
          peer.removeEventListener('icegatheringstatechange', onChange)
          resolve()
        }
      }
      peer.addEventListener('icegatheringstatechange', onChange)
    })
  }

  // 重置
  private _reset() {
    this.peer = undefined
    this.channel = undefined
    this._mySDP = undefined
    this._theirSDP = undefined
    this.role = undefined
    this.network = 'lan'
    this.iceServers = INTERNET_ICE_SERVERS
  }

  // 销毁
  public destroy() {
    try {
      this.channel?.close()
    } catch {
      // ignore
    }
    try {
      this.peer?.close()
    } catch {
      // ignore
    }
    this._reset()
  }

  // 例如ui选择确定role后调用
  public setRole(role: PeerRole) {
    this.role = role
  }

  // 例如ui选择确定network后调用
  public setNetwork(network: PeerNetwork) {
    this.network = network
  }

  // 确认 network + role 后即可调用此方法创建 peer
  public createPeer() {
    if (!this.network) {
      throw new Error('Network not set')
    }
    if (!this.role) {
      throw new Error('Role not set')
    }
    if (this.peer) {
      throw new Error('Peer already created')
    }

    this.peer = new RTCPeerConnection({
      iceServers: this.network === 'lan' ? [] : this.iceServers,
    })

    // offer 端主动建 DataChannel；answer 端等 ondatachannel
    if (this.role === 'offer') {
      this._bindChannel(this.peer.createDataChannel('ofc'))
    }

    this.peer.ondatachannel = (event) => {
      this._bindChannel(event.channel)
    }
  }

  /** 接收对端信令（offer 收 answer；answer 收 offer） */
  public async acceptRemoteSDP(input: string | RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) {
      throw new Error('Peer not created')
    }
    if (!this.role) {
      throw new Error('Role not set')
    }

    const init = parseSignal(input)
    this._theirSDP = new RTCSessionDescription(init)

    if (this.role === 'offer') {
      // offer 已生成本地 SDP，这里吃 answer
      if (init.type !== 'answer') {
        throw new Error(`offer 端应接收 answer，当前是 ${init.type}`)
      }
      await this.peer.setRemoteDescription(this._theirSDP)
      return
    }

    // answer 端先存 offer，真正 setRemote 在 generateSDP 里和 createAnswer 一起做
    if (init.type !== 'offer') {
      throw new Error(`answer 端应接收 offer，当前是 ${init.type}`)
    }
  }

  async generateSDP(): Promise<RTCSessionDescription> {
    if (!this.peer) {
      throw new Error('Peer not created')
    }
    if (!this.role) {
      throw new Error('Role not set')
    }

    if (this.role === 'offer') {
      const offer = await this.peer.createOffer()
      await this.peer.setLocalDescription(offer)
      await this.waitForIceGatheringComplete()
      this._mySDP = this.peer.localDescription!
    } else {
      if (!this._theirSDP) {
        throw new Error('Their SDP not set — 先 Accept 对端 offer')
      }
      await this.peer.setRemoteDescription(this._theirSDP)
      const answer = await this.peer.createAnswer()
      await this.peer.setLocalDescription(answer)
      await this.waitForIceGatheringComplete()
      this._mySDP = this.peer.localDescription!
    }

    return this._mySDP
  }
}

export default PeerConnection
export type { PeerRole, PeerNetwork, PeerConnectionOptions }
