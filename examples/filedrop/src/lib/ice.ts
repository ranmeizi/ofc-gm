/** 公网 ICE：多 STUN + 公开 TURN 兜底（对称 NAT / 运营商防火墙） */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // 国内常见 STUN（Google 不通时有用）
  { urls: 'stun:stun.qq.com' },
  { urls: 'stun:stun.miwifi.com' },
  { urls: 'stun:stun.chat.bilibili.com' },
  // 公开 TURN 兜底（打洞失败时走中继；自建 coturn 可在 localStorage 覆盖）
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:80?transport=tcp',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

const STORAGE_ICE = 'ofc-filedrop-ice'

/** 可选：localStorage 里塞自定义 ICE JSON 数组，覆盖默认 */
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
