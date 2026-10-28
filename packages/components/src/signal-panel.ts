import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

export type SignalPanelRole = 'server' | 'client' | ''

/**
 * 信令交换面板（Web Component）
 *
 * - local-signal：本端 offer/answer，只读展示，可复制
 * - remote-signal：粘贴对端信令
 * - 事件 accept：外侧拿 detail.value 去做 peer.signal
 * - 事件 copy：复制成功/失败通知
 */
@customElement('ofc-signal-panel')
export class OfcSignalPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      color: #1a2330;
      font: 14px/1.5 ui-sans-serif, system-ui, sans-serif;
    }
    .panel {
      display: grid;
      gap: 12px;
    }
    @media (min-width: 800px) {
      .panel {
        grid-template-columns: 1fr 1fr;
      }
    }
    .card {
      border: 1px solid #d8dee6;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #667788;
    }
    textarea {
      width: 100%;
      min-height: 140px;
      box-sizing: border-box;
      resize: vertical;
      border: 1px solid #d8dee6;
      border-radius: 8px;
      padding: 10px;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    button {
      font: inherit;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #d8dee6;
      background: #fff;
      cursor: pointer;
    }
    button.primary {
      background: #1b6b4a;
      border-color: #1b6b4a;
      color: #fff;
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .meta {
      font-size: 12px;
      color: #667788;
    }
  `

  /** 本端信令 JSON 文本 */
  @property({ attribute: 'local-signal' })
  localSignal = ''

  /** 对端信令 JSON 文本（也可由面板内部编辑） */
  @property({ attribute: 'remote-signal' })
  remoteSignal = ''

  /** 可选角色提示 */
  @property()
  role: SignalPanelRole = ''

  @property({ type: Boolean })
  disabled = false

  private onRemoteInput(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value
    this.remoteSignal = value
    this.dispatchEvent(
      new CustomEvent('remote-change', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private async onCopy() {
    try {
      await navigator.clipboard.writeText(this.localSignal)
      this.dispatchEvent(
        new CustomEvent('copy', {
          detail: { ok: true },
          bubbles: true,
          composed: true,
        }),
      )
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent('copy', {
          detail: { ok: false, error },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  private onAccept() {
    const value = this.remoteSignal.trim()
    this.dispatchEvent(
      new CustomEvent('accept', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    const roleHint =
      this.role === 'server'
        ? 'server：复制 offer → 粘贴 client 的 answer'
        : this.role === 'client'
          ? 'client：粘贴 server 的 offer → 复制 answer'
          : '交换本端 / 对端 signal JSON'

    return html`
      <p class="meta">${roleHint}</p>
      <div class="panel">
        <div class="card">
          <h2>Local Signal</h2>
          <textarea .value=${this.localSignal} readonly></textarea>
          <div class="row">
            <button
              type="button"
              ?disabled=${this.disabled || !this.localSignal}
              @click=${this.onCopy}
            >
              复制
            </button>
          </div>
        </div>
        <div class="card">
          <h2>Remote Signal</h2>
          <textarea
            .value=${this.remoteSignal}
            ?disabled=${this.disabled}
            placeholder='粘贴对方 JSON，例如 {"type":"offer",...}'
            @input=${this.onRemoteInput}
          ></textarea>
          <div class="row">
            <button
              class="primary"
              type="button"
              ?disabled=${this.disabled || !this.remoteSignal.trim()}
              @click=${this.onAccept}
            >
              Accept Signal
            </button>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ofc-signal-panel': OfcSignalPanel
  }
}
