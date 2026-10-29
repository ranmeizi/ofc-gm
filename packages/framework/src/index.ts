export { EventTarget, Handler } from './utils/Event.decorators'
export type { EventCapable } from './utils/Event.decorators'
export { createId } from './utils/createId'

export { default as PeerConnection } from './components/Connection/PeerConnection'
export type {
  PeerRole,
  PeerNetwork,
  PeerConnectionOptions,
} from './components/Connection/PeerConnection'

export { default as Connection } from './components/Connection'
export type { ConnectionOptions, GameConnection } from './components/Connection'

export {
  LocalConnection,
  createLocalLoopback,
} from './components/Connection/LocalConnection'

export { default as Room } from './components/Room'
export type { RoomClient } from './components/Room'

export { createHostSession } from './createHostSession'
export type {
  CreateHostSessionOptions,
  HostSession,
} from './createHostSession'

export { startHost } from './startHost'
export type { StartHostOptions, HostRuntime } from './startHost'

export type {
  ServerModule,
  ClientModule,
  ServerHandle,
  ClientHandle,
} from './types/modules'
