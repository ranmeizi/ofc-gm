/**
 * ICE：STUN + 可选 TURN（账号走 Vite 环境变量）
 *
 * .env / .env.local：
 *   VITE_TURN_USERNAME=...
 *   VITE_TURN_PASSWORD=...
 *   VITE_TURN_HOST=asia.relay.metered.ca   # 可选
 *
 * 也可用 localStorage 整表覆盖：
 *   localStorage.setItem('ofc-filedrop-ice', JSON.stringify([...]))
 */

const TURN_USER = import.meta.env.VITE_TURN_USERNAME as string | undefined
const TURN_PASS = import.meta.env.VITE_TURN_PASSWORD as string | undefined
const TURN_HOST =
  (import.meta.env.VITE_TURN_HOST as string | undefined) ||
  'asia.relay.metered.ca'

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.qq.com' },
    { urls: 'stun:stun.relay.metered.ca:80' },
  ]

  if (TURN_USER && TURN_PASS) {
    const auth = { username: TURN_USER, credential: TURN_PASS }
    servers.push(
      { urls: `turn:${TURN_HOST}:80`, ...auth },
      { urls: `turn:${TURN_HOST}:80?transport=tcp`, ...auth },
      { urls: `turn:${TURN_HOST}:443`, ...auth },
      { urls: `turns:${TURN_HOST}:443?transport=tcp`, ...auth },
    )
  }

  return servers
}

export const ICE_SERVERS: RTCIceServer[] = buildIceServers()

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
