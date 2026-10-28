import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PeerConnection } from '@ofc-gm/framework'

function signalJson(desc: RTCSessionDescription): string {
  return JSON.stringify({ type: desc.type, sdp: desc.sdp }, null, 2)
}

/**
 * 手动信令交换面板（供 Modal 嵌入）
 *
 * PeerConnection 由外部创建并传入：
 *   el.peer = peerConnection
 *
 * 组件只负责：展示/复制本端 SDP、粘贴并 Accept 对端 SDP。
 * 不负责 new / destroy PeerConnection。
 */
@customElement('ofc-signal-exchange')
export class OfcSignalExchange extends LitElement {
  static override styles = css`
    :host {
      display: block;
      color: #1c2430;
      font: 14px/1.5 "PingFang SC", "Segoe UI", sans-serif;
    }

    .head {
      margin-bottom: 16px;
    }
    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .desc {
      margin: 6px 0 0;
      font-size: 13px;
      color: #667788;
    }

    .steps {
      display: grid;
      gap: 14px;
    }

    .step {
      padding: 12px 14px;
      border: 1px solid #e3e8ef;
      border-radius: 12px;
      background: #fbfcfd;
    }
    .step-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: #1f6f55;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
    }

    textarea {
      width: 100%;
      min-height: 110px;
      box-sizing: border-box;
      resize: vertical;
      border: 1px solid #d8dee6;
      border-radius: 10px;
      padding: 10px 12px;
      background: #fff;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #1c2430;
    }
    textarea:focus {
      outline: 2px solid rgba(31, 111, 85, 0.25);
      border-color: #1f6f55;
    }
    textarea[readonly] {
      background: #f5f7fa;
      color: #334155;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    button {
      font: inherit;
      border-radius: 10px;
      border: 1px solid #d8dee6;
      background: #fff;
      padding: 8px 14px;
      cursor: pointer;
      color: #1c2430;
    }
    button:hover:not(:disabled) {
      border-color: #b7c2ce;
      background: #f8fafc;
    }
    button.primary {
      background: #1f6f55;
      border-color: #1f6f55;
      color: #fff;
    }
    button.primary:hover:not(:disabled) {
      background: #185a45;
      border-color: #185a45;
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #eef2f6;
    }
    .status {
      font-size: 13px;
      color: #667788;
    }
    .status.ok {
      color: #067647;
      font-weight: 600;
    }
    .err {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      background: #fff5f5;
      color: #b42318;
      font-size: 13px;
    }
    .empty {
      padding: 20px 12px;
      text-align: center;
      color: #667788;
      font-size: 13px;
      border: 1px dashed #d8dee6;
      border-radius: 12px;
      background: #fbfcfd;
    }
  `

  /** 外部传入的 PeerConnection（已 setRole / setNetwork / createPeer） */
  @property({ attribute: false })
  peer?: PeerConnection

  @state() private local = ''
  @state() private remote = ''
  @state() private status: 'idle' | 'waiting' | 'open' = 'idle'
  @state() private error = ''
  @state() private busy = false

  private boundPeer?: PeerConnection
  private prevOpen?: () => void
  private prevClose?: () => void
  private prevMessage?: (data: unknown) => void
  private prevError?: (event: Event) => void

  get connected() {
    return this.status === 'open'
  }

