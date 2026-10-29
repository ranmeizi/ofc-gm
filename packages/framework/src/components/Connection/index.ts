import { EventTarget, type EventCapable } from '../../utils/Event.decorators'
import PeerConnection from './PeerConnection'

interface ConnectionOptions {
    role: 'server' | 'client'
    iceServers?: RTCIceServer[]
    messageType: 'text' | 'binary'
}

/** 游戏运行时调用的连接抽象（WebRTC Connection / LocalConnection） */
interface GameConnection extends EventCapable {
    readonly connected: boolean
    connect(): void
    send(data: string | ArrayBuffer): void
    close(): void
}

export interface Connection extends EventCapable { }

/**
 * 上层游戏用的连接门面。
 * WebRTC / 信令由 PeerConnection 先建好；这里只负责启用收发与关闭。
 */
@EventTarget
export class Connection implements GameConnection {
    private _connected = false

    constructor(
        private readonly peerConnection: PeerConnection,
        private readonly messageType: 'text' | 'binary',
    ) { }

    get connected() {
        return this._connected
    }

    /**
     * 连接早在这之前创建好了，这里是启用：
     * - 校验 DataChannel 已 open
     * - 按 messageType 配置 binaryType
     * - 把 channel 消息转到 Connection 事件
     */
    connect() {
        if (this._connected) return

        const channel = this.peerConnection.channel
        if (!channel) {
            throw new Error('DataChannel not ready')
        }
        if (channel.readyState !== 'open') {
            throw new Error(`DataChannel not open (state=${channel.readyState})`)
        }

        channel.binaryType = this.messageType === 'binary' ? 'arraybuffer' : 'blob'

        channel.onmessage = (event) => {
            this.emit('message', event.data)
        }

        channel.onclose = () => {
            if (!this._connected) return
            this._connected = false
            this.emit('close')
        }

        channel.onerror = (event) => {
            this.emit('error', event)
        }

        this._connected = true
        this.emit('connect')
    }

    send( data: string | ArrayBuffer) {
        if (!this._connected) {
            throw new Error('Connection not connected — call connect() first')
        }

        const channel = this.peerConnection.channel
        if (!channel || channel.readyState !== 'open') {
            throw new Error('DataChannel not open')
        }

        if (this.messageType === 'text') {
            channel.send(data as string)
        } else {
            channel.send(data as ArrayBuffer)
        }
    }

    /**
     * 关闭游戏连接并销毁底层 peer。
     */
    close() {
        if (!this._connected && !this.peerConnection.channel && !this.peerConnection.peer) {
            return
        }

        this._connected = false

        try {
            this.peerConnection.channel?.close()
        } catch {
            // ignore
        }

        this.peerConnection.destroy()
        this.emit('close')
    }
}

export default Connection
export type { ConnectionOptions, GameConnection }
