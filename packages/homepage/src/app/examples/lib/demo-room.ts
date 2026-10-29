'use client'

import {
  createLocalLoopback,
  startHost,
  type ClientHandle,
  type ClientModule,
  type HostRuntime,
  type ServerModule,
} from '@ofc-gm/framework'

export type DemoRoom = {
  host: HostRuntime
  guest: ClientHandle
  stop: () => void
}

/**
 * 单页双座位演示：本机 host loopback + 再挂一条 guest loopback。
 * 不需要信令 / 第二标签页。
 */
export function createDemoRoom(options: {
  server: ServerModule
  hostClient: ClientModule
  guestClient: ClientModule
}): DemoRoom {
  const host = startHost({
    server: options.server,
    client: options.hostClient,
    hostPlayerId: 'host',
  })

  const { serverSide, clientSide } = createLocalLoopback()
  serverSide.connect()
  clientSide.connect()
  host.attachGuest(serverSide, 'guest')

  const guest: ClientHandle = {
    send: (data) => clientSide.send(data),
  }

  const onGuestMessage = (data: unknown) => {
    options.guestClient.onMessage?.(data)
  }
  const onGuestClose = () => {
    options.guestClient.onClose?.()
  }
  clientSide.on('message', onGuestMessage)
  clientSide.on('close', onGuestClose)
  options.guestClient.onConnect?.(guest)

  return {
    host,
    guest,
    stop() {
      clientSide.off('message', onGuestMessage)
      clientSide.off('close', onGuestClose)
      host.stop()
      try {
        clientSide.close()
      } catch {
        // ignore
      }
    },
  }
}
