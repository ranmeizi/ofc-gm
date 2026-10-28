export { EventTarget, Handler } from './utils/Event.decorators'
export type { EventCapable } from './utils/Event.decorators'
export { createId } from './utils/createId'

export { default as Server } from './Server'

export { default as PeerConnection } from './components/Connection/PeerConnection'
export type {
  PeerRole,
  PeerNetwork,
  PeerConnectionOptions,
} from './components/Connection/PeerConnection'

export { default as Connection } from './components/Connection'
export type { ConnectionOptions, GameConnection } from './components/Connection'
