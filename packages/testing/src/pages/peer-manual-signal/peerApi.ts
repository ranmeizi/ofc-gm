import {
  PeerConnection,
  type PeerNetwork,
  type PeerRole,
} from '@ofc-gm/framework'

export type { PeerRole, PeerNetwork }

export type PeerTestSession = {
  role?: PeerRole
  network: PeerNetwork
  peer: PeerConnection
}

let session: PeerTestSession | null = null

export type PeerApiHooks = {
  onChannelOpen?: () => void
  onChannelClose?: () => void
  onChannelMessage?: (data: unknown) => void
  onChannelError?: (event: Event) => void
}

let hooks: PeerApiHooks = {}

export function setPeerApiHooks(next: PeerApiHooks) {
  hooks = next
  if (session) bindHooks(session.peer)
}

function bindHooks(peer: PeerConnection) {
  peer.onChannelOpen = () => hooks.onChannelOpen?.()
  peer.onChannelClose = () => hooks.onChannelClose?.()
  peer.onChannelMessage = (data: unknown) => hooks.onChannelMessage?.(data)
  peer.onChannelError = (event: Event) => hooks.onChannelError?.(event)
}

export function createSession(network: PeerNetwork = 'lan'): PeerTestSession {
  session?.peer.destroy()
  const peer = new PeerConnection()
  peer.setNetwork(network)
  bindHooks(peer)
  session = { network, peer }
  return session
}

export function setRole(role: PeerRole) {
  if (!session) throw new Error('session not created')
  session.role = role
  session.peer.setRole(role)
}

export function setNetwork(network: PeerNetwork) {
  if (!session) throw new Error('session not created')
  session.network = network
  session.peer.setNetwork(network)
}

export async function createPeer(): Promise<void> {
  if (!session) throw new Error('session not created')
  if (!session.role) throw new Error('role not set')
  session.peer.setRole(session.role)
  session.peer.setNetwork(session.network)
  session.peer.createPeer()
}

export async function generateLocalSignal(): Promise<string> {
  if (!session?.role) throw new Error('role not set')
  const desc = await session.peer.generateSDP()
  return JSON.stringify(
    {
      type: desc.type,
      sdp: desc.sdp,
    },
    null,
    2,
  )
}

export async function acceptRemoteSignal(raw: string): Promise<void> {
  if (!session) throw new Error('session not created')
  await session.peer.acceptRemoteSDP(raw)
}

export function destroySession() {
  session?.peer.destroy()
  session = null
}

export function getSession() {
  return session
}
