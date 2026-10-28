import type { ClientMessage, ServerMessage } from '@ofc-gm/ws/protocol'

export type SignalClientHandlers = {
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: unknown) => void
  onMessage?: (msg: ServerMessage) => void
}

/**
 * 浏览器侧信令客户端：连 `@ofc-gm/ws`，join 两人房并收发 SDP。
 */
export class SignalClient {
  private ws?: WebSocket
  private handlers: SignalClientHandlers = {}

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  setHandlers(handlers: SignalClientHandlers) {
    this.handlers = handlers
  }

  connect(url: string): Promise<void> {
    this.close()
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      this.ws = ws

      const onOpen = () => {
        cleanupConnect()
        this.handlers.onOpen?.()
        resolve()
      }
      const onError = (event: Event) => {
        cleanupConnect()
        this.handlers.onError?.(event)
        reject(new Error('WebSocket 连接失败'))
      }
      const cleanupConnect = () => {
        ws.removeEventListener('open', onOpen)
        ws.removeEventListener('error', onError)
      }

      ws.addEventListener('open', onOpen)
      ws.addEventListener('error', onError)
      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as ServerMessage
          this.handlers.onMessage?.(msg)
        } catch (e) {
          this.handlers.onError?.(e)
        }
      })
      ws.addEventListener('close', () => {
        this.handlers.onClose?.()
      })
    })
  }

  send(msg: ClientMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接')
    }
    this.ws.send(JSON.stringify(msg))
  }

  join(roomId: string, role?: 'offer' | 'answer') {
    this.send({ type: 'join', roomId, role })
  }

  signal(sdp: { type: 'offer' | 'answer'; sdp: string } | string, to?: string) {
    this.send({ type: 'signal', sdp, to })
  }

  leave() {
    if (!this.connected) return
    try {
      this.send({ type: 'leave' })
    } catch {
      // ignore
    }
  }

  close() {
    const ws = this.ws
    this.ws = undefined
    if (!ws) return
    try {
      ws.close()
    } catch {
      // ignore
    }
  }
}
