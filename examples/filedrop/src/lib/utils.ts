export function randomRoom(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = new Uint8Array(len)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => alphabet[b % alphabet.length]).join('')
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export const STORAGE_WS = 'ofc-filedrop-ws'

/** 默认同域信令：https 页用 wss，开发用本机 8787 */
export function defaultWsUrl() {
  const { protocol, hostname, host } = window.location
  const secured = protocol === 'https:'
  // 生产若反代了 /signal，优先同 host；本地 Vite 开发仍打 8787
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${secured ? 'wss' : 'ws'}://${hostname}:8787/signal`
  }
  return `${secured ? 'wss' : 'ws'}://${host}/signal`
}

export const DEFAULT_WS = defaultWsUrl()