  private emit(name: string, detail?: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    )
  }

  private unbindPeer() {
    if (!this.boundPeer) return
    this.boundPeer.onChannelOpen = this.prevOpen
    this.boundPeer.onChannelClose = this.prevClose
    this.boundPeer.onChannelMessage = this.prevMessage
    this.boundPeer.onChannelError = this.prevError
    this.boundPeer = undefined
    this.prevOpen = undefined
    this.prevClose = undefined
    this.prevMessage = undefined
    this.prevError = undefined
  }

  private bindPeer(peer: PeerConnection) {
    this.unbindPeer()
    this.boundPeer = peer
    this.prevOpen = peer.onChannelOpen
    this.prevClose = peer.onChannelClose
    this.prevMessage = peer.onChannelMessage
    this.prevError = peer.onChannelError

    peer.onChannelOpen = () => {
      this.prevOpen?.()
      this.status = 'open'
      this.emit('open')
    }
    peer.onChannelClose = () => {
      this.prevClose?.()
      if (this.status === 'open') this.status = 'waiting'
      this.emit('close')
    }
    peer.onChannelMessage = (data) => {
      this.prevMessage?.(data)
      this.emit('message', data)
    }
    peer.onChannelError = (event) => {
      this.prevError?.(event)
      this.emit('error', event)
    }
  }

  private async syncFromPeer() {
    const peer = this.peer
    this.error = ''
    this.local = ''
    this.remote = ''
    this.status = 'idle'

    if (!peer) return
    if (!peer.peer || !peer.role) {
      this.error = '请先在外部完成 setRole / createPeer，再传入 peer'
      return
    }

    this.bindPeer(peer)
    this.status = 'waiting'
    this.busy = true
    try {
      if (peer.role === 'offer') {
        const desc = peer.mySDP ?? (await peer.generateSDP())
        this.local = signalJson(desc)
      } else if (peer.mySDP) {
        this.local = signalJson(peer.mySDP)
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
      this.emit('error', e)
    } finally {
      this.busy = false
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has('peer')) {
      void this.syncFromPeer()
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    // 不 destroy 外部 peer，只拆掉回调桥接
    this.unbindPeer()
  }

  private async onCopy() {
    try {
      await navigator.clipboard.writeText(this.local)
      this.emit('copy', { ok: true })
    } catch (e) {
      this.emit('copy', { ok: false, error: e })
    }
  }

  private async onAccept() {
    const peer = this.peer
    if (!peer) {
      this.error = '未传入 peer'
      return
    }
    this.error = ''
    this.busy = true
    try {
      await peer.acceptRemoteSDP(this.remote)
      if (peer.role === 'answer') {
        const desc = await peer.generateSDP()
        this.local = signalJson(desc)
      }
      this.emit('accept', { role: peer.role })
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
      this.emit('error', e)
    } finally {
      this.busy = false
    }
  }

  private roleHint() {
    const role = this.peer?.role
    if (role === 'offer') {
      return '你是发起方：先把「你的连接码」发给对方，再粘贴对方回传的连接码。'
    }
    if (role === 'answer') {
      return '你是接收方：先粘贴对方的连接码并确认，再把生成的「你的连接码」发回去。'
    }
    return '请从外部传入已创建的 PeerConnection。'
  }

  override render() {
    if (!this.peer) {
      return html`<div class="empty">等待外部传入 PeerConnection…</div>`
    }

    const role = this.peer.role
    const canAccept = !this.busy && !!this.remote.trim() && this.status !== 'open'

    return html`
      <div class="head">
        <h3 class="title">手动交换连接码</h3>
        <p class="desc">${this.roleHint()}</p>
      </div>

      <div class="steps">
        <div class="step">
          <div class="step-label">
            <span class="badge">1</span>
            你的连接码
          </div>
          <textarea
            .value=${this.local}
            readonly
            placeholder=${role === 'answer'
              ? '确认对方连接码后，这里会生成你的连接码'
              : '正在准备你的连接码…'}
          ></textarea>
          <div class="actions">
            <button type="button" ?disabled=${!this.local || this.busy} @click=${this.onCopy}>
              复制连接码
            </button>
          </div>
        </div>

        <div class="step">
          <div class="step-label">
            <span class="badge">2</span>
            对方的连接码
          </div>
          <textarea
            .value=${this.remote}
            ?disabled=${this.busy || this.status === 'open'}
            placeholder="在这里粘贴对方发给你的连接码"
            @input=${(e: Event) => {
              this.remote = (e.target as HTMLTextAreaElement).value
            }}
          ></textarea>
          <div class="actions">
            <button
              class="primary"
              type="button"
              ?disabled=${!canAccept}
              @click=${this.onAccept}
            >
              ${role === 'answer' ? '确认并生成我的连接码' : '确认连接'}
            </button>
          </div>
        </div>
      </div>

      <div class="footer">
        <span class="status ${this.status === 'open' ? 'ok' : ''}">
          ${this.status === 'open'
            ? '已连接'
            : this.status === 'waiting'
              ? '等待交换连接码'
              : '未就绪'}
        </span>
      </div>

      ${this.error ? html`<div class="err">${this.error}</div>` : null}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ofc-signal-exchange': OfcSignalExchange
  }
}
