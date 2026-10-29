'use client'

import type { Connection, HostSession, PeerNetwork, PeerRole } from '@ofc-gm/framework'

export type ConnectMethod = 'ws' | 'manual' | 'stun' | 'postmessage'

export type ConnectPhase =
  | 'idle'
  | 'configuring'
  | 'connecting'
  | 'connected'
  | 'error'

export type DemoSessionSnapshot = {
  method: ConnectMethod | null
  phase: ConnectPhase
  role: PeerRole | null
  network: PeerNetwork
  detail: string
  error: string | null
  /** DataChannel 已就绪的连接；未连通时为 null */
  connection: Connection | null
}

type Listener = () => void

const listeners = new Set<Listener>()

let snapshot: DemoSessionSnapshot = {
  method: null,
  phase: 'idle',
  role: null,
  network: 'lan',
  detail: '未连接',
  error: null,
  connection: null,
}

/** 当前进行中的 createHostSession，便于取消 */
let activeSession: HostSession | null = null
let closeUnsub: (() => void) | null = null

function emit() {
  for (const l of listeners) l()
}

function setSnapshot(patch: Partial<DemoSessionSnapshot>) {
  snapshot = { ...snapshot, ...patch }
  emit()
}

export function getDemoSession(): DemoSessionSnapshot {
  return snapshot
}

export function subscribeDemoSession(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isDemoConnected() {
  return snapshot.phase === 'connected' && !!snapshot.connection?.connected
}

export const METHOD_LABELS: Record<ConnectMethod, string> = {
  ws: 'WebSocket',
  manual: '手动信令',
  stun: 'STUN 探测',
  postmessage: 'Tab postMessage',
}

export function beginConnect(options: {
  method: ConnectMethod
  role: PeerRole
  network?: PeerNetwork
  detail?: string
}) {
  // 换方法 / 重连时清掉旧会话
  resetDemoSession({ keepMethod: false })
  setSnapshot({
    method: options.method,
    role: options.role,
    network: options.network ?? (options.method === 'stun' ? 'internet' : 'lan'),
    phase: 'configuring',
    detail: options.detail ?? '配置中…',
    error: null,
    connection: null,
  })
}

export function setConnectProgress(detail: string, phase: ConnectPhase = 'connecting') {
  setSnapshot({ detail, phase, error: null })
}

export function setConnectError(message: string) {
  setSnapshot({ phase: 'error', error: message, detail: message })
}

export function registerHostSession(session: HostSession) {
  activeSession = session
}

/**
 * 通道就绪：挂上全局 Connection，并监听 close。
 */
export function markConnected(connection: Connection, detail = '已连接') {
  closeUnsub?.()
  closeUnsub = null

  const onClose = () => {
    if (snapshot.connection !== connection) return
    setSnapshot({
      phase: 'idle',
      connection: null,
      detail: '连接已断开',
      error: null,
    })
    activeSession = null
    closeUnsub = null
  }

  connection.on('close', onClose)
  closeUnsub = () => {
    connection.off('close', onClose)
  }

  setSnapshot({
    phase: 'connected',
    connection,
    detail,
    error: null,
  })
}

export function resetDemoSession(options?: { keepMethod?: boolean }) {
  closeUnsub?.()
  closeUnsub = null

  try {
    activeSession?.cancel()
  } catch {
    // ignore
  }
  activeSession = null

  try {
    snapshot.connection?.close()
  } catch {
    // ignore
  }

  const keepMethod = options?.keepMethod ?? false
  setSnapshot({
    method: keepMethod ? snapshot.method : null,
    phase: 'idle',
    role: keepMethod ? snapshot.role : null,
    network: keepMethod ? snapshot.network : 'lan',
    detail: '未连接',
    error: null,
    connection: null,
  })
}
