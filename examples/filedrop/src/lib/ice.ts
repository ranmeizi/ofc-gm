/**
 * 展示用 ICE：
 * - STUN：能直连就直连（不占你服务器带宽）
 * - TURN：打洞失败时走公开中继（Metered Open Relay，适合 demo）
 *
 * 正式环境请换成自己的 coturn，或 localStorage 覆盖：
 *   localStorage.setItem('ofc-filedrop-ice', JSON.stringify([{ urls, username, credential }, ...]))
 */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.qq.com' },
  // 公开 TURN（展示兜底；优先 443/TCP，公司网更容易过）
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:80?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

const STORAGE_ICE = 'ofc-filedrop-ice'

export function resolveIceServers(): RTCIceServer[] {
  try {
    const raw = localStorage.getItem(STORAGE_ICE)
    if (!raw) return ICE_SERVERS
    const parsed = JSON.parse(raw) as RTCIceServer[]
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    //
  }
  return ICE_SERVERS
}
