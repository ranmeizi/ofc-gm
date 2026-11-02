import type { FileMeta, LocalFile, Role } from './types'
import { uid } from './utils'

type ServerMessage =
  | { type: 'welcome'; peerId: string }
  | {
      type: 'joined'
      roomId: string
      peerId: string
      role?: Role
      peers: Array<{ peerId: string; role?: Role }>
    }
  | { type: 'peer-joined'; peerId: string; role?: Role }
  | { type: 'peer-left'; peerId: string }
  | { type: 'signal'; from: string; sdp: { type: string; sdp: string } | string }
  | { type: 'error'; message: string }
  | { type: 'pong' }

export type SessionHandlers = {
  onStatus: (text: string, kind?: 'info' | 'ok' | 'warn' | 'err') => void
  onChannelOpen: () => void
  onChannelClose: () => void
  onPeerList: (files: FileMeta[]) => void
  onProgress?: (text: string) => void
}

const CHUNK = 64 * 1024

export class FiledropSession {
  private ws: WebSocket | null = null
  private pc: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private role: Role | null = null
  private roomId = ''
  private offerSent = false
  private answerSent = false
  private mine = new Map<string, LocalFile>()
  private incoming = new Map<
    string,
    { meta: FileMeta; chunks: string[]; received: number; total: number }
  >()
  private handlers: SessionHandlers

  constructor(handlers: SessionHandlers) {
    this.handlers = handlers
  }

  getRoomId() {
    return this.roomId
  }

  getMine(): LocalFile[] {
    return [...this.mine.values()]
  }

  isChannelOpen() {
    return this.channel?.readyState === 'open'
  }

  async connect(wsUrl: string, roomId: string, role: Role) {
    this.close(false)
    this.role = role
    this.roomId = roomId
    this.offerSent = false
    this.answerSent = false
    this.handlers.onStatus(role === 'answer' ? '生成中…' : '输入中…', 'warn')

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    if (role === 'offer') {
      this.bindChannel(this.pc.createDataChannel('filedrop'))
    }
    this.pc.ondatachannel = (ev) => this.bindChannel(ev.channel)

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl)
      this.ws = ws
      ws.onopen = () => {
        this.wsSend({ type: 'join', roomId, role })
        this.handlers.onStatus(
          role === 'answer' ? '等对方输入…' : '连接中…',
          'warn',
        )
        resolve()
      }
      ws.onerror = () => {
        this.handlers.onStatus('连不上，稍后再试', 'err')
        reject(new Error('ws error'))
      }
      ws.onclose = () => {
        if (this.ws === ws) this.handlers.onStatus('断开了', 'warn')
      }
      ws.onmessage = (ev) => {
        void this.onWsMessage(ev.data)
      }
    })
  }

  addFiles(files: FileList | File[]) {
    const list = Array.from(files)
    for (const file of list) {
      const id = uid()
      this.mine.set(id, {
        id,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        blob: file,
      })
    }
    this.sendList()
    return this.getMine()
  }

  removeFile(id: string) {
    this.mine.delete(id)
    this.sendList()
    return this.getMine()
  }

  requestDownload(meta: FileMeta) {
    if (!this.isChannelOpen()) {
      this.handlers.onStatus('还没连上', 'err')
      return
    }
    this.incoming.set(meta.id, {
      meta,
      chunks: [],
      received: 0,
      total: 0,
    })
    this.handlers.onStatus('下载中…', 'warn')
    this.dcSend({ type: 'get', id: meta.id })
  }

  close(resetRoom = true) {
    try {
      this.channel?.close()
    } catch {
      //
    }
    try {
      this.pc?.close()
    } catch {
      //
    }
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.wsSend({ type: 'leave' })
      }
      this.ws?.close()
    } catch {
      //
    }
    this.ws = null
    this.pc = null
    this.channel = null
    this.role = null
    if (resetRoom) this.roomId = ''
    this.handlers.onPeerList([])
  }

  private wsSend(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private dcSend(msg: unknown) {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(msg))
    }
  }

  private sendList() {
    const files = this.getMine().map(({ id, name, size, mime }) => ({
      id,
      name,
      size,
      mime,
    }))
    this.dcSend({ type: 'list', files })
  }

  private bindChannel(channel: RTCDataChannel) {
    this.channel = channel
    channel.onopen = () => {
      this.handlers.onStatus('可以传文件了', 'ok')
      this.handlers.onChannelOpen()
      this.sendList()
    }
    channel.onclose = () => {
      this.handlers.onStatus('断开了', 'warn')
      this.handlers.onChannelClose()
      this.handlers.onPeerList([])
    }
    channel.onmessage = (ev) => this.onChannelMessage(String(ev.data))
  }

  private async waitIce(pc: RTCPeerConnection) {
    if (pc.iceGatheringState === 'complete') return
    await Promise.race([
      new Promise<void>((resolve) => {
        const check = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', check)
            resolve()
          }
        }
        pc.addEventListener('icegatheringstatechange', check)
      }),
      new Promise<void>((r) => setTimeout(r, 3000)),
    ])
  }

  private async sendOffer() {
    if (this.offerSent || this.role !== 'offer' || !this.pc) return
    this.offerSent = true
    try {
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)
      await this.waitIce(this.pc)
      this.wsSend({
        type: 'signal',
        sdp: {
          type: this.pc.localDescription!.type,
          sdp: this.pc.localDescription!.sdp,
        },
      })
      this.handlers.onStatus('连接中…', 'warn')
    } catch {
      this.offerSent = false
      this.handlers.onStatus('连不上，稍后再试', 'err')
    }
  }

  private async handleSignal(sdp: { type: string; sdp: string } | string) {
    if (!this.pc || !this.role) return
    const parsed =
      typeof sdp === 'string'
        ? (JSON.parse(sdp) as { type: string; sdp: string })
        : sdp
    const init: RTCSessionDescriptionInit = {
      type: parsed.type as RTCSdpType,
      sdp: parsed.sdp,
    }
    if (this.role === 'answer' && init.type === 'offer') {
      if (this.answerSent) return
      this.answerSent = true
      await this.pc.setRemoteDescription(init)
      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      await this.waitIce(this.pc)
      this.wsSend({
        type: 'signal',
        sdp: {
          type: this.pc.localDescription!.type,
          sdp: this.pc.localDescription!.sdp,
        },
      })
      this.handlers.onStatus('连接中…', 'warn')
    } else if (this.role === 'offer' && init.type === 'answer') {
      await this.pc.setRemoteDescription(init)
      this.handlers.onStatus('连接中…', 'warn')
    }
  }

  private async onWsMessage(raw: unknown) {
    let msg: ServerMessage
    try {
      msg = JSON.parse(String(raw)) as ServerMessage
    } catch {
      return
    }
    if (msg.type === 'joined') {
      if (this.role === 'offer' && msg.peers.length >= 1) await this.sendOffer()
      return
    }
    if (msg.type === 'peer-joined') {
      if (this.role === 'offer') await this.sendOffer()
      else this.handlers.onStatus('对方来了，连接中…', 'warn')
      return
    }
    if (msg.type === 'signal') {
      try {
        await this.handleSignal(msg.sdp)
      } catch {
        this.handlers.onStatus('连不上，稍后再试', 'err')
      }
      return
    }
    if (msg.type === 'error') {
      this.handlers.onStatus('连不上，稍后再试', 'err')
      return
    }
    if (msg.type === 'peer-left') {
      this.handlers.onStatus('对方走了', 'warn')
      this.handlers.onPeerList([])
    }
  }

  private onChannelMessage(raw: string) {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return
    }
    if (msg.type === 'list' && Array.isArray(msg.files)) {
      this.handlers.onPeerList(msg.files as FileMeta[])
      return
    }
    if (msg.type === 'get' && typeof msg.id === 'string') {
      void this.fulfillGet(msg.id)
      return
    }
    if (msg.type === 'file-start') {
      const id = String(msg.id)
      this.incoming.set(id, {
        meta: {
          id,
          name: String(msg.name),
          size: Number(msg.size),
          mime: String(msg.mime || 'application/octet-stream'),
        },
        chunks: [],
        received: 0,
        total: Number(msg.total || 1),
      })
      this.handlers.onStatus('下载中…', 'warn')
      return
    }
    if (msg.type === 'file-chunk') {
      const id = String(msg.id)
      const slot = this.incoming.get(id)
      if (!slot) return
      const index = Number(msg.index)
      slot.chunks[index] = String(msg.data)
      slot.received += 1
      const total = Number(msg.total || slot.total)
      if (slot.received >= total) {
        this.finishIncoming(id)
      } else {
        const pct = Math.floor((slot.received / total) * 100)
        this.handlers.onProgress?.(`下载中 ${pct}%`)
      }
    }
  }

  private finishIncoming(id: string) {
    const slot = this.incoming.get(id)
    if (!slot) return
    let bin = ''
    for (const part of slot.chunks) bin += atob(part)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const blob = new Blob([bytes], { type: slot.meta.mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = slot.meta.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    this.incoming.delete(id)
    this.handlers.onStatus('下载完成', 'ok')
  }

  private async fulfillGet(id: string) {
    const f = this.mine.get(id)
    if (!f) {
      this.dcSend({ type: 'error', message: 'file not found', id })
      return
    }
    const buf = new Uint8Array(await f.blob.arrayBuffer())
    const total = Math.max(1, Math.ceil(buf.length / CHUNK))
    this.dcSend({
      type: 'file-start',
      id: f.id,
      name: f.name,
      size: f.size,
      mime: f.mime,
      total,
    })
    for (let i = 0; i < total; i++) {
      const slice = buf.subarray(i * CHUNK, Math.min(buf.length, (i + 1) * CHUNK))
      let s = ''
      for (let k = 0; k < slice.length; k++) s += String.fromCharCode(slice[k]!)
      this.dcSend({
        type: 'file-chunk',
        id: f.id,
        index: i,
        total,
        data: btoa(s),
      })
      await new Promise((r) => setTimeout(r, 0))
    }
    this.handlers.onStatus('发送完成', 'ok')
  }
}
